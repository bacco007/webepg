import json
import os
import re
import traceback
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import requests

CHANNELS_URL = "https://www.foxtel.com.au/webepg/ws/foxtel/channels?regionId=8336"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
}

CATEGORY_MAP = {
    "1": "Movies",
    "2": "News & Weather",
    "3": "Sport",
    "4": "Kids & Family",
    "5": "Entertainment and Documentaries",
    "6": "Music & Radio",
    "8": "Special Interest",
    "13": "4K & HD Channels",
}

DATA_LOCATION = "xmltvdata/remote"
LOGO_LOCATION = "xmltvdata/logos"
CHANNELS_FILE = "foxtel_channels.json"
PROGRAMS_FILE = "foxtel_programs.json"
ERROR_LOG_FILE = "foxtel_error_log.txt"

# Define a constant for the number of days to fetch programs
PROGRAM_FETCH_DAYS = 12

# Define a regular expression for cleaning text
CLEAN_TEXT_REGEX = (
    r"\[[^\]]*\]|\b(?:S\d+(?:\s*-\s*S\d+)?)?(?:\s*Ep?\s*\d+(?:[-/]\d+)?)?\b|\([^)]*\)"
)


# Define a function to get midnight timestamps in UTC
def get_midnight_timestamps_utc(days: int = PROGRAM_FETCH_DAYS) -> Tuple[int, int]:
    now_utc = datetime.now(timezone.utc)
    midnight_today_utc = datetime.combine(
        now_utc.date(), datetime.min.time(), tzinfo=timezone.utc
    )
    midnight_later_utc = midnight_today_utc + timedelta(days=days)

    epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
    return (
        int((midnight_today_utc - epoch).total_seconds() * 1000),
        int((midnight_later_utc - epoch).total_seconds() * 1000),
    )


# Define a function to build the program URL
def build_program_url(channel_id: str, start_date: int, end_date: int) -> str:
    return f"https://www.foxtel.com.au/webepg/ws/foxtel/channel/{channel_id}/events?movieHeight=110&tvShowHeight=90&startDate={start_date}&endDate={end_date}&regionID=8336"


# Define a function to clean text
def clean_text(text: str) -> str:
    if not text:
        return "N/A"
    # Remove control characters and text within square brackets, episode information, and parentheses
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C")
    text = re.sub(CLEAN_TEXT_REGEX, "", text)
    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text if text else "N/A"


# Define a function to fetch and save the logo
def fetch_and_save_logo(channel_logo: str, save_path: str) -> None:
    if not os.path.exists(save_path):
        try:
            response = requests.get(channel_logo, headers=HEADERS, timeout=10)
            response.raise_for_status()
            with open(save_path, "wb") as f:
                f.write(response.content)
        except requests.exceptions.RequestException as e:
            log_error(
                f"Error fetching logo from {channel_logo}:",
                str(e),
                traceback.format_exc(),
            )


# Define a function to process a channel
def process_channel(channel: Dict) -> Tuple[Optional[Dict], List[Dict]]:
    channel_tag = channel["channelTag"]
    channel_slug = f"foxtel-{channel_tag.lower()}"
    logo_path = os.path.join(LOGO_LOCATION, f"{channel_slug}.png")

    try:
        fetch_and_save_logo(channel["channelImages"]["hq"], logo_path)

        channel_data = {
            "channel_id": channel_slug,
            "channel_slug": channel_slug,
            "channel_name": channel["name"],
            "channel_number": str(channel["number"]),
            "chlogo": f"/logos/{channel_slug}.png",
            "channel_group": CATEGORY_MAP.get(
                str(channel["channelCategoryId"]), "Unknown"
            ),
        }

        start_date, end_date = get_midnight_timestamps_utc()
        program_url = build_program_url(channel_tag, start_date, end_date)

        response = requests.get(program_url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        program_data = response.json()

        programs = []
        if "events" in program_data:
            for event in program_data["events"]:
                try:
                    start_time = datetime.fromtimestamp(
                        event.get("scheduledDate", 0) / 1000.0, tz=timezone.utc
                    )
                    duration = event.get("duration", 0)
                    end_time = start_time + timedelta(minutes=duration)
                    title = clean_text(event.get("programTitle", "N/A"))
                    subtitle = clean_text(event.get("episodeTitle", "N/A"))
                    programs.append(
                        {
                            "start_time": start_time.isoformat(),
                            "start": "N/A",
                            "end_time": end_time.isoformat(),
                            "end": "N/A",
                            "length": duration,
                            "channel": channel_slug,
                            "title": title,
                            "subtitle": subtitle,
                            "description": "N/A",
                            "categories": ["N/A"],
                            "episode": "N/A",
                            "original_air_date": "N/A",
                            "rating": event.get("parentalRating", "N/A"),
                        }
                    )
                except Exception as e:
                    log_error(
                        f"Error processing event for channel {channel_slug}:",
                        str(e),
                        traceback.format_exc(),
                    )

        return channel_data, programs
    except requests.exceptions.RequestException as e:
        log_error(
            f"Error fetching data for channel {channel_slug}:",
            str(e),
            traceback.format_exc(),
        )
        return None, []


# Define a function to log errors
def log_error(message: str, error: str, trace: str) -> None:
    with open(os.path.join(DATA_LOCATION, ERROR_LOG_FILE), "a") as f:
        f.write(f"{datetime.now().isoformat()}: {message}\n")
        f.write(f"Error: {error}\n")
        f.write(f"Traceback: {trace}\n\n")


# Define the main function
def main():
    os.makedirs(DATA_LOCATION, exist_ok=True)
    os.makedirs(LOGO_LOCATION, exist_ok=True)

    try:
        response = requests.get(CHANNELS_URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
        channels_data = response.json()["channels"]
    except requests.exceptions.RequestException as e:
        log_error("Error fetching channels data:", str(e), traceback.format_exc())
        return

    all_channels = []
    all_programs = []

    # Use a thread pool to process channels concurrently
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_to_channel = {
            executor.submit(process_channel, channel): channel
            for channel in channels_data
        }
        for future in as_completed(future_to_channel):
            channel = future_to_channel[future]
            try:
                channel_data, programs = future.result()
                if channel_data:
                    all_channels.append(channel_data)
                    all_programs.extend(programs)
            except Exception as exc:
                log_error(
                    f"Channel processing generated an exception for channel {channel['channelTag']}:",
                    str(exc),
                    traceback.format_exc(),
                )

    # Save the processed data to JSON files
    with open(os.path.join(DATA_LOCATION, CHANNELS_FILE), "w", encoding="utf-8") as f:
        json.dump(all_channels, f, ensure_ascii=False, indent=4)

    with open(os.path.join(DATA_LOCATION, PROGRAMS_FILE), "w", encoding="utf-8") as f:
        json.dump(all_programs, f, ensure_ascii=False, indent=4)


# Run the main function if the script is executed
if __name__ == "__main__":
    main()
