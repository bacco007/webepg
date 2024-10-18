from collections import defaultdict
from datetime import datetime, timedelta
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
            midnight = local_start.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
            if local_start < midnight:
                adjusted.append(
                    {
                        **program,
                        "start_time": local_start.strftime("%Y-%m-%d %H:%M:%S"),
                        "end_time": midnight.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                )
            next_day = local_end.replace(hour=0, minute=0, second=0, microsecond=0)
            if next_day < local_end:
                adjusted.append(
                    {
                        **program,
                        "start_time": next_day.strftime("%Y-%m-%d %H:%M:%S"),
                        "end_time": local_end.strftime("%Y-%m-%d %H:%M:%S"),
                        "title": f"{program['title']} (cont)",
                    }
                )
        else:
            adjusted.append(
                {
                    **program,
                    "start_time": local_start.strftime("%Y-%m-%d %H:%M:%S"),
                    "end_time": local_end.strftime("%Y-%m-%d %H:%M:%S"),
                }
            )

    return adjusted

def group_and_fill_programs(
    programs: List[Dict[str, Any]], timezone: Union[str, pytz.BaseTzInfo]
) -> Dict[str, List[Dict[str, Any]]]:
    tz = process_timezone(timezone)

    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for program in programs:
        date = program["start_time"].split(" ")[0]
        grouped[date].append(program)

    for date, day_programs in grouped.items():
        day_programs.sort(key=lambda x: x["start_time"])
        filled_programs: List[Dict[str, Any]] = []
        current_time = tz.localize(
            datetime.strptime(f"{date} 00:00:00", "%Y-%m-%d %H:%M:%S")
        )
        day_end = tz.localize(
            datetime.strptime(f"{date} 23:59:59", "%Y-%m-%d %H:%M:%S")
        )

        for program in day_programs:
            program_start = parse_datetime(program["start_time"], tz)
            program_end = parse_datetime(program["end_time"], tz)

            if program_start > current_time:
                gap = (program_start - current_time).total_seconds()
                if gap > 60:  # Only create a gap program if it's longer than 1 minute
                    filled_programs.append(
                        create_no_data_program(
                            current_time,
                            program_start - timedelta(seconds=1),
                            program["channel"],
                            tz,
                        )
                    )

            if (program_end - program_start).total_seconds() > 0:
                filled_programs.append(program)

            current_time = program_end

        if (
            day_end - current_time
        ).total_seconds() > 60:  # Only create end-of-day gap if longer than 1 minute
            filled_programs.append(
                create_no_data_program(
                    current_time + timedelta(seconds=1), day_end, program["channel"], tz
                )
            )

        grouped[date] = filled_programs

    return grouped

def group_and_fill_programschannels(
    programs: List[Dict[str, Any]],
    timezone: Union[str, pytz.BaseTzInfo],
    all_channels: List[str],
) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    tz = process_timezone(timezone)

    grouped: Dict[str, Dict[str, List[Dict[str, Any]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for program in programs:
        date = program["start_time"].split(" ")[0]
        channel = program["channel"]
        grouped[date][channel].append(program)

    filled_grouped: Dict[str, Dict[str, List[Dict[str, Any]]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for date, channels in grouped.items():
        day_start = tz.localize(
            datetime.strptime(f"{date} 00:00:00", "%Y-%m-%d %H:%M:%S")
        )
        day_end = tz.localize(
            datetime.strptime(f"{date} 23:59:59", "%Y-%m-%d %H:%M:%S")
        )

        for channel in all_channels:
            if channel not in channels:
                # If the channel has no programs for the entire day
                filled_grouped[date][channel] = [
                    create_no_data_program(day_start, day_end, channel, tz)
                ]
            else:
                channel_programs = channels[channel]
                channel_programs.sort(key=lambda x: x["start_time"])
                filled_programs: List[Dict[str, Any]] = []
                current_time = day_start

                for program in channel_programs:
                    program_start = parse_datetime(program["start_time"], tz)
                    program_end = parse_datetime(program["end_time"], tz)

                    if program_start > current_time:
                        gap = (program_start - current_time).total_seconds()
                        if (
                            gap > 60
                        ):  # Only create a gap program if it's longer than 1 minute
                            filled_programs.append(
                                create_no_data_program(
                                    current_time,
                                    program_start - timedelta(seconds=1),
                                    channel,
                                    tz,
                                )
                            )

                    if (program_end - program_start).total_seconds() > 60:
                        filled_programs.append(program)

                    current_time = program_end

                if (
                    (day_end - current_time).total_seconds() > 60
                ):  # Only create end-of-day gap if longer than 1 minute
                    filled_programs.append(
                        create_no_data_program(
                            current_time + timedelta(seconds=1), day_end, channel, tz
                        )
                    )

                filled_grouped[date][channel] = filled_programs

    return filled_grouped

def process_timezone(timezone: Union[str, pytz.BaseTzInfo]) -> PytzTimezone:
    if isinstance(timezone, str):
        return cast(PytzTimezone, pytz.timezone(timezone))
    elif isinstance(timezone, pytz.BaseTzInfo):
        return cast(PytzTimezone, timezone)
    else:
        raise ValueError(
            "Invalid timezone format. Expected string or pytz.BaseTzInfo object."
        )

def parse_datetime(dt_string: str, tz: PytzTimezone) -> datetime:
    dt = datetime.strptime(dt_string, "%Y-%m-%d %H:%M:%S")
    return tz.localize(dt)

def create_no_data_program(
    start: datetime, end: datetime, channel: str, tz: PytzTimezone
) -> Dict[str, Any]:
    return {
        "start_time": start.strftime("%Y-%m-%d %H:%M:%S"),
        "start": "N/A",
        "end_time": end.strftime("%Y-%m-%d %H:%M:%S"),
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
