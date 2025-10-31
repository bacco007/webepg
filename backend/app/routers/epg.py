from collections import defaultdict
from datetime import datetime, timedelta
from datetime import timezone as tz
from typing import Any, DefaultDict, Dict, List

import pytz
from fastapi import APIRouter, Path, Query
from pydantic import BaseModel

from app.exceptions import (
    InvalidDateFormatError,
    InvalidTimezoneError,
    ProgrammingNotFoundError,
    SourceNotFoundError,
)
from app.utils.file_operations import load_json
from app.utils.time_utils import (
    adjust_programming,
    group_and_fill_programs,
    group_and_fill_programschannels,
)

router = APIRouter()


class ChannelInfo(BaseModel):
    id: str
    name: str
    icon: str
    slug: str
    lcn: str
    group: str


def program_overlaps_date(
    program: Dict[str, Any], date_str: str, target_timezone: pytz.tzinfo.BaseTzInfo
) -> bool:
    def parse_datetime(dt_string: str) -> datetime:
        dt = datetime.fromisoformat(dt_string.replace("Z", "+00:00"))
        return dt.astimezone(pytz.utc) if dt.tzinfo is None else dt

    start = parse_datetime(program["start_time"])
    end = parse_datetime(program["end_time"])
    date = datetime.strptime(date_str, "%Y-%m-%d")
    date_start = target_timezone.localize(
        date.replace(hour=0, minute=0, second=0, microsecond=0)
    )
    date_end = target_timezone.localize(
        date.replace(hour=23, minute=59, second=59, microsecond=999999)
    )

    return (
        start.astimezone(target_timezone) <= date_end
        and end.astimezone(target_timezone) >= date_start
    )


def get_all_channels(channels_data: List[Dict[str, Any]]) -> List[str]:
    return [channel["channel_slug"] for channel in channels_data]


def parse_datetime(datetime_str: str, timezone: pytz.tzinfo.BaseTzInfo) -> datetime:
    dt = datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
    return dt.astimezone(timezone)


def is_sports_program(program: Dict[str, Any]) -> bool:
    if "categories" in program:
        categories = " ".join(cat.lower() for cat in program["categories"])
        sports_keywords = [
            "sports",
            "sport",
            "athletic",
            "match",
            "race",
            "tournament",
        ]
        return any(keyword in categories for keyword in sports_keywords)
    return False


def is_movies_program(program: Dict[str, Any]) -> bool:
    if "categories" in program:
        categories = " ".join(cat.lower() for cat in program["categories"])
        movies_keywords = [
            "movie",
        ]
        return any(keyword in categories for keyword in movies_keywords)
    return False


