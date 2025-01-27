import json
import logging
import os
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp
import pytz
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings

router = APIRouter()

# Constants
CHANNELS_URL = (
    "https://sport.optus.com.au/api/metadata/editorials/v2/home_live_matches/web"
)
DATA_LOCATION = settings.XMLTV_DATA_DIR
CHANNELS_FILE = "OPTSPT_channels.json"
PROGRAMS_FILE = "OPTSPT_programs.json"
ERROR_LOG_FILE = os.path.join(DATA_LOCATION, "xmlepg_error_log.txt")

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


async def fetch_data(url: str) -> Dict:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response.raise_for_status()
            return await response.json()


def process_channels(data: Dict) -> List[Dict[str, Any]]:
    channels: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {
            "guidelink": "",
            "channel_id": "",
            "channel_slug": "",
            "channel_name": "",
            "channel_url": "https://sport.optus.com.au",
            "channel_number": "",
            "channel_group": "Optus Sport",
            "chlogo": "https://i.imgur.com/fKAgFp0.png",
            "program_count": 0,
            "channel_logo": {
                "light": "https://i.imgur.com/fKAgFp0.png",
                "dark": "https://i.imgur.com/fKAgFp0.png",
            },
            "channel_names": {"clean": "", "location": "", "real": ""},
            "other_data": {"channel_type": "Sport", "channel_specs": "HD"},
        }
    )

    for asset in data.get("assets", []):
        channel = asset.get("channel", {})
        if channel:
            channel_id = channel.get("id", "")
            channel_name = channel.get("name", "")

            channels[channel_id]["guidelink"] = channel_id
            channels[channel_id]["channel_id"] = channel_id
            channels[channel_id]["channel_slug"] = channel_id.lower().replace(" ", "-")
            channels[channel_id]["channel_name"] = channel_name
            channels[channel_id]["channel_number"] = channel_id.replace("os", "")
            channels[channel_id]["channel_names"]["clean"] = channel_name
            channels[channel_id]["channel_names"]["location"] = channel_name
            channels[channel_id]["channel_names"]["real"] = channel_name
            channels[channel_id]["program_count"] += 1

    return list(channels.values())


