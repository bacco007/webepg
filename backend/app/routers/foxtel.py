import asyncio
import json
import logging
import os
import re
import traceback
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

import aiohttp
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

# Constants
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
PROGRAM_FETCH_DAYS = 20
CLEAN_TEXT_REGEX = (
    r"\[[^\]]*\]|"
    r"\b(?:S\d+(?:\s*-\s*S\d+)?)?(?:\s*Ep?\s*\d+(?:[-/]\d+)?)?\b|"
    r"$$[^)]*$$"
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "authority": "www.google.com",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "Referer": "https://www.foxtel.com.au/tv-guide",
}

# Global variable to store process status
process_status: Dict[str, Any] = {
    "is_running": False,
    "start_time": None,
    "end_time": None,
    "current_source": None,
    "processed_sources": [],
    "errors": [],
}


class FileStatus(BaseModel):
    status: str
    date: str


class SourceStatus(BaseModel):
    source_file: FileStatus
    channels: FileStatus
    programs: FileStatus
    group: Optional[str] = None
    subgroup: Optional[str] = None
    location: Optional[str] = None


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


def build_program_url(channel_id: str, start_date: int, end_date: int) -> str:
    return (
        f"https://www.foxtel.com.au/webepg/ws/foxtel/channel/{channel_id}/events?"
        f"movieHeight=110&tvShowHeight=90&startDate={start_date}&endDate={end_date}&regionID=8336"
    )


def build_event_url(event: int) -> str:
    return f"https://www.foxtel.com.au/webepg/ws/foxtel/event/{event}?movieHeight=213&tvShowHeight=213&regionId=8336"