@router.get(
    "/py/epg/channels/{id}/{channel}",
    summary="Get Programming by Channel",
    description="Retrieve electronic program guide data for a specific channel, grouped by date.",
    response_description="Programming data grouped by date",
    responses={
        200: {
            "description": "Programming data retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "date_pulled": "2024-01-15T10:30:00.000000",
                        "query": "epg/channels",
                        "source": "xmltvnet",
                        "channel": {
                            "channel_id": "channel1",
                            "channel_name": "Channel One",
                            "channel_slug": "channel-1"
                        },
                        "programs": {
                            "2024-01-15": [
                                {
                                    "start_time": "2024-01-15 06:00:00",
                                    "end_time": "2024-01-15 07:00:00",
                                    "title": "Morning News",
                                    "description": "Latest news updates"
                                }
                            ]
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid timezone or request parameters"},
        404: {"description": "Channel or programming data not found"}
    }
)
async def get_programming_by_channel(
    id: str = Path(..., description="Source identifier", example="xmltvnet"),
    channel: str = Path(..., description="Channel slug identifier", example="channel-1"),
    timezone: str = Query(
        "UTC",
        description="Timezone for adjusting program times (e.g., 'Australia/Sydney', 'UTC')",
        example="Australia/Sydney"
    ),
) -> Dict[str, Any]:
    """
    Get programming schedule for a specific channel.
    
    Returns program listings grouped by date, with times adjusted to the specified timezone.
    Programs are automatically filled to show 24-hour coverage.
    
    **Parameters:**
    - **id**: Source identifier
    - **channel**: Channel slug (e.g., 'channel-1', 'abc-tv')
    - **timezone**: IANA timezone name (default: 'UTC')
    
    **Example Request:**
    ```
    GET /api/py/epg/channels/xmltvnet/channel-1?timezone=Australia/Sydney
    ```
    """
    try:
        programs_data = load_json(f"{id}_programs.json")
        channels_data = load_json(f"{id}_channels.json")
    except FileNotFoundError as err:
        raise SourceNotFoundError(id) from err
    except Exception as err:
        from app.exceptions import DataProcessingError
        raise DataProcessingError("loading source data", str(err)) from err

    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.exceptions.UnknownTimeZoneError as err:
        raise InvalidTimezoneError(timezone) from err

    channel_metadata = next(
        (ch for ch in channels_data if ch.get("channel_slug") == channel), None
    )
    filtered_programming = [
        program for program in programs_data if program.get("channel") == channel
    ]

    if not filtered_programming or not channel_metadata:
        raise ProgrammingNotFoundError(
            f"No programming or channel metadata found for channel: {channel}"
        )

    adjusted_programming = adjust_programming(filtered_programming, target_timezone)
    grouped_programs = group_and_fill_programs(adjusted_programming, target_timezone)

    return {
        "date_pulled": datetime.now(tz.utc).isoformat(),
        "query": "epg/channels",
        "source": id,
        "channel": channel_metadata,
        "programs": dict(grouped_programs),
    }


@router.get(
    "/py/epg/date/{date}/{source}",
    summary="Get Programming by Date",
    description="Retrieve programming schedule for all channels on a specific date.",
    response_description="Programming data for all channels on the specified date",
    responses={
        200: {
            "description": "Programming data retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "date_pulled": "2024-01-15T10:30:00.000000",
                        "query": "epg/date",
                        "source": "xmltvnet",
                        "date": "2024-01-15",
                        "channels": [
                            {
                                "channel": {
                                    "id": "channel1",
                                    "name": "Channel One",
                                    "slug": "channel-1"
                                },
                                "programs": []
                            }
                        ]
                    }
                }
            }
        },
        400: {"description": "Invalid date format or timezone"},
        404: {"description": "No programming found for the specified date"}
    }
)
async def get_programming_by_date(
    date: str = Path(
        ...,
        description="Date in YYYYMMDD format (e.g., 20240115)",
        example="20240115",
        regex="^[0-9]{8}$"
    ),
    source: str = Path(..., description="Source identifier", example="xmltvnet"),
    timezone: str = Query(
        "UTC",
        description="Timezone for adjusting program times",
        example="Australia/Sydney"
    ),
) -> Dict[str, Any]:
    """
    Get programming schedule for all channels on a specific date.
    
    Returns a complete programming guide for all available channels on the specified date,
    with program times adjusted to the requested timezone.
    
    **Parameters:**
    - **date**: Date in YYYYMMDD format (e.g., 20240115 for January 15, 2024)
    - **source**: Source identifier
    - **timezone**: IANA timezone name (default: 'UTC')
    
    **Example Request:**
    ```
    GET /api/py/epg/date/20240115/xmltvnet?timezone=Australia/Sydney
    ```
    """
    try:
        selected_date = datetime.strptime(date, "%Y%m%d")
    except ValueError as err:
        raise InvalidDateFormatError(date) from err

    try:
        programs_data = load_json(f"{source}_programs.json")
        channels_data = load_json(f"{source}_channels.json")
    except FileNotFoundError as err:
        raise SourceNotFoundError(source) from err
    except Exception as err:
        from app.exceptions import DataProcessingError
        raise DataProcessingError("loading source data", str(err)) from err

    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.exceptions.UnknownTimeZoneError as err:
        raise InvalidTimezoneError(timezone) from err

    all_channels = get_all_channels(channels_data)
    adjusted_programming = adjust_programming(programs_data, target_timezone)
    grouped_programs = group_and_fill_programschannels(
        adjusted_programming, target_timezone, all_channels
    )

    selected_date_str = selected_date.strftime("%Y-%m-%d")

    if selected_date_str not in grouped_programs:
        raise ProgrammingNotFoundError(
            f"No programming found for date: {selected_date_str}"
        )

    channels_list = []
    for channel_slug, programs in grouped_programs[selected_date_str].items():
        channel_info = next(
            (c for c in channels_data if c["channel_slug"] == channel_slug), None
        )
        if channel_info:
            channels_list.append(
                {
                    "channel": {
                        "id": channel_info["channel_id"],
                        "name": channel_info["channel_names"],
                        "icon": channel_info["channel_logo"],
                        "slug": channel_info["channel_slug"],
                        "lcn": channel_info["channel_number"],
                    },
                    "programs": programs,
                }
            )

    if not channels_list:
        raise ProgrammingNotFoundError(
            f"No programming found for date: {selected_date_str}"
        )

    return {
        "date_pulled": datetime.now(tz.utc).isoformat(),
        "query": "epg/date",
        "source": source,
        "date": selected_date_str,
        "channels": channels_list,
    }