async def process_programs(
    data: Dict, channels: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    programs = []
    async with aiohttp.ClientSession() as session:
        for channel in channels:
            channel_id = channel["channel_id"]
            epg_url = f"https://epg.optusvideo.tv/api/channels/{channel_id}?mergeAttrs=true&tz=UTC"
            try:
                async with session.get(epg_url) as response:
                    epg_data = await response.json()
                events = (
                    epg_data.get("epg", {})
                    .get("DVB-EPG", {})
                    .get("Service", {})
                    .get("Event", [])
                )
                if not isinstance(events, list):
                    events = [events]

                for event in events:
                    start_time = datetime.fromisoformat(
                        event.get("start", "").replace("Z", "+00:00")
                    ).replace(tzinfo=pytz.UTC)
                    end_time = datetime.fromisoformat(
                        event.get("stop", "").replace("Z", "+00:00")
                    ).replace(tzinfo=pytz.UTC)

                    extended_event = event.get("ExtendedEventDescriptor", {})
                    items = extended_event.get("Item", [])
                    if not isinstance(items, list):
                        items = [items]

                    title = next(
                        (
                            item["_"]
                            for item in items
                            if item.get("description") == "Program Title"
                        ),
                        event.get("name", ""),
                    )
                    subtitle = next(
                        (
                            item["_"]
                            for item in items
                            if item.get("description") == "Episode Title"
                        ),
                        "",
                    )
                    description = extended_event.get("Text", {}).get(
                        "_",
                        event.get("ShortEventDescriptor", {})
                        .get("Text", {})
                        .get("_", ""),
                    )

                    program = {
                        "guideid": f"{channel_id}_{start_time.strftime('%Y%m%d%H%M%S')}",
                        "start_time": start_time.isoformat(),
                        "start": start_time.strftime("%H:%M:%S"),
                        "end_time": end_time.isoformat(),
                        "end": end_time.strftime("%H:%M:%S"),
                        "length": str(end_time - start_time),
                        "channel": channel_id,
                        "title": title,
                        "subtitle": subtitle,
                        "description": description,
                        "categories": ["Sport"],
                        "original_air_date": "N/A",
                        "rating": event.get("ParentalRatingDescriptor", {}).get(
                            "rating", "E"
                        ),
                    }
                    programs.append(program)
            except Exception as e:
                logging.error(
                    f"Error fetching EPG data for channel {channel_id}: {str(e)}"
                )

    # Process the original data
    for asset in data.get("assets", []):
        start_time = datetime.fromisoformat(
            asset.get("broadcastStartTime", "").replace("Z", "+00:00")
        ).replace(tzinfo=pytz.UTC)
        end_time = datetime.fromisoformat(
            asset.get("broadcastEndTime", "").replace("Z", "+00:00")
        ).replace(tzinfo=pytz.UTC)

        # Check if a program already exists for this time period
        if not any(
            p["channel"] == asset.get("channel", {}).get("id", "")
            and start_time
            <= datetime.fromisoformat(p["start_time"]).replace(tzinfo=pytz.UTC)
            < end_time
            for p in programs
        ):
            categories = ["Sport"]
            for tag in asset.get("cmsTags", []):
                if tag["key"] == "SPORT" or tag["key"] == "COMPETITION":
                    categories.extend(tag["values"])

            program = {
                "guideid": f"{asset.get('id', '')}auepg{start_time.strftime('%Y%m%d%H%M%S')}",
                "start_time": start_time.isoformat(),
                "start": start_time.strftime("%H:%M:%S"),
                "end_time": end_time.isoformat(),
                "end": end_time.strftime("%H:%M:%S"),
                "length": str(end_time - start_time),
                "channel": asset.get("channel", {}).get("id", ""),
                "title": asset.get("title", ""),
                "subtitle": asset.get("categoryTitle", "N/A"),
                "description": asset.get("seoTitle", ""),
                "categories": list(set(categories)),
                "original_air_date": "N/A",
                "rating": "E",
            }
            programs.append(program)

    return programs


async def process_all_data() -> None:
    global process_status
    process_status["is_running"] = True
    process_status["start_time"] = datetime.now().isoformat()

    try:
        data = await fetch_data(CHANNELS_URL)
        channels = process_channels(data)
        programs = await process_programs(data, channels)

        os.makedirs(DATA_LOCATION, exist_ok=True)

        with open(
            os.path.join(DATA_LOCATION, CHANNELS_FILE), "w", encoding="utf-8"
        ) as f:
            json.dump(channels, f, ensure_ascii=False, indent=2)
        logging.info(f"Saved {len(channels)} channels to {CHANNELS_FILE}")

        with open(
            os.path.join(DATA_LOCATION, PROGRAMS_FILE), "w", encoding="utf-8"
        ) as f:
            json.dump(programs, f, ensure_ascii=False, indent=2)
        logging.info(f"Saved {len(programs)} programs to {PROGRAMS_FILE}")

        process_status["processed_sources"].append(CHANNELS_URL)
        process_status["message"] = "Data processing completed successfully"
    except Exception as e:
        error_message = f"Error during data processing: {str(e)}"
        logging.error(error_message)
        process_status["errors"].append(error_message)
        process_status["message"] = "Data processing failed"
    finally:
        process_status["is_running"] = False
        process_status["end_time"] = datetime.now().isoformat()
        process_status["current_source"] = None


@router.get("/py/optus/sources")
async def get_sources() -> List[Dict[str, Any]]:
    return [{"id": "optus", "name": "Optus Sport", "url": CHANNELS_URL}]


@router.get("/py/optus/sources/status")
async def get_sources_status() -> Dict[str, SourceStatus]:
    channels_status = FileStatus(status="N/A", date="N/A")
    programs_status = FileStatus(status="N/A", date="N/A")

    channels_path = os.path.join(DATA_LOCATION, CHANNELS_FILE)
    programs_path = os.path.join(DATA_LOCATION, PROGRAMS_FILE)

    if os.path.exists(channels_path):
        channels_status.status = "Available"
        channels_status.date = datetime.fromtimestamp(
            os.path.getmtime(channels_path)
        ).isoformat()

    if os.path.exists(programs_path):
        programs_status.status = "Available"
        programs_status.date = datetime.fromtimestamp(
            os.path.getmtime(programs_path)
        ).isoformat()

    return {
        "optus": SourceStatus(
            source_file=FileStatus(status="N/A", date="N/A"),
            channels=channels_status,
            programs=programs_status,
            group="Sport",
            subgroup="Optus Sport",
            location="Australia",
        )
    }


@router.get("/py/optus/process-sources")
async def process_sources(background_tasks: BackgroundTasks) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Process is already running", "status": process_status}
        )

    background_tasks.add_task(process_all_data)
    return JSONResponse(
        {"message": "Processing sources in the background", "status": process_status}
    )


@router.get("/py/optus/process-status")
async def get_process_status() -> Dict[str, Any]:
    global process_status
    return process_status


@router.get("/py/optus/process-source/{source_id}")
@router.post("/py/optus/process-source/{source_id}")
async def process_single_source(
    source_id: str, background_tasks: BackgroundTasks
) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Another process is already running", "status": process_status}
        )

    if source_id != "optus":
        return JSONResponse(
            {"message": "Invalid source ID", "status": process_status}, status_code=400
        )

    background_tasks.add_task(process_all_data)
    return JSONResponse(
        {
            "message": f"Processing source {source_id} in the background",
            "status": process_status,
        }
    )


def init_app() -> None:
    os.makedirs(DATA_LOCATION, exist_ok=True)
    logging.basicConfig(
        filename=ERROR_LOG_FILE,
        level=logging.INFO,
        format="%(asctime)s: %(levelname)s: %(message)s",
    )


# Call init_app when your FastAPI application starts
init_app()
