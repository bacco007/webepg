from datetime import datetime
from typing import List

import pytz
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.exceptions import InvalidTimezoneError, SourceNotFoundError
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
    timezone: str = Query(default="UTC", description="Timezone for date conversion"),
) -> DateResponse:
    # Load the programs file for the source
    programs_filename = f"{source}_programs.json"

    # Check if the file exists
    try:
        programs_data = load_json(programs_filename)
    except FileNotFoundError as err:
        raise SourceNotFoundError(source) from err

    # Handle timezone conversion
    try:
        target_timezone = pytz.timezone(timezone)
    except pytz.exceptions.UnknownTimeZoneError as err:
        raise InvalidTimezoneError(timezone) from err

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
        date=current_time, query="dates", source=source, data=sorted(unique_dates)
    )
