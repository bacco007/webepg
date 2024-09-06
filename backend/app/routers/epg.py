from datetime import datetime

import pytz
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
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

def program_overlaps_date(program, date_str, target_timezone):
    def parse_datetime(dt_string):
        dt = datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            return pytz.utc.localize(dt)
        return dt.astimezone(pytz.utc)

    start = parse_datetime(program['start_time'])
    end = parse_datetime(program['end_time'])
    date = datetime.strptime(date_str, "%Y-%m-%d")
    date_start = target_timezone.localize(date.replace(hour=0, minute=0, second=0, microsecond=0))
    date_end = target_timezone.localize(date.replace(hour=23, minute=59, second=59, microsecond=999999))

    start = start.astimezone(target_timezone)
    end = end.astimezone(target_timezone)

    return start <= date_end and end >= date_start

@router.get("/py/epg/channels/{id}/{channel}")
async def get_programming_by_channel(
    id: str,
    channel: str,
    timezone: str = Query("UTC", description="Timezone for adjusting program times")
):
    try:
        programs_data = load_json(f"{id}_programs.json")
        channels_data = load_json(f"{id}_channels.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Required files not found for {id}")

    channel_metadata = next((ch for ch in channels_data if ch.get('channel_slug') == channel), None)
    filtered_programming = [program for program in programs_data if program.get('channel') == channel]

    if not filtered_programming or not channel_metadata:
        raise HTTPException(status_code=404, detail=f"No programming or channel metadata found for channel: {channel}")

    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {timezone}")

    adjusted_programming = adjust_programming(filtered_programming, target_timezone)
    grouped_programs = group_and_fill_programs(adjusted_programming, target_timezone)

    return {
        "date_pulled": datetime.utcnow().isoformat(),
        "query": "epg/channels",
        "source": id,
        "channel": channel_metadata,
        "programs": dict(grouped_programs),
    }

@router.get("/py/epg/date/{date}/{source}")
async def get_programming_by_date(
    date: str,
    source: str,
    timezone: str = Query("UTC", description="Timezone for adjusting program times")
):
    try:
        selected_date = datetime.strptime(date, "%Y%m%d")
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date}. Expected format is YYYYMMDD.")

    try:
        programs_data = load_json(f"{source}_programs.json")
        channels_data = load_json(f"{source}_channels.json")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Required files not found for source: {source}")

    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {timezone}")

    adjusted_programming = adjust_programming(programs_data, target_timezone)
    grouped_programs = group_and_fill_programschannels(adjusted_programming, target_timezone)

    selected_date_str = selected_date.strftime("%Y-%m-%d")

    if selected_date_str not in grouped_programs:
        raise HTTPException(status_code=404, detail=f"No programming found for date: {selected_date_str}")

    channels_list = []
    for channel_slug, programs in grouped_programs[selected_date_str].items():
        channel_info = next((c for c in channels_data if c['channel_slug'] == channel_slug), None)
        if channel_info:
            channels_list.append({
                "channel": {
                    "id": channel_info['channel_id'],
                    "name": channel_info['channel_name'],
                    "icon": channel_info['chlogo'],
                    "slug": channel_info['channel_slug'],
                    "lcn": channel_info['channel_number'],
                },
                "programs": programs
            })

    if not channels_list:
        raise HTTPException(status_code=404, detail=f"No programming found for date: {selected_date_str}")

    return {
        "date_pulled": datetime.utcnow().isoformat(),
        "query": "epg/date",
        "source": source,
        "date": selected_date_str,
        "channels": channels_list
    }