def process_sports_program(
    program: Dict[str, Any],
    channel_info: Dict[str, Any],
    target_timezone: pytz.tzinfo.BaseTzInfo,
) -> Dict[str, Any]:
    program_start = parse_datetime(program["start_time"], target_timezone)
    program_end = parse_datetime(program["end_time"], target_timezone)
    program_date = program_start.date().isoformat()

    return {
        "date": program_date,
        "program_info": {
            "title": program["title"],
            "start": program_start.isoformat(),
            "end": program_end.isoformat(),
            "description": program.get("description", ""),
            "categories": program.get("categories", []),
            "subtitle": program.get("subtitle", ""),
            "episode": program.get("episode", ""),
            "original_air_date": program.get("original_air_date", ""),
            "rating": program.get("rating", ""),
        },
    }


@router.get("/py/epg/sports/{source}")
async def get_sports_programming(
    source: str,
    days: int = Query(7, description="Number of days to look ahead"),
    timezone: str = Query("UTC", description="Timezone for adjusting program times"),
) -> Dict[str, Any]:
    try:
        programs_data = load_json(f"{source}_programs.json")
        channels_data = load_json(f"{source}_channels.json")
    except FileNotFoundError as err:
        raise SourceNotFoundError(source) from err
    except Exception as err:
        from app.exceptions import DataProcessingError
        raise DataProcessingError("loading source data", str(err)) from err

    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.exceptions.UnknownTimeZoneError as err:
        raise InvalidTimezoneError(timezone) from err

    start_date = datetime.now(target_timezone).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end_date = start_date + timedelta(days=days)

    sports_programs: DefaultDict[str, DefaultDict[str, List[Dict[str, Any]]]] = (
        defaultdict(lambda: defaultdict(list))
    )

    for program in programs_data:
        if start_date <= parse_datetime(
            program["start_time"], target_timezone
        ) < end_date and is_sports_program(program):
            channel_info = next(
                (c for c in channels_data if c["channel_slug"] == program["channel"]),
                None,
            )
            if channel_info:
                processed_program = process_sports_program(
                    program, channel_info, target_timezone
                )
                sports_programs[program["channel"]][processed_program["date"]].append(
                    processed_program["program_info"]
                )

    if not sports_programs:
        raise ProgrammingNotFoundError(
            f"No sports programming found for the next {days} days"
        )

    formatted_response: Dict[str, Any] = {
        "date_pulled": datetime.now(tz.utc).isoformat(),
        "query": "epg/sports",
        "source": source,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "timezone": timezone,
        "channels": [],  # Explicitly define as a list
    }

    for channel_slug, programs_by_day in sports_programs.items():
        channel_info = next(
            (c for c in channels_data if c["channel_slug"] == channel_slug), None
        )
        if channel_info:
            channel_data = {
                "channel": {
                    "id": channel_info["channel_id"],
                    "name": channel_info["channel_name"],
                    "icon": channel_info["channel_logo"],
                    "slug": channel_info["channel_slug"],
                    "lcn": channel_info["channel_number"],
                    "group": channel_info["channel_group"],
                },
                "programs": dict(
                    programs_by_day
                ),  # Convert defaultdict to regular dict
            }
            formatted_response["channels"].append(channel_data)

    return formatted_response


