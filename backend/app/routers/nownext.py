from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import pytz
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.utils.file_operations import load_json

router = APIRouter()


class ChannelInfo(BaseModel):
    id: str
    name: Dict[str, str] = {}
    icon: Dict[str, str] = {}  # Changed from List[str] to Dict[str, str]
    slug: str
    lcn: Union[str, int]  # Changed from str to Union[str, int]
    group: str


class ProgramInfo(BaseModel):
    title: str
    subtitle: str
    episode: Optional[str] = None
    start: str
    stop: str
    desc: Optional[str] = None
    category: List[str] = []
    rating: Optional[str] = None
    lengthstring: str


class ChannelPrograms(BaseModel):
    channel: ChannelInfo
    currentProgram: Optional[ProgramInfo]
    nextProgram: Optional[ProgramInfo]


class NowNextResponse(BaseModel):
    date: str
    query: str
    source: str
    data: List[ChannelPrograms]


@router.get("/{source}", response_model=NowNextResponse)
async def get_nownext(
    source: str,
    timezone: str = Query(default="UTC", description="Timezone for date conversion"),
) -> NowNextResponse:
    # Load the programs and channels files for the source
    try:
        programs_data = load_json(f"{source}_programs.json")
        channels_data = load_json(f"{source}_channels.json")
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}") from e

    # Handle timezone conversion
    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.UnknownTimeZoneError as err:
        raise HTTPException(
            status_code=400, detail=f"Unknown timezone: {timezone}"
        ) from err

    # Get the current time in the target timezone
    now = datetime.now(target_timezone)

    # Deduplicate channels based on unique (channel_id, channel_number) pairs
    unique_channels = {
        (channel["channel_id"], channel["channel_number"]): channel
        for channel in channels_data
    }

    # Helper to find current and next programs
    def find_now_next(programs):
        current, next_program = None, None
        for idx, program in enumerate(programs):
            start = datetime.fromisoformat(program["start_time"]).astimezone(
                target_timezone
            )
            end = datetime.fromisoformat(program["end_time"]).astimezone(
                target_timezone
            )

            if start <= now < end:
                current = program
                next_program = next(
                    (
                        p
                        for p in programs[idx + 1 :]
                        if datetime.fromisoformat(p["start_time"]).astimezone(
                            target_timezone
                        )
                        >= end
                    ),
                    None,
                )
                break
            elif start > now and not current:
                next_program = program
                break
        return current, next_program

    # Process each channel and attach now/next programs
    nownext_data = []
    for channel in unique_channels.values():
        channel_slug = channel["channel_slug"]
        channel_programs = sorted(
            (p for p in programs_data if p["channel"] == channel_slug),
            key=lambda x: datetime.fromisoformat(x["start_time"]),
        )
        current_program, next_program = find_now_next(channel_programs)

        nownext_data.append(
            ChannelPrograms(
                channel=ChannelInfo(
                    id=channel["channel_id"],
                    name=channel["channel_names"],
                    icon=channel["channel_logo"],
                    slug=channel["channel_slug"],
                    lcn=channel["channel_number"],
                    group=channel["channel_group"],
                ),
                currentProgram=format_program(current_program, target_timezone)
                if current_program
                else None,
                nextProgram=format_program(next_program, target_timezone)
                if next_program
                else None,
            )
        )

    return NowNextResponse(
        date=now.isoformat(), query="nownext", source=source, data=nownext_data
    )



def format_program(
    program: Dict[str, Any], timezone: pytz.tzinfo.BaseTzInfo
) -> ProgramInfo:
    start_time = datetime.fromisoformat(program["start_time"]).astimezone(timezone)
    end_time = datetime.fromisoformat(program["end_time"]).astimezone(timezone)
    duration = end_time - start_time

    # Total duration in hours and minutes
    total_minutes = duration.total_seconds() // 60
    hours, minutes = divmod(total_minutes, 60)

    if hours >= 24:
        days, hours = divmod(hours, 24)
        lengthstring = f"{int(days)} Day(s) {int(hours)} Hr {int(minutes)} Min"
    elif hours > 0:
        lengthstring = f"{int(hours)} Hr {int(minutes)} Min"
    else:
        lengthstring = f"{int(minutes)} Min"

    return ProgramInfo(
        title=program["title"],
        subtitle=program["subtitle"],
        episode=program.get("episode"),
        start=start_time.isoformat(),
        stop=end_time.isoformat(),
        desc=program.get("description"),
        category=program.get("categories", []),
        rating=program.get("rating"),
        lengthstring=lengthstring,
    )
