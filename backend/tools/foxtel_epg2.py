import json
import logging
import os
import re
import traceback
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Set, Tuple

import requests

# Initialize a session for HTTP requests
session = requests.Session()
session.headers.update(
    {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        ),
        "authority": "www.google.com",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "Referer": "https://www.foxtel.com.au/tv-guide",
    }
)

CHANNELS_URL = "https://www.foxtel.com.au/webepg/ws/foxtel/channels?regionId=8336"

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
PROGRAM_FETCH_DAYS = 20

# Define a regular expression for cleaning text
CLEAN_TEXT_REGEX = (
    r"\[[^\]]*\]|"
    r"\b(?:S\d+(?:\s*-\s*S\d+)?)?(?:\s*Ep?\s*\d+(?:[-/]\d+)?)?\b|"
    r"\([^)]*\)"
)


def get_midnight_timestamps_utc(days: int = PROGRAM_FETCH_DAYS) -> Tuple[int, int]:
    """
    Get the midnight timestamps in UTC for today and after a number of days.

    Args:
        days (int): Number of days to add to the current date.

    Returns:
        Tuple[int, int]: A tuple containing the start and end timestamps in milliseconds.
    """
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


def build_program_url(channel_id: str, start_date: int, end_date: int) -> str:
    """
    Build the URL for fetching program data for a channel.

    Args:
        channel_id (str): The channel identifier.
        start_date (int): Start timestamp in milliseconds.
        end_date (int): End timestamp in milliseconds.

    Returns:
        str: The program data URL.
    """
    return (
        f"https://www.foxtel.com.au/webepg/ws/foxtel/channel/{channel_id}/events?"
        f"movieHeight=110&tvShowHeight=90&startDate={start_date}&endDate={end_date}&regionID=8336"
    )


def build_event_url(event: int) -> str:
    return f"https://www.foxtel.com.au/webepg/ws/foxtel/event/{event}?movieHeight=213&tvShowHeight=213&regionId=8336"


def clean_text(text: str) -> str:
    """
    Cleans the input text by removing control characters, episode information,
    and text within square brackets or parentheses.

    Args:
        text (str): The text to clean.

    Returns:
        str: The cleaned text.
    """
    if not text:
        return "N/A"
    # Remove control characters and unwanted patterns
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C")
    text = re.sub(CLEAN_TEXT_REGEX, "", text)
    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text if text else "N/A"


def fetch_and_save_logo(channel_logo: str, save_path: str) -> None:
    """
    Fetches and saves the channel logo to the specified path.

    Args:
        channel_logo (str): The URL of the channel logo.
        save_path (str): The local file path to save the logo.
    """
    if not os.path.exists(save_path):
        try:
            response = session.get(channel_logo, timeout=10)
            response.raise_for_status()
            with open(save_path, "wb") as f:
                f.write(response.content)
        except requests.exceptions.RequestException as e:
            logging.error(
                f"Error fetching logo from {channel_logo}: {str(e)}\n{traceback.format_exc()}"
            )


def load_existing_event_ids() -> Set[int]:
    """
    Load existing event IDs from the PROGRAMS_FILE.

    Returns:
        Set[int]: A set of existing event IDs.
    """
    try:
        with open(
            os.path.join(DATA_LOCATION, PROGRAMS_FILE), "r", encoding="utf-8"
        ) as f:
            existing_programs = json.load(f)
        return set(
            program["event_id"]
            for program in existing_programs
            if "event_id" in program
        )
    except (FileNotFoundError, json.JSONDecodeError):
        return set()


def clear_log_file():
    """
    Clear the contents of the log file.
    """
    log_file_path = os.path.join(DATA_LOCATION, ERROR_LOG_FILE)
    try:
        open(log_file_path, "w").close()
        print(f"Cleared log file: {log_file_path}")
    except IOError as e:
        print(f"Error clearing log file: {str(e)}")


