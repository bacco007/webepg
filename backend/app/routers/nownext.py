from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import pytz
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.utils.file_operations import load_json

router = APIRouter()

class ChannelInfo(BaseModel):
    id: str
    name: str
    icon: str
    slug: str

class ProgramInfo(BaseModel):
    title: str
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
    timezone: str = Query(default="UTC", description="Timezone for date conversion")
):
    # Load the programs and channels files for the source
    programs_filename = f"{source}_programs.json"
    channels_filename = f"{source}_channels.json"

    try:
        programs_data = load_json(programs_filename)
        channels_data = load_json(channels_filename)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"File not found: {str(e)}")

    # Handle timezone conversion
    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {timezone}")

    # Get the current time in the target timezone
    now = datetime.now(target_timezone)

    # Create a dictionary of channels for quick lookup
    channels_dict = {channel['channel_slug']: channel for channel in channels_data}

    # Process programs for each channel
    nownext_data = []
    for channel_slug, channel_info in channels_dict.items():
        channel_programs = [p for p in programs_data if p['channel'] == channel_slug]
        channel_programs.sort(key=lambda x: datetime.fromisoformat(x['start_time']))

        current_program = None
        next_program = None

        for idx, program in enumerate(channel_programs):
            program_start = datetime.fromisoformat(program['start_time']).astimezone(target_timezone)
            program_end = datetime.fromisoformat(program['end_time']).astimezone(target_timezone)

            if program_start <= now < program_end:
                current_program = program
                if idx + 1 < len(channel_programs):
                    next_program = channel_programs[idx + 1]
                break
            elif program_start > now:
                next_program = program
                break

        channel_data = ChannelPrograms(
            channel=ChannelInfo(
                id=channel_info['channel_id'],
                name=channel_info['channel_name'],
                icon=channel_info['chlogo'],
                slug=channel_info['channel_slug']
            ),
            currentProgram=format_program(current_program, target_timezone) if current_program else None,
            nextProgram=format_program(next_program, target_timezone) if next_program else None
        )
        nownext_data.append(channel_data)

    return NowNextResponse(
        date=now.isoformat(),
        query="nownext",
        source=source,
        data=nownext_data
    )

def format_program(program: Dict[str, Any], timezone: pytz.timezone) -> ProgramInfo:
    start_time = datetime.fromisoformat(program['start_time']).astimezone(timezone)
    end_time = datetime.fromisoformat(program['end_time']).astimezone(timezone)
    duration = end_time - start_time
    hours, remainder = divmod(duration.seconds, 3600)
    minutes, _ = divmod(remainder, 60)

    lengthstring = f"{hours} Hr {minutes} Min" if hours > 0 else f"{minutes} Min"

    return ProgramInfo(
        title=program['title'],
        start=start_time.isoformat(),
        stop=end_time.isoformat(),
        desc=program.get('desc'),
        category=program.get('category', []),
        rating=program.get('rating'),
        lengthstring=lengthstring
    )