def process_movies_program(
    program: Dict[str, Any],
    channel_info: Dict[str, Any],
    target_timezone: pytz.tzinfo.BaseTzInfo,
) -> Dict[str, Any]:
    program_start = parse_datetime(program["start_time"], target_timezone)
    program_end = parse_datetime(program["end_time"], target_timezone)
    program_date = program_start.date().isoformat()

    return {
        "date": program_date,
        "program_info": {
            "title": program["title"],
            "start": program_start.isoformat(),
            "end": program_end.isoformat(),
            "description": program.get("description", ""),
            "categories": program.get("categories", []),
            "subtitle": program.get("subtitle", ""),
            "episode": program.get("episode", ""),
            "original_air_date": program.get("original_air_date", ""),
            "rating": program.get("rating", ""),
        },
    }


@router.get("/py/epg/movies/{source}")
async def get_movies_programming(
    source: str,
    days: int = Query(7, description="Number of days to look ahead"),
    timezone: str = Query("UTC", description="Timezone for adjusting program times"),
) -> Dict[str, Any]:
    try:
        programs_data = load_json(f"{source}_programs.json")
        channels_data = load_json(f"{source}_channels.json")
    except FileNotFoundError as err:
        raise SourceNotFoundError(source) from err
    except Exception as err:
        from app.exceptions import DataProcessingError
        raise DataProcessingError("loading source data", str(err)) from err

    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.exceptions.UnknownTimeZoneError as err:
        raise InvalidTimezoneError(timezone) from err

    start_date = datetime.now(target_timezone).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end_date = start_date + timedelta(days=days)

    movies_programs: DefaultDict[str, DefaultDict[str, List[Dict[str, Any]]]] = (
        defaultdict(lambda: defaultdict(list))
    )

    for program in programs_data:
        if start_date <= parse_datetime(
            program["start_time"], target_timezone
        ) < end_date and is_movies_program(program):
            channel_info = next(
                (c for c in channels_data if c["channel_slug"] == program["channel"]),
                None,
            )
            if channel_info:
                processed_program = process_movies_program(
                    program, channel_info, target_timezone
                )
                movies_programs[program["channel"]][processed_program["date"]].append(
                    processed_program["program_info"]
                )

    if not movies_programs:
        raise ProgrammingNotFoundError(
            f"No movies programming found for the next {days} days"
        )

    formatted_response: Dict[str, Any] = {
        "date_pulled": datetime.now(tz.utc).isoformat(),
        "query": "epg/movies",
        "source": source,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "timezone": timezone,
        "channels": [],  # Explicitly define as a list
    }

    for channel_slug, programs_by_day in movies_programs.items():
        channel_info = next(
            (c for c in channels_data if c["channel_slug"] == channel_slug), None
        )
        if channel_info:
            channel_data = {
                "channel": {
                    "id": channel_info["channel_id"],
                    "name": channel_info["channel_name"],
                    "icon": channel_info["channel_logo"],
                    "slug": channel_info["channel_slug"],
                    "lcn": channel_info["channel_number"],
                    "group": channel_info["channel_group"],
                },
                "programs": dict(
                    programs_by_day
                ),  # Convert defaultdict to regular dict
            }
            formatted_response["channels"].append(channel_data)

    return formatted_response