def process_channel(
    channel: Dict, existing_event_ids: Set[int]
) -> Tuple[Optional[Dict], List[Dict]]:
    """
    Processes a channel to fetch its logo and program data.

    Args:
        channel (Dict): The channel data.
        existing_event_ids (Set[int]): Set of existing event IDs.

    Returns:
        Tuple[Optional[Dict], List[Dict]]: The channel data and list of programs.
    """
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

        response = session.get(program_url, timeout=10)
        response.raise_for_status()
        program_data = response.json()

        programs = []
        if "events" in program_data:
            for event in program_data["events"]:
                try:
                    event_id = event.get("eventId", 0)

                    # # Skip if event_id already exists
                    # if event_id in existing_event_ids:
                    #     logging.info(f"Skipping existing event_id: {event_id}")
                    #     continue

                    # event_url = build_event_url(event_id)
                    # er = session.get(event_url, timeout=10)
                    # er.raise_for_status()
                    # event_data = er.json()

                    # if isinstance(event_data.get("event"), dict):
                    #     ev = event_data["event"]
                    #     desc = ev.get("mergedSynopsis", "N/A")
                    #     genre = ev.get("genre", "N/A")
                    #     subgenre = ev.get("subGenre", "N/A")
                    #     categories = (
                    #         [genre, subgenre]
                    #         if genre != "N/A" or subgenre != "N/A"
                    #         else ["N/A"]
                    #     )
                    # else:
                    #     desc = "N/A"
                    #     categories = ["N/A"]
                    desc = "N/A"
                    categories = ["N/A"]
                    scheduled_date = event.get("scheduledDate", 0)
                    start_time = datetime.fromtimestamp(
                        scheduled_date / 1000.0, tz=timezone.utc
                    )
                    duration = event.get("duration", 0)
                    end_time = start_time + timedelta(minutes=duration)
                    title = clean_text(event.get("programTitle", "N/A"))
                    subtitle = clean_text(event.get("episodeTitle", "N/A"))
                    categories = event.get("genres", ["N/A"])
                    original_air_date = event.get("originalAirDate", "N/A")
                    rating = event.get("parentalRating", "N/A")
                    series = event.get("seriesNumber", "N/A")
                    episode = event.get("episodeNumber", "N/A")
                    if series != "N/A" and episode != "N/A":
                        seriesep = f"S{series}E{episode}"
                    elif series != "N/A":
                        seriesep = f"S{series}"
                    else:
                        seriesep = "N/A"

                    programs.append(
                        {
                            "start_time": start_time.isoformat(),
                            "start": "N/A",
                            "end_time": end_time.isoformat(),
                            "end": "N/A",
                            "length": str(duration),
                            "channel": channel_slug,
                            "title": title,
                            "subtitle": subtitle,
                            "description": desc,
                            "categories": categories,
                            "episode": seriesep,
                            "original_air_date": original_air_date,
                            "rating": rating,
                            "event_id": event_id,
                        }
                    )
                except Exception as e:
                    logging.error(
                        f"Error processing event for channel {channel_slug}: {str(e)}\n{traceback.format_exc()}"
                    )

        logging.info(f"Successfully processed channel {channel_slug}")
        return channel_data, programs
    except requests.exceptions.RequestException as e:
        logging.error(
            f"Error fetching data for channel {channel_slug}: {str(e)}\n{traceback.format_exc()}"
        )
        return None, []


def main():
    """
    Main function to fetch, process, and save channel and program data.
    """
    os.makedirs(DATA_LOCATION, exist_ok=True)
    os.makedirs(LOGO_LOCATION, exist_ok=True)

    clear_log_file()

    # Configure logging
    logging.basicConfig(
        filename=os.path.join(DATA_LOCATION, ERROR_LOG_FILE),
        level=logging.INFO,
        format="%(asctime)s: %(levelname)s: %(message)s",
    )

    logging.info("Starting the data fetching process.")

    # Load existing event IDs
    existing_event_ids = load_existing_event_ids()
    logging.info(f"Loaded {len(existing_event_ids)} existing event IDs.")

    try:
        response = session.get(CHANNELS_URL, timeout=10)
        response.raise_for_status()
        channels_data = response.json()["channels"]
        logging.info("Fetched channel data successfully.")
    except requests.exceptions.RequestException as e:
        logging.error(
            f"Error fetching channels data: {str(e)}\n{traceback.format_exc()}"
        )
        return

    all_channels = []
    all_programs = []

    logging.info("Starting to process channels.")

    # Use a thread pool to process channels concurrently
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_channel = {
            executor.submit(process_channel, channel, existing_event_ids): channel
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
                logging.error(
                    f"Channel processing generated an exception for channel {channel['channelTag']}: {str(exc)}\n{traceback.format_exc()}"
                )

    # Save the processed data to JSON files
    try:
        with open(
            os.path.join(DATA_LOCATION, CHANNELS_FILE), "w", encoding="utf-8"
        ) as f:
            json.dump(all_channels, f, ensure_ascii=False, indent=4)
        logging.info("Successfully saved channel data.")
    except IOError as e:
        logging.error(f"Error writing channels file: {str(e)}")

    try:
        # Load existing programs
        try:
            with open(
                os.path.join(DATA_LOCATION, PROGRAMS_FILE), "r", encoding="utf-8"
            ) as f:
                existing_programs = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_programs = []

        # Create a set of new event IDs
        new_event_ids = set(p["event_id"] for p in all_programs)

        # Filter out existing programs that are not in the new data
        existing_programs = [
            prog for prog in existing_programs if prog["event_id"] not in new_event_ids
        ]

        # Merge new programs with existing ones
        all_programs.extend(existing_programs)

        with open(
            os.path.join(DATA_LOCATION, PROGRAMS_FILE), "w", encoding="utf-8"
        ) as f:
            json.dump(all_programs, f, ensure_ascii=False, indent=4)
        logging.info("Successfully saved program data.")
    except IOError as e:
        logging.error(f"Error writing programs file: {str(e)}")

    logging.info("Data fetching process completed.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.info("Program interrupted by user.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.info("Program interrupted by user.")
