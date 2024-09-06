from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Union, cast

import pytz

# Define a type alias for pytz timezone objects
PytzTimezone = Union[
    pytz.tzinfo.BaseTzInfo, pytz.tzinfo.StaticTzInfo, pytz.tzinfo.DstTzInfo
]


def adjust_programming(
    programming: List[Dict[str, Any]], target_timezone: PytzTimezone
) -> List[Dict[str, Any]]:
    adjusted: List[Dict[str, Any]] = []
    for program in programming:
        utc_start = datetime.fromisoformat(program["start_time"])
        utc_end = datetime.fromisoformat(program["end_time"])
        local_start = utc_start.astimezone(target_timezone)
        local_end = utc_end.astimezone(target_timezone)

        if local_start.date() != local_end.date():
            midnight = local_start.replace(hour=23, minute=59, second=59)
            if local_start < midnight:
                adjusted.append(
                    {
                        **program,
                        "start_time": local_start.isoformat(),
                        "end_time": midnight.isoformat(),
                    }
                )
            next_day = local_end.replace(hour=0, minute=0, second=0)
            if next_day < local_end:
                adjusted.append(
                    {
                        **program,
                        "start_time": next_day.isoformat(),
                        "end_time": local_end.isoformat(),
                        "title": f"{program['title']} (cont)",
                    }
                )
        else:
            adjusted.append(
                {
                    **program,
                    "start_time": local_start.isoformat(),
                    "end_time": local_end.isoformat(),
                }
            )

    return adjusted

def process_timezone(timezone: Union[str, pytz.BaseTzInfo]) -> PytzTimezone:
    if isinstance(timezone, str):
        return cast(PytzTimezone, pytz.timezone(timezone))
    elif isinstance(timezone, pytz.BaseTzInfo):
        return cast(PytzTimezone, timezone)
    else:
        raise ValueError(
            "Invalid timezone format. Expected string or pytz.BaseTzInfo object."
        )

def group_and_fill_programs(
    programs: List[Dict[str, Any]], timezone: Union[str, pytz.BaseTzInfo]
) -> Dict[str, List[Dict[str, Any]]]:
    tz = process_timezone(timezone)

    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for program in programs:
        date = program["start_time"].split("T")[0]
        grouped[date].append(program)

    for date, day_programs in grouped.items():
        day_programs.sort(key=lambda x: x["start_time"])
        filled_programs: List[Dict[str, Any]] = []
        current_time = tz.localize(datetime.fromisoformat(f"{date}T00:00:00"))
        day_end = tz.localize(datetime.fromisoformat(f"{date}T23:59:59"))

        for program in day_programs:
            program_start = parse_datetime(program["start_time"], tz)
            program_end = parse_datetime(program["end_time"], tz)

            if current_time < program_start:
                filled_programs.append(
                    create_no_data_program(
                        current_time, program_start, program["channel"], tz
                    )
                )
            filled_programs.append(program)
            current_time = program_end

        if current_time < day_end:
            filled_programs.append(
                create_no_data_program(current_time, day_end, program["channel"], tz)
            )

        grouped[date] = filled_programs

    return grouped

def group_and_fill_programschannels(
    programs: List[Dict[str, Any]], timezone: Union[str, pytz.BaseTzInfo]
) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    tz = process_timezone(timezone)

    grouped: Dict[str, Dict[str, List[Dict[str, Any]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for program in programs:
        date = program["start_time"].split("T")[0]
        channel = program["channel"]
        grouped[date][channel].append(program)

    filled_grouped: Dict[str, Dict[str, List[Dict[str, Any]]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for date, channels in grouped.items():
        day_start = tz.localize(datetime.fromisoformat(f"{date}T00:00:00"))
        day_end = tz.localize(datetime.fromisoformat(f"{date}T23:59:59"))

        for channel, channel_programs in channels.items():
            channel_programs.sort(key=lambda x: x["start_time"])
            filled_programs: List[Dict[str, Any]] = []
            current_time = day_start

            for program in channel_programs:
                program_start = parse_datetime(program["start_time"], tz)
                program_end = parse_datetime(program["end_time"], tz)

                if current_time < program_start:
                    filled_programs.append(
                        create_no_data_program(current_time, program_start, channel, tz)
                    )
                filled_programs.append(program)
                current_time = program_end

            if current_time < day_end:
                filled_programs.append(
                    create_no_data_program(current_time, day_end, channel, tz)
                )

            filled_grouped[date][channel] = filled_programs

    return filled_grouped

def parse_datetime(dt_string: str, tz: PytzTimezone) -> datetime:
    dt = datetime.fromisoformat(dt_string)
    if dt.tzinfo is None:
        return tz.localize(dt)
    else:
        return dt.astimezone(tz)

def create_no_data_program(
    start: datetime, end: datetime, channel: str, tz: PytzTimezone
) -> Dict[str, Any]:
    return {
        "start_time": start.isoformat(),
        "start": "N/A",
        "end_time": end.isoformat(),
        "end": "N/A",
        "length": str(end - start),
        "channel": channel,
        "title": "No Data Available",
        "subtitle": "N/A",
        "description": "N/A",
        "categories": ["N/A"],
        "episode": "N/A",
        "original_air_date": "N/A",
        "rating": "N/A",
    }