def clean_text(text: str) -> str:
    if not text:
        return "N/A"
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C")
    text = re.sub(CLEAN_TEXT_REGEX, "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text if text else "N/A"


async def fetch_and_save_logo(
    session: aiohttp.ClientSession, channel_logo: str, save_path: str
) -> None:
    if not os.path.exists(save_path):
        try:
            async with session.get(
                channel_logo, headers=HEADERS, timeout=10
            ) as response:
                response.raise_for_status()
                content = await response.read()
                with open(save_path, "wb") as f:
                    f.write(content)
        except Exception as e:
            logging.error(
                f"Error fetching logo from {channel_logo}: {str(e)}\n{traceback.format_exc()}"
            )


def load_existing_event_ids() -> Set[int]:
    try:
        with open(
            os.path.join(DATA_LOCATION, PROGRAMS_FILE), "r", encoding="utf-8"
        ) as f:
            existing_programs = json.load(f)
        return {
            program["event_id"]
            for program in existing_programs
            if "event_id" in program
        }
    except (FileNotFoundError, json.JSONDecodeError):
        return set()


def clear_log_file():
    log_file_path = os.path.join(DATA_LOCATION, ERROR_LOG_FILE)
    try:
        open(log_file_path, "w").close()
        print(f"Cleared log file: {log_file_path}")
    except IOError as e:
        print(f"Error clearing log file: {str(e)}")


async def process_channel(
    session: aiohttp.ClientSession, channel: Dict, existing_event_ids: Set[int]
) -> Tuple[Optional[Dict], List[Dict]]:
    channel_tag = channel["channelTag"]
    channel_slug = f"foxtel-{channel_tag.lower()}"
    logo_path = os.path.join(LOGO_LOCATION, f"{channel_slug}.png")

    try:
        await fetch_and_save_logo(session, channel["channelImages"]["hq"], logo_path)

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

        async with session.get(program_url, headers=HEADERS, timeout=10) as response:
            response.raise_for_status()
            program_data = await response.json()

        programs = []
        if "events" in program_data:
            for event in program_data["events"]:
                try:
                    event_id = event.get("eventId", 0)
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
    except Exception as e:
        logging.error(
            f"Error fetching data for channel {channel_slug}: {str(e)}\n{traceback.format_exc()}"
        )
        return None, []


async def process_all_channels(session: aiohttp.ClientSession):
    global process_status
    process_status["is_running"] = True
    process_status["start_time"] = datetime.now().isoformat()
    process_status["processed_sources"] = []
    process_status["errors"] = []

    try:
        async with session.get(CHANNELS_URL, headers=HEADERS, timeout=10) as response:
            response.raise_for_status()
            channels_data = (await response.json())["channels"]
        logging.info("Fetched channel data successfully.")
    except Exception as e:
        logging.error(
            f"Error fetching channels data: {str(e)}\n{traceback.format_exc()}"
        )
        process_status["is_running"] = False
        process_status["end_time"] = datetime.now().isoformat()
        return

    existing_event_ids = load_existing_event_ids()
    all_channels = []
    all_programs = []

    for channel in channels_data:
        process_status["current_source"] = channel["channelTag"]
        channel_data, programs = await process_channel(
            session, channel, existing_event_ids
        )
        if channel_data:
            all_channels.append(channel_data)
            all_programs.extend(programs)
        await asyncio.sleep(2)  # 2-second pause between processing channels

    try:
        with open(
            os.path.join(DATA_LOCATION, CHANNELS_FILE), "w", encoding="utf-8"
        ) as f:
            json.dump(all_channels, f, ensure_ascii=False, indent=4)
        logging.info("Successfully saved channel data.")
    except IOError as e:
        logging.error(f"Error writing channels file: {str(e)}")

    try:
        with open(
            os.path.join(DATA_LOCATION, PROGRAMS_FILE), "r", encoding="utf-8"
        ) as f:
            existing_programs = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_programs = []

    new_event_ids = {p["event_id"] for p in all_programs}
    existing_programs = [
        prog for prog in existing_programs if prog["event_id"] not in new_event_ids
    ]
    all_programs.extend(existing_programs)

    try:
        with open(
            os.path.join(DATA_LOCATION, PROGRAMS_FILE), "w", encoding="utf-8"
        ) as f:
            json.dump(all_programs, f, ensure_ascii=False, indent=4)
        logging.info("Successfully saved program data.")
    except IOError as e:
        logging.error(f"Error writing programs file: {str(e)}")

    process_status["is_running"] = False
    process_status["end_time"] = datetime.now().isoformat()
    process_status["current_source"] = None


@router.get("/py/foxtel/sources")
async def get_sources() -> List[Dict[str, Any]]:
    # This is a placeholder. You'll need to implement the actual source loading logic.
    return []


@router.get("/py/foxtel/sources/status")
async def get_sources_status() -> Dict[str, SourceStatus]:
    # This is a placeholder. You'll need to implement the actual status checking logic.
    return {}


@router.get("/py/foxtel/process-sources")
async def process_sources(background_tasks: BackgroundTasks) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Process is already running", "status": process_status}
        )

    async def run_process():
        async with aiohttp.ClientSession(headers=HEADERS) as session:
            await process_all_channels(session)

    background_tasks.add_task(run_process)
    return JSONResponse(
        {"message": "Processing sources in the background", "status": process_status}
    )


@router.get("/py/foxtel/process-status")
async def get_process_status() -> Dict[str, Any]:
    global process_status
    return process_status


@router.get("/py/foxtel/process-source/{source_id}")
@router.post("/py/foxtel/process-source/{source_id}")
async def process_single_source(
    source_id: str, background_tasks: BackgroundTasks
) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Another process is already running", "status": process_status}
        )

    # This is a placeholder. You'll need to implement the logic to process a single source.
    return JSONResponse(
        {
            "message": f"Processing source {source_id} in the background",
            "status": process_status,
        }
    )


# Initialize the application
def init_app():
    os.makedirs(DATA_LOCATION, exist_ok=True)
    os.makedirs(LOGO_LOCATION, exist_ok=True)
    clear_log_file()
    logging.basicConfig(
        filename=os.path.join(DATA_LOCATION, ERROR_LOG_FILE),
        level=logging.INFO,
        format="%(asctime)s: %(levelname)s: %(message)s",
    )


# Call init_app when your FastAPI application starts
init_app()
