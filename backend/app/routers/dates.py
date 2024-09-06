import os
from datetime import datetime
from typing import List

import pytz
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.utils.file_operations import load_json

router = APIRouter()

class DateResponse(BaseModel):
    date: str
    query: str
    source: str
    data: List[str]

@router.get("/py/dates/{source}", response_model=DateResponse)
async def get_unique_dates(
    source: str,
    timezone: str = Query(default="UTC", description="Timezone for date conversion")
):
    # Load the programs file for the source
    programs_filename = f"{source}_programs.json"
    programs_path = os.path.join(settings.XMLTV_DATA_DIR, programs_filename)

    # Check if the file exists
    if not os.path.exists(programs_path):
        raise HTTPException(status_code=404, detail=f"File not found: {programs_filename}")

    # Load programming data
    programs_data = load_json(programs_filename)

    # Handle timezone conversion
    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {timezone}")

    # Set to collect unique dates
    unique_dates = set()

    # Convert start_time to the target timezone and extract the date
    for program in programs_data:
        utc_start = datetime.fromisoformat(program['start_time'])
        local_start = utc_start.astimezone(target_timezone)
        program_date = local_start.strftime("%Y%m%d")  # Get the date in YYYYMMDD format
        unique_dates.add(program_date)

    # Get current UTC time
    current_time = datetime.now(pytz.UTC).isoformat()

    # Return the response in the desired format
    return DateResponse(
        date=current_time,
        query="dates",
        source=source,
        data=sorted(list(unique_dates))
    )
