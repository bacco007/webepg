import csv
import json
import logging
import os
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set

import mysql.connector
import pytz
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings

router = APIRouter()

# Constants
DATA_LOCATION = settings.XMLTV_DATA_DIR
PROVIDER_LIST_FILE = os.path.join(DATA_LOCATION, "xmlepg_providers.json")
FILTERED_CHANNEL_DATA_FILE = os.path.join(DATA_LOCATION, "xmlepg_channels.json")
MERGED_PROVIDER_CHANNEL_DATA_FILE = os.path.join(
    DATA_LOCATION, "xmlepg_providerchannels.json"
)
GUIDE_DATA_FILE = os.path.join(DATA_LOCATION, "xmlepg_guide.json")
ERROR_LOG_FILE = os.path.join(DATA_LOCATION, "xmlepg_error_log.txt")
ADDITIONAL_CHANNELS_CSV = os.path.join(DATA_LOCATION, "xmlepg_additional_channels.csv")

# MySQL connection details
mysql_config = {
    "host": settings.MYSQL_HOST,
    "user": settings.MYSQL_USER,
    "password": settings.MYSQL_PASSWORD,
    "database": settings.MYSQL_DATABASE,
    "use_pure": "True",
    "auth_plugin": "mysql_native_password",
    "unix_socket": None,
    "port": "3306",  # Default MySQL port
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
    group: str
    subgroup: str
    location: str


def execute_sql_query(query: str) -> List[Dict[str, Any]]:
    try:
        # Establish connection and create a cursor with dictionary output enabled
        connection = mysql.connector.connect(**mysql_config)
        cursor = connection.cursor(dictionary=True)
        logging.info(f"Executing SQL query: {query}")
        cursor.execute(query)

        # Fetch raw results and coerce them into the expected format
        raw_results = cursor.fetchall()

        # Force type-safe assignment using list comprehension
        results: List[Dict[str, Any]] = [
            item for item in raw_results if isinstance(item, dict)
        ]

        if len(results) < len(raw_results):
            logging.warning("Some non-dict rows were discarded.")

        logging.info(f"Query returned {len(results)} valid results")

        # Clean up the cursor and connection
        cursor.close()
        connection.close()

        return results

    except mysql.connector.Error as err:
        logging.error(f"MySQL Error: {err}")
        logging.error(f"Error Code: {err.errno}")
        logging.error(f"SQLSTATE: {err.sqlstate}")
        logging.error(f"Message: {err.msg}")
        return []


async def get_providers() -> List[Dict[str, Any]]:
    sql_query = """
    -- Get Provider List (FTA)
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Free To Air' as subgroup, concat(provnamelong, " - ", provname) as location, 'local' as url from providers
    where provgroupname in ('FTA') and provshow = 1 and provid not in ('FTASEVAFL')

    union all
    -- Get Provider List (Foxtel)
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Foxtel / Hubbl' as subgroup, 'Foxtel' as location, 'local' as url from providers
    where provid in ('FOXHD', 'FOXNOW', 'FOXALL', 'FOXPL')

    union all
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Foxtel / Hubbl' as subgroup, provname as location, 'local' as url from providers
    where provid in ('HUBBIN', 'HUBFLA', 'HUBKAY', 'HUBLIF', 'HUBALL', 'KAYO', 'HUBLOC')

    union all
    -- Get Provider List (Fetch)
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Fetch' as subgroup, 'Fetch' as location, 'local' as url from providers
    where provid in ('FETALL', 'FETOPT', 'FETITA', 'FETULT')

    union all
    -- Get Provider List (VAST)
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Free To Air (VAST)' as subgroup, concat(provnamelong) as location, 'local' as url from providers
    where provgroupname in ('VAST') and provshow = 1

    union all
    -- Get Provider List (Other)
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Other' as subgroup, concat(provgroupname, ' ', provname) as location, 'local' as url from providers
    where provid in ('SKYRAC', 'INSTV', 'OPTALL', 'IPTVSYD', 'FTANOR', 'FTAPAR', 'BEINALL', 'R_LOCSYD', 'R_FVALL', 'FOXPL', 'ALLIPTV', 'TVPLUSGR')

    union all
    -- Get Provider List (Streaming)
    select providnum, provid, provname, provnamelong, provgroupname, provlcn, provaltid1, 'XMLEPG' as "group", 'Streaming' as subgroup, concat(provgroupname) as location, 'local' as url from providers
    where provid in ('ABCIVIEW', '9NOW', '7PLUS', '10PLAY', 'SBSOD') and provshow = 1

    order by subgroup, location
    """
    providers = execute_sql_query(sql_query)
    if not providers:
        logging.error("No providers found in the database.")
        raise ValueError("No providers found in the database.")
    logging.info(f"Found {len(providers)} providers.")
    return providers


async def get_channels(csv_file_path: str = None) -> List[Dict[str, Any]]:
    """
    Retrieves channels from the database and optionally appends additional rows from a CSV file.

    :param csv_file_path: Optional path to a CSV file containing additional channel data.
    :return: Combined list of channels from SQL and CSV.
    """
    # SQL query for fetching channels
    channel_query = """
    select ch.guidelink, ch.guidelink as channel_id, replace(ch.guidelink,'.','-') as channel_slug, ch.channame as channel_name, trim(concat(ch.channame, " ", ch.chanloc)) as channel_name_location, ch.channamereal as channel_name_real, ct.chantypename as chantype, cc.chancompname as chancomp, ch.channetweb as channel_url, ch.chanbouq, ch.chanlcnfta1, ch.chanlcnfta2, ch.chanlcnfta3, ch.chanlcnfox, ch.chanlcnfet, null as channel_number, cl.logoremotelight as chlogo_light, cl.logoremotedark as chlogo_dark, nt.networkname as channel_group, cg.groupname as channel_type, cl.logoremotelight as chlogo
    from channels ch
    left join chancomp cc on ch.chancomp = cc.chancompid
    left join changroups cg on ch.changroup = cg.groupid
    left join chanlogos cl on ch.chanlogo = cl.logoid
    left join chantypes ct on ch.chantype = ct.chantypeid
    left join networks nt on ch.channetwork = nt.networkid
    where ch.chanshowonlistview <> '0' and ch.guidelink <> 'CLOSED'
    order by guidelink
    """

    logging.info("Executing SQL query to fetch channels...")
    sql_channels = execute_sql_query(channel_query)
    logging.info(f"Fetched {len(sql_channels)} channels from the database.")

    # If no CSV file is provided, return only the SQL results
    if not csv_file_path:
        logging.info("No CSV file provided. Returning SQL results only.")
        return sql_channels

    # Read the CSV file and append its rows to the SQL results
    additional_channels = []
    try:
        logging.info(
            f"Attempting to read additional channels from CSV: {csv_file_path}"
        )
        with open(csv_file_path, "r", encoding="latin-1") as csv_file:
            csv_reader = csv.DictReader(csv_file)

            for row_number, row in enumerate(csv_reader, start=1):
                try:
                    # Ensure the row format matches the SQL query output
                    channel_data = {
                        "guidelink": row.get("guidelink"),
                        "channel_id": row.get("guidelink"),
                        "channel_slug": row.get(
                            "channel_slug", row.get("guidelink").replace(".", "-")
                        ),
                        "channel_name": row.get("channel_name"),
                        "channel_name_location": row.get(
                            "channel_name_location",
                            f"{row.get('channel_name')} {row.get('chanloc', '')}".strip(),
                        ),
                        "channel_name_real": row.get("channel_name_real"),
                        "chantype": row.get("chantype"),
                        "chancomp": row.get("chancomp"),
                        "channel_url": row.get("channel_url"),
                        "chanbouq": row.get("chanbouq"),
                        "chanlcnfta1": row.get("chanlcnfta1"),
                        "chanlcnfta2": row.get("chanlcnfta2"),
                        "chanlcnfta3": row.get("chanlcnfta3"),
                        "chanlcnfox": row.get("chanlcnfox"),
                        "chanlcnfet": row.get("chanlcnfet"),
                        "channel_number": row.get("channel_number"),
                        "chlogo_light": row.get("chlogo_light"),
                        "chlogo_dark": row.get("chlogo_dark"),
                        "channel_group": row.get("channel_group"),
                        "channel_type": row.get("channel_type"),
                        "chlogo": row.get("chlogo_light"),
                    }
                    additional_channels.append(channel_data)
                except Exception as row_err:
                    logging.error(
                        f"Error processing row {row_number} in CSV: {row}. Error: {row_err}"
                    )

        logging.info(
            f"Successfully read {len(additional_channels)} additional channels from CSV."
        )

    except FileNotFoundError:
        logging.error(f"CSV file not found at path: {csv_file_path}")
    except Exception as e:
        logging.error(f"Error reading CSV file: {str(e)}")

    # Combine SQL results and additional CSV rows
    combined_channels = sql_channels + additional_channels
    logging.info(f"Total combined channels: {len(combined_channels)}")

    return combined_channels


async def process_channel_data(
    channel_data: List[Dict[str, Any]], valid_providnums: Set[int]
) -> List[Dict[str, Any]]:
    processed_results = []
    for row in channel_data:
        if row["chanbouq"]:
            chanbouq_list = [
                int(bouq.strip())
                for bouq in row["chanbouq"].strip(",").split(",")
                if bouq.strip()
            ]
            if any(bouq in valid_providnums for bouq in chanbouq_list):
                processed_row = row.copy()
                processed_row["chanbouq"] = chanbouq_list
                processed_results.append(processed_row)
    return processed_results


async def reverse_merge_data(
    providers: List[Dict[str, Any]], channels: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    merged_data = []
    for provider in providers:
        provider_num = provider.get("providnum")
        if provider_num is None:
            logging.warning(
                f"Warning: 'providnum' is missing for provider {provider.get('provid', 'Unknown')}"
            )
            continue

        matching_channels = [
            {k: v for k, v in channel.items() if k != "chanbouq"}
            for channel in channels
            if provider_num in channel.get("chanbouq", [])
        ]

        if matching_channels:
            merged_provider = provider.copy()
            merged_provider["channels"] = matching_channels
            merged_data.append(merged_provider)

    logging.info(f"Merged data: {len(merged_data)} providers with matching channels")
    return merged_data


async def extract_unique_guidelinks(data: List[Dict[str, Any]]) -> Set[str]:
    guidelinks = set()
    for provider in data:
        for channel in provider.get("channels", []):
            guidelink = channel.get("guidelink")
            if guidelink:
                guidelinks.add(guidelink)
    return guidelinks


def format_sql_in_clause(guidelinks: Set[str]) -> str:
    formatted_guidelinks = ", ".join(f"'{link}'" for link in sorted(guidelinks))
    return f"({formatted_guidelinks})"


async def get_guide_data(sql_in_clause: str) -> List[Dict[str, Any]]:
    def is_file_recent(file_path: str, hours: int = 6) -> bool:
        if not os.path.exists(file_path):
            return False
        file_age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(file_path))
        return file_age < timedelta(hours=hours)

    if is_file_recent(GUIDE_DATA_FILE, hours=6):
        logging.info(f"Using existing guide data from {GUIDE_DATA_FILE}")
        with open(GUIDE_DATA_FILE, "r") as f:
            return json.load(f)

    logging.info("Fetching fresh guide data from database")
    query1 = f"""SELECT guideid, progstart as start_time, null as start, progstop as end_time, null as end,
                null as length, channel, title, subtitle, descr as description, category as categories,
                null as original_air_date, rating
                FROM guide2 WHERE title != "(guide not available)"
                and STR_TO_DATE(SUBSTRING(progstart, 1, 14), '%Y%m%d%H%i%s') >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
                and STR_TO_DATE(SUBSTRING(progstart, 1, 14), '%Y%m%d%H%i%s') <= DATE_ADD(CURDATE(), INTERVAL 10 DAY)
                and CONVERT(channel USING utf8mb4) COLLATE utf8mb4_general_ci in {sql_in_clause}"""

    query2 = """SELECT showingid AS guideid, starttime AS start_time, null as start,
                finishtime AS end_time, null as end, channel, showtitle AS title,
                subtitle, descrip AS description, category as categories, null as original_air_date,
                rating1 AS rating
                FROM guide
                WHERE channel not in (select distinct channel from guide2)
                AND showtitle != "(guide not available)"
                AND starttime >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
                AND starttime <= DATE_ADD(CURDATE(), INTERVAL 10 DAY)"""

    results1 = execute_sql_query(query1)
    results2 = execute_sql_query(query2)

    sydney_tz = pytz.timezone("UTC")

    for entry in results2:
        for time_field in ["start_time", "end_time"]:
            if entry[time_field]:
                # Check if the value is already a datetime object
                if isinstance(entry[time_field], datetime):
                    dt = sydney_tz.localize(entry[time_field])
                else:
                    # If it's a string, parse it
                    dt = sydney_tz.localize(
                        datetime.strptime(entry[time_field], "%Y-%m-%d %H:%M:%S")
                    )
                # Format the datetime with the correct offset
                entry[time_field] = dt.strftime("%Y%m%d%H%M%S %z")

        # Handle categories as a single value
        entry["categories"] = (
            entry["categories"]
            if entry["categories"] and entry["categories"] != ""
            else "NA"
        )

        # Handle rating as a single value
        entry["rating"] = (
            entry["rating"] if entry["rating"] and entry["rating"] != "" else "NA"
        )

    results = results1 + results2

    if not results:
        logging.warning("No guide data found for the given channels.")
    else:
        logging.info(f"Retrieved {len(results)} guide data entries.")
        await save_json_file(results, GUIDE_DATA_FILE)
        logging.info(f"Guide data saved to {GUIDE_DATA_FILE}")
    return results


def round_to_nearest_minute(dt: datetime) -> datetime:
    return dt.replace(second=0, microsecond=0) + timedelta(minutes=dt.second >= 30)


def parse_datetime(time_str: str) -> datetime:
    try:
        # Try parsing as ISO 8601 format
        dt = datetime.fromisoformat(time_str)
    except ValueError:
        try:
            # Try parsing as the original format
            dt = datetime.strptime(time_str, "%Y%m%d%H%M%S %z")
        except ValueError:
            # If both fail, raise an exception
            raise ValueError(f"Unable to parse datetime: {time_str}")  # noqa: B904

    # Ensure the datetime is timezone-aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=pytz.UTC)

    return dt


async def create_provider_program_files(  # noqa: C901
    provider_data: List[Dict[str, Any]],
    guide_data: List[Dict[str, Any]],
    channel_counts: Dict[str, int],
) -> None:
    guide_data_dict: Dict[str, List[Dict[str, Any]]] = {}
    for item in guide_data:
        channel = item["channel"]
        if channel not in guide_data_dict:
            guide_data_dict[channel] = []
        guide_data_dict[channel].append(item)

    xmlepg_sources = []

    for provider in provider_data:
        provid = provider.get("provid")
        if not provid:
            logging.warning("Provider without 'provid' found. Skipping.")
            continue

        provider_programs = []
        first_program: Optional[datetime] = None
        last_program: Optional[datetime] = None
        provider_channel_counts = {}

        logging.info(f"Processing provider: {provid}")

        # Create channels file
        channels_file = os.path.join(DATA_LOCATION, f"xmlepg_{provid}_channels.json")
        provider_channels = provider.get("channels", [])

        # Get the provlcn value
        provlcn = provider.get("provlcn", "")
        if provlcn == "chanlcnfta4":
            provlcn = "chanlcnfta1"

        # Update channel information with channel_number
        updated_provider_channels = []
        for channel in provider_channels:
            updated_channel = channel.copy()
            if provlcn:
                channel_number = channel.get(provlcn)
                if channel_number and channel_number != 0:
                    updated_channel["channel_number"] = str(channel_number)
                else:
                    updated_channel["channel_number"] = "N/A"
                    logging.warning(
                        f"Channel number not found or is 0 using provlcn '{provlcn}' for channel {channel.get('guidelink', 'Unknown')} in provider {provid}. Set to 'N/A'."
                    )
            else:
                updated_channel["channel_number"] = "N/A"

            # Add program_count
            guidelink = channel.get("guidelink")
            updated_channel["program_count"] = channel_counts.get(guidelink, 0)

            updated_channel["channel_logo"] = {
                "light": channel.get("chlogo_light"),
                "dark": channel.get("chlogo_dark"),
            }

            updated_channel["channel_names"] = {
                "clean": channel.get("channel_name", ""),
                "location": channel.get("channel_name_location")
                or channel.get("channel_name", ""),
                "real": channel.get("channel_name_real")
                or channel.get("channel_name", ""),
            }

            updated_channel["other_data"] = {
                "channel_type": channel.get("channel_type"),
                "channel_specs": " ".join(
                    filter(None, [channel.get("chantype"), channel.get("chancomp")])
                ).strip(),
            }

            # Cleanup
            # updated_channel.pop("guidelink")
            updated_channel.pop("chanlcnfta1")
            updated_channel.pop("chanlcnfta2")
            updated_channel.pop("chanlcnfta3")
            updated_channel.pop("chanlcnfox")
            updated_channel.pop("chanlcnfet")
            updated_channel.pop("chlogo_light")
            updated_channel.pop("chlogo_dark")
            updated_channel.pop("channel_name_location")
            updated_channel.pop("channel_name_real")
            updated_channel.pop("chantype")
            updated_channel.pop("chancomp")
            updated_channel.pop("channel_type")

            updated_provider_channels.append(updated_channel)

        await save_json_file(updated_provider_channels, channels_file)
        logging.info(
            f"Created {channels_file} with {len(updated_provider_channels)} channels"
        )

        # Create xmlepg_source entry
        xmlepg_source = {
            "id": f"xmlepg_{provid}",
            "group": provider.get("group", "Unknown"),
            "subgroup": provider.get("subgroup", "Unknown"),
            "location": provider.get("location", "Unknown"),
            "url": provider.get("url", "Unknown"),
        }
        xmlepg_sources.append(xmlepg_source)

        for channel in updated_provider_channels:
            guidelink = channel.get("guidelink")
            if guidelink and guidelink in guide_data_dict:
                channel_programs = guide_data_dict[guidelink]
                logging.info(f"  Processing channel: {guidelink}")
                logging.info(
                    f"    Total programs in guide data: {channel_counts.get(guidelink, 0)}"
                )

                programs_added = 0
                for program in channel_programs:
                    try:
                        channel = program["channel"]
                        start_time = parse_datetime(program["start_time"])
                        end_time = parse_datetime(program["end_time"])

                        # Round to nearest minute
                        start_time = round_to_nearest_minute(start_time)
                        end_time = round_to_nearest_minute(end_time)

                        program["start_time"] = start_time.isoformat()
                        program["end_time"] = end_time.isoformat()
                        program["start"] = start_time.strftime("%H:%M:%S")
                        program["end"] = end_time.strftime("%H:%M:%S")

                        length = end_time - start_time
                        program["length"] = str(
                            timedelta(seconds=int(length.total_seconds()))
                        )

                        program["channel"] = re.sub(r"\W+", "-", channel)

                        if first_program is None or start_time < first_program:
                            first_program = start_time
                        if last_program is None or end_time > last_program:
                            last_program = end_time

                        # Update null or empty fields to "N/A"
                        for key, value in program.items():
                            if value is None or (
                                isinstance(value, str) and value.strip() == ""
                            ):
                                program[key] = "N/A"

                        # Handle 'categories' field
                        if isinstance(program["categories"], str):
                            if program["categories"] != "N/A":
                                program["categories"] = [
                                    cat.strip()
                                    for cat in program["categories"].split(",")
                                    if cat.strip()
                                ]
                            else:
                                program["categories"] = []
                        elif isinstance(program["categories"], list):
                            program["categories"] = [
                                cat.strip()
                                for cat in program["categories"]
                                if cat.strip()
                            ]
                        else:
                            program["categories"] = []

                        provider_programs.append(program)
                        programs_added += 1
                    except ValueError as e:
                        logging.error(f"Error processing program: {e}")
                        continue
                    except KeyError as e:
                        logging.error(f"Missing key in program data: {e}")
                        continue

                logging.info(f"    Programs added for this channel: {programs_added}")
                provider_channel_counts[guidelink] = programs_added
            else:
                logging.warning(f"  Channel {guidelink} not found in guide data")

        if provider_programs:
            programs_file = os.path.join(
                DATA_LOCATION, f"xmlepg_{provid}_programs.json"
            )
            await save_json_file(provider_programs, programs_file)
            logging.info(
                f"Created {programs_file} with {len(provider_programs)} programs"
            )

            if first_program and last_program:
                logging.info(f"Provider: {provid}")
                logging.info(f"  First program: {first_program.isoformat()}")
                logging.info(f"  Last program:  {last_program.isoformat()}")
                logging.info("  Channel program counts:")
                for channel, count in provider_channel_counts.items():
                    logging.info(f"    {channel}: {count} programs")
            else:
                logging.warning(f"Provider: {provid} - No valid program times found")
        else:
            logging.warning(f"No matching programs found for provider {provid}")

    # Save xmlepg_source.json
    await save_json_file(
        xmlepg_sources, os.path.join(DATA_LOCATION, "xmlepg_source.json")
    )
    logging.info(f"Created xmlepg_source.json with {len(xmlepg_sources)} sources")


async def load_json_file(file_path: str) -> Any:
    with open(file_path, "r") as f:
        return json.load(f)


async def save_json_file(data: Any, file_path: str) -> None:
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w") as file:
            json.dump(data, file, indent=2)
        logging.info(f"Successfully saved data to '{file_path}'")
    except Exception as e:
        logging.error(f"Error saving data to '{file_path}': {e}")


async def build_provider_from_sql(
    provid: str,
    sql: str,
    group: str = "Custom SQL",
    subgroup: str = "Custom",
    location: str = "SQL",
    url: str = "local",
) -> Dict[str, Any]:
    """
    Execute the given SQL to retrieve rows, then wrap them in a provider dict.
    SQL must return columns matching your channel fields (guidelink, channel_slug, etc.).
    """
    # Execute raw SQL against your MySQL datasource
    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    channels = []
    for row in rows:
        # Attach provider id to each channel row
        # row["provid"] = provid
        channels.append(row)

    return {
        "provid": provid,
        "group": group,
        "subgroup": subgroup,
        "location": location,
        "url": url,
        "channels": channels,
    }


def post_process_channels(
    raw_channels: List[Dict[str, Any]],
    channel_counts: Dict[str, int],
) -> List[Dict[str, Any]]:
    """
    Take raw SQL channel dicts and annotate them with:
      - channel_number (from chanlcnfta1)
      - program_count
      - structured channel_logo and channel_names
      - other_data
    Remove raw cruft fields afterwards.
    """
    processed = []
    for ch in raw_channels:
        upd = ch.copy()
        # channel number
        num = ch.get("chanlcnfta1")
        upd["channel_number"] = str(num) if num and num != 0 else "N/A"
        # program count
        slug = ch.get("channel_slug") or ch.get("guidelink", "").replace(".", "-")
        upd["program_count"] = channel_counts.get(slug, 0)
        # logos
        upd["channel_logo"] = {
            "light": ch.get("chlogo_light"),
            "dark": ch.get("chlogo_dark"),
        }
        # names
        upd["channel_names"] = {
            "clean": ch.get("channel_name", ""),
            "location": ch.get("channel_name_location") or ch.get("channel_name", ""),
            "real": ch.get("channel_name_real", ""),
        }
        # other data
        upd["other_data"] = {
            "channel_type": ch.get("channel_type"),
            "channel_specs": " ".join(
                filter(None, [ch.get("chantype"), ch.get("chancomp")])
            ),
            "channel_name_group": ch.get("channel_name"),
        }
        # drop raw columns
        for key in [
            "chanlcnfta1",
            "chanlcnfta2",
            "chanlcnfta3",
            "chanlcnfox",
            "chanlcnfet",
            "chlogo_light",
            "chlogo_dark",
            "channel_name_location",
            "channel_name_real",
            "chantype",
            "chancomp",
            "channel_type",
        ]:
            upd.pop(key, None)
        processed.append(upd)
    return processed


def count_programs_per_channel(guide_data: List[Dict[str, Any]]) -> Dict[str, int]:

    channel_counts = Counter(item["channel"] for item in guide_data)
    return dict(channel_counts)

async def process_group_data(group_config: Dict[str, List[str]]) -> None:  # noqa: C901
    for group_name, channel_groups in group_config.items():
        # Filter channels
        with open(FILTERED_CHANNEL_DATA_FILE, "r") as f:
            all_channels = json.load(f)

        filtered_channels = [
            channel
            for channel in all_channels
            if channel.get("channel_group") in channel_groups
        ]

        # Post-process channels
        updated_channels = []
        for channel in filtered_channels:
            updated_channel = channel.copy()

            # Channel number logic using only chanlcnfta1
            channel_number = channel.get("chanlcnfta1")
            if channel_number and channel_number != 0:
                updated_channel["channel_number"] = str(channel_number)
            else:
                updated_channel["channel_number"] = "N/A"
                logging.warning(
                    f"Channel number not found or is 0 for channel {channel.get('guidelink', 'Unknown')}. Set to 'N/A'."
                )

            # Add program_count (we'll calculate this later)
            updated_channel["program_count"] = 0

            updated_channel["channel_logo"] = {
                "light": channel.get("chlogo_light"),
                "dark": channel.get("chlogo_dark"),
            }

            updated_channel["channel_names"] = {
                "clean": channel.get("channel_name_location"),
                "location": channel.get("channel_name_location"),
                "real": channel.get("channel_name_location"),
            }

            updated_channel["other_data"] = {
                "channel_type": channel.get("channel_type"),
                "channel_specs": " ".join(
                    filter(None, [channel.get("chantype"), channel.get("chancomp")])
                ).strip(),
                "channel_name_group": channel.get("channel_name", ""),
            }

            updated_channel["channel_name"] = channel.get("channel_name_location")

            # Cleanup
            for key in [
                "chanlcnfta1",
                "chanlcnfta2",
                "chanlcnfta3",
                "chanlcnfox",
                "chanlcnfet",
                "chlogo_light",
                "chlogo_dark",
                "channel_name_location",
                "channel_name_real",
                "chantype",
                "chancomp",
                "channel_type",
            ]:
                channel.pop(key, None)

            updated_channels.append(updated_channel)

        # Filter and post-process programs
        with open(GUIDE_DATA_FILE, "r") as f:
            all_programs = json.load(f)

        channel_slugs = {channel["channel_slug"] for channel in updated_channels}
        filtered_programs = []
        first_program = None
        last_program = None
        program_counts = {slug: 0 for slug in channel_slugs}

        for program in all_programs:
            channel_slug = re.sub(r"\W+", "-", program.get("channel", ""))
            if channel_slug in channel_slugs:
                try:
                    start_time = parse_datetime(program["start_time"])
                    end_time = parse_datetime(program["end_time"])

                    # Round to nearest minute
                    start_time = round_to_nearest_minute(start_time)
                    end_time = round_to_nearest_minute(end_time)

                    program["start_time"] = start_time.isoformat()
                    program["end_time"] = end_time.isoformat()
                    program["start"] = start_time.strftime("%H:%M:%S")
                    program["end"] = end_time.strftime("%H:%M:%S")

                    length = end_time - start_time
                    program["length"] = str(
                        timedelta(seconds=int(length.total_seconds()))
                    )

                    program["channel"] = channel_slug

                    if first_program is None or start_time < first_program:
                        first_program = start_time
                    if last_program is None or end_time > last_program:
                        last_program = end_time

                    # Update null or empty fields to "N/A"
                    for key, value in program.items():
                        if value is None or (
                            isinstance(value, str) and value.strip() == ""
                        ):
                            program[key] = "N/A"

                    # Handle 'categories' field
                    if isinstance(program["categories"], str):
                        if program["categories"] != "N/A":
                            program["categories"] = [
                                cat.strip()
                                for cat in program["categories"].split(",")
                                if cat.strip()
                            ]
                        else:
                            program["categories"] = []
                    elif isinstance(program["categories"], list):
                        program["categories"] = [
                            cat.strip() for cat in program["categories"] if cat.strip()
                        ]
                    else:
                        program["categories"] = []

                    filtered_programs.append(program)
                    program_counts[channel_slug] += 1
                except ValueError as e:
                    logging.error(f"Error processing program: {e}")
                except KeyError as e:
                    logging.error(f"Missing key in program data: {e}")

        # Update program counts in channels
        logging.info(program_counts)
        for channel in updated_channels:
            channel["program_count"] = program_counts.get(channel["channel_slug"], 0)

        # Save updated channels
        channels_file = os.path.join(
            DATA_LOCATION, f"xmlepg_group_{group_name}_channels.json"
        )
        await save_json_file(updated_channels, channels_file)
        logging.info(f"Created {channels_file} with {len(updated_channels)} channels")

        # Save filtered and processed programs
        programs_file = os.path.join(
            DATA_LOCATION, f"xmlepg_group_{group_name}_programs.json"
        )
        await save_json_file(filtered_programs, programs_file)
        logging.info(f"Created {programs_file} with {len(filtered_programs)} programs")

        if first_program and last_program:
            logging.info(f"Group: {group_name}")
            logging.info(f"  First program: {first_program.isoformat()}")
            logging.info(f"  Last program:  {last_program.isoformat()}")
        else:
            logging.warning(f"Group: {group_name} - No valid program times found")

        # Log program counts for each channel
        for channel in updated_channels:
            logging.info(
                f"  Channel {channel['channel_slug']}: {channel['program_count']} programs"
            )


async def process_epg() -> Dict[str, Any]:
    global process_status
    process_status["is_running"] = True
    process_status["start_time"] = datetime.now().isoformat()
    process_status["processed_sources"] = []
    process_status["errors"] = []

    try:
        logging.info("Starting EPG data processing")

        # Get providers
        try:
            providers = await get_providers()
            await save_json_file(providers, PROVIDER_LIST_FILE)
        except ValueError as e:
            raise Exception(f"Failed to get providers: {str(e)}")  # noqa: B904

        # Get and process channels
        channels = await get_channels(csv_file_path=ADDITIONAL_CHANNELS_CSV)
        if not channels:
            raise Exception("No channels found in the database.")

        valid_providnums = {provider["providnum"] for provider in providers}
        filtered_channels = await process_channel_data(channels, valid_providnums)
        if not filtered_channels:
            raise Exception("No channels match the providers.")
        await save_json_file(filtered_channels, FILTERED_CHANNEL_DATA_FILE)

        # Merge providers and channels
        merged_data = await reverse_merge_data(providers, filtered_channels)
        if not merged_data:
            raise Exception("No data after merging providers and channels.")
        await save_json_file(merged_data, MERGED_PROVIDER_CHANNEL_DATA_FILE)

        # Extract unique guidelinks and create SQL IN clause
        unique_guidelinks = await extract_unique_guidelinks(merged_data)
        if not unique_guidelinks:
            raise Exception("No unique guidelinks found.")
        sql_in_clause = format_sql_in_clause(unique_guidelinks)

        # Get guide data
        guide_data = await get_guide_data(sql_in_clause)
        if not guide_data:
            raise Exception("No guide data found for the given channels.")

        logging.info(f"Loaded {len(guide_data)} guide data entries")

        # Count programs per channel
        channel_counts = count_programs_per_channel(guide_data)

        # Create provider program files
        await create_provider_program_files(merged_data, guide_data, channel_counts)

        # Process group data
        group_config = {
            "abc": ["Australian Broadcasting Corporation"],
            "nine": [
                "Nine Entertainment Co.",
                "Nine Entertainment Co. (NBN)",
                "Imparja Television",
                "Mildura Digital Television (9)",
                "Southern Cross Austereo (Nine)",
                "West Digital Television (9)",
                "WIN Network",
            ],
            "sbs": ["Special Broadcasting Service"],
            "seven": [
                "Seven West Media",
                "Seven West Media (Prime)",
                "Southern Cross Austereo (Seven)",
                "TVSN",
                "WIN Network (Seven)",
            ],
            "ten": [
                "10 Network",
                "Central Digital Television",
                "Darwin Digital Television",
                "Mildura Digital Television",
                "Southern Cross Austereo",
                "Tasmania Digital Television",
                "West Digital Television",
                "WIN Network (10)",
            ],
        }
        await process_group_data(group_config)

        logging.info("Process completed.")
        process_status["status"] = "completed"
        process_status["message"] = "EPG data processing completed successfully"
        return {"message": "EPG data processing completed successfully"}

    except Exception as e:
        logging.error(f"An error occurred during EPG processing: {str(e)}")
        process_status["status"] = "error"
        process_status["message"] = f"Error during EPG processing: {str(e)}"
        raise

    finally:
        process_status["is_running"] = False
        process_status["end_time"] = datetime.now().isoformat()
        process_status["current_source"] = None


@router.get("/py/xmlepg/sources/status")
async def get_sources_status() -> Dict[str, SourceStatus]:
    status: Dict[str, SourceStatus] = {}
    for file in os.listdir(DATA_LOCATION):
        if file.endswith(".json"):
            file_path = os.path.join(DATA_LOCATION, file)
            file_stat = os.stat(file_path)
            file_date = datetime.fromtimestamp(file_stat.st_mtime).isoformat()

            if file == "xmlepg_source.json":
                status["source_file"] = SourceStatus(
                    source_file=FileStatus(status="exists", date=file_date),
                    channels=FileStatus(status="unknown", date=""),
                    programs=FileStatus(status="unknown", date=""),
                    group="XMLEPG",
                    subgroup="Unknown",
                    location="Unknown",
                )
            elif file.endswith("_channels.json"):
                provid = file.split("_")[1]
                if provid not in status:
                    status[provid] = SourceStatus(
                        source_file=FileStatus(status="unknown", date=""),
                        channels=FileStatus(status="exists", date=file_date),
                        programs=FileStatus(status="unknown", date=""),
                        group="XMLEPG",
                        subgroup="Unknown",
                        location="Unknown",
                    )
                else:
                    status[provid].channels = FileStatus(
                        status="exists", date=file_date
                    )
            elif file.endswith("_programs.json"):
                provid = file.split("_")[1]
                if provid not in status:
                    status[provid] = SourceStatus(
                        source_file=FileStatus(status="unknown", date=""),
                        channels=FileStatus(status="unknown", date=""),
                        programs=FileStatus(status="exists", date=file_date),
                        group="XMLEPG",
                        subgroup="Unknown",
                        location="Unknown",
                    )
                else:
                    status[provid].programs = FileStatus(
                        status="exists", date=file_date
                    )

    return status


@router.post("/py/xmlepg/process")
async def trigger_process_epg(background_tasks: BackgroundTasks) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {
                "message": "XMLEPG processing is already running",
                "status": process_status,
            },
            status_code=409,
        )

    background_tasks.add_task(process_epg)
    return JSONResponse(
        {"message": "XMLEPG processing started", "status": process_status},
        status_code=202,
    )


@router.get("/py/xmlepg/process-status")
async def get_process_status() -> Dict[str, Any]:
    global process_status
    return process_status


@router.post("/py/xmlepg/process-source/{source_id}")
async def process_single_source(
    source_id: str, background_tasks: BackgroundTasks
) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Another process is already running", "status": process_status},
            status_code=409,
        )

    async def process_single() -> None:
        global process_status
        process_status["is_running"] = True
        process_status["start_time"] = datetime.now().isoformat()
        process_status["current_source"] = source_id

        try:
            # Load providers
            with open(PROVIDER_LIST_FILE, "r") as f:
                providers = json.load(f)

            # Find the specific provider
            provider = next((p for p in providers if p["provid"] == source_id), None)
            if not provider:
                raise ValueError(f"Provider with ID {source_id} not found")

            # Load channels
            with open(FILTERED_CHANNEL_DATA_FILE, "r") as f:
                channels = json.load(f)

            # Process the single provider
            merged_data = await reverse_merge_data([provider], channels)

            if not merged_data:
                raise ValueError(f"No matching channels found for provider {source_id}")

            # Extract unique guidelinks for this provider
            unique_guidelinks = await extract_unique_guidelinks(merged_data)
            sql_in_clause = format_sql_in_clause(unique_guidelinks)

            # Get guide data for this provider
            guide_data = await get_guide_data(sql_in_clause)

            if not guide_data:
                raise ValueError(f"No guide data found for provider {source_id}")

            # Count programs per channel
            channel_counts = count_programs_per_channel(guide_data)

            # Create provider program files
            await create_provider_program_files(merged_data, guide_data, channel_counts)

            process_status["processed_sources"].append(source_id)
            process_status["message"] = f"Successfully processed source {source_id}"

        except Exception as e:
            logging.error(f"Error processing source {source_id}: {str(e)}")
            process_status["errors"].append(
                f"Error processing source {source_id}: {str(e)}"
            )
        finally:
            process_status["is_running"] = False
            process_status["end_time"] = datetime.now().isoformat()
            process_status["current_source"] = None

    background_tasks.add_task(process_single)
    return JSONResponse(
        {
            "message": f"Processing source {source_id} in the background",
            "status": process_status,
        },
        status_code=202,
    )

@router.post("/py/xmlepg/process-sql-provider")
async def process_sql_provider(
    body: Dict[str, str],
    background_tasks: BackgroundTasks,
) -> JSONResponse:
    if process_status.get("is_running"):
        return JSONResponse({"message": "Busy", "status": process_status}, 409)

    # Build provider dict from user-supplied SQL
    provider = await build_provider_from_sql(
        provid=body["provid"],
        sql=body["sql"],
        group=body.get("group", "Custom SQL"),
        subgroup=body.get("subgroup", "Custom"),
        location=body.get("location", "SQL"),
        url=body.get("url", "local"),
    )

    async def run() -> None:
        process_status.update(
            is_running=True,
            current_source=provider["provid"],
            start_time=datetime.now().isoformat(),
        )
        try:
            # Fetch guide rows only for these channels
            links = {ch["guidelink"] for ch in provider["channels"]}
            in_clause = format_sql_in_clause(links)
            guide_rows = await get_guide_data(in_clause)
            # Count programs
            counts = count_programs_per_channel(guide_rows)
            # Post-process channels
            processed = post_process_channels(provider["channels"], counts)
            channels_file = os.path.join(
                DATA_LOCATION, f"xmlepg_{provider['provid']}_channels.json"
            )
            await save_json_file(processed, channels_file)
            # Save programs raw
            programs_file = os.path.join(
                DATA_LOCATION, f"xmlepg_{provider['provid']}_programs.json"
            )
            await save_json_file(guide_rows, programs_file)
        except Exception as e:
            logging.error(f"SQL-provider run failed: {e}")
            process_status.setdefault("errors", []).append(str(e))
        finally:
            process_status.update(
                is_running=False,
                end_time=datetime.now().isoformat(),
                current_source=None,
            )

    background_tasks.add_task(run)
    return JSONResponse(
        {"message": "SQL provider queued", "status": process_status}, 202
    )


# === Specific FTA-SQL provider endpoint ===
@router.post("/py/xmlepg/process-fta-sql-provider")
async def process_fta_sql_provider(
    background_tasks: BackgroundTasks,
) -> JSONResponse:
    if process_status.get("is_running"):
        return JSONResponse({"message": "Busy", "status": process_status}, 409)

    sql = """
    SELECT
      ch.guidelink,
      ch.guidelink AS channel_id,
      REPLACE(ch.guidelink, '.', '-') AS channel_slug,
      ch.channame AS channel_name,
      TRIM(CONCAT(ch.channame, ' ', ch.chanloc)) AS channel_name_location,
      ch.channamereal AS channel_name_real,
      ct.chantypename AS chantype,
      cc.chancompname AS chancomp,
      ch.channetweb AS channel_url,
      ch.chanbouq,
      ch.chanlcnfta1,
      ch.chanlcnfta2,
      ch.chanlcnfta3,
      ch.chanlcnfox,
      ch.chanlcnfet,
      NULL AS channel_number,
      cl.logoremotelight AS chlogo_light,
      cl.logoremotedark AS chlogo_dark,
      nt.networkname AS channel_group,
      cg.groupname AS channel_type,
      cl.logoremotelight AS chlogo
    FROM channels ch
    LEFT JOIN chancomp cc ON ch.chancomp = cc.chancompid
    LEFT JOIN changroups cg ON ch.changroup = cg.groupid
    LEFT JOIN chanlogos cl ON ch.chanlogo = cl.logoid
    LEFT JOIN chantypes ct ON ch.chantype = ct.chantypeid
    LEFT JOIN networks nt ON ch.channetwork = nt.networkid
    WHERE
      ch.chanshowonlistview <> '0'
      AND ch.guidelink <> 'CLOSED'
      AND EXISTS (
          SELECT 1
          FROM providers p
          WHERE p.providnum IS NOT NULL
            AND p.provgroupname = 'FTA'
            AND p.provshow = 1
            AND p.provid != 'FTASEVAFL'
            AND FIND_IN_SET(p.providnum, ch.chanbouq) > 0
      );
    """

    provider = await build_provider_from_sql(
        provid="FTAALL",
        sql=sql,
        group="FTA Services",
        subgroup="FTA Channels",
        location="DB",
        url="local",
    )

    async def run() -> None:
        process_status.update(
            is_running=True,
            current_source="FTAALL",
            start_time=datetime.now().isoformat(),
        )
        try:
            # 1. Build provider and fetch guide rows
            provider = await build_provider_from_sql(
                provid="FTAALL",
                sql=sql,
                group="FTA Services",
                subgroup="FTA Channels",
                location="DB",
                url="local",
            )
            links = {ch["guidelink"] for ch in provider["channels"]}
            in_clause = format_sql_in_clause(links)
            guide_rows = await get_guide_data(in_clause)

            # 2. Initial channel post-processing
            counts = Counter(item["channel"] for item in guide_rows)
            updated_channels = post_process_channels(provider["channels"], counts)
            # override channel_name to use the 'location' variant
            for ch in updated_channels:
                ch["channel_name"] = ch["channel_names"]["location"]
                ch["channel_names"]["real"] = ch["channel_names"]["location"]
                ch["channel_names"]["clean"] = ch["channel_names"]["location"]

            # 3. Filter and post-process programs
            with open(GUIDE_DATA_FILE, "r") as f:
                all_programs = json.load(f)

            channel_slugs = {ch["channel_slug"] for ch in updated_channels}
            filtered_programs = []
            program_counts = {slug: 0 for slug in channel_slugs}

            for program in all_programs:
                slug = re.sub(r"\W+", "-", program.get("channel", ""))
                if slug in channel_slugs:
                    try:
                        start_time = round_to_nearest_minute(
                            parse_datetime(program["start_time"])
                        )
                        end_time = round_to_nearest_minute(
                            parse_datetime(program["end_time"])
                        )

                        program.update(
                            {
                                "start_time": start_time.isoformat(),
                                "end_time": end_time.isoformat(),
                                "start": start_time.strftime("%H:%M:%S"),
                                "end": end_time.strftime("%H:%M:%S"),
                                "length": str(
                                    timedelta(
                                        seconds=int(
                                            (end_time - start_time).total_seconds()
                                        )
                                    )
                                ),
                                "channel": slug,
                            }
                        )

                        # Normalize null/empty
                        for k, v in list(program.items()):
                            if v is None or (isinstance(v, str) and not v.strip()):
                                program[k] = "N/A"

                        # Normalize categories to a list
                        cats = program.get("categories", [])
                        if isinstance(cats, str) and cats != "N/A":
                            program["categories"] = [
                                c.strip() for c in cats.split(",") if c.strip()
                            ]
                        elif isinstance(cats, list):
                            program["categories"] = [
                                c.strip() for c in cats if c.strip()
                            ]
                        else:
                            program["categories"] = []

                        filtered_programs.append(program)
                        program_counts[slug] += 1

                    except Exception as e:
                        logging.error(f"Error processing program: {e}")

            # 4. Update channels with their final program_count
            for ch in updated_channels:
                ch["program_count"] = program_counts.get(ch["channel_slug"], 0)

            # 5. Persist outputs
            channels_file = os.path.join(DATA_LOCATION, "xmlepg_FTAALL_channels.json")
            await save_json_file(updated_channels, channels_file)

            programs_file = os.path.join(DATA_LOCATION, "xmlepg_FTAALL_programs.json")
            await save_json_file(filtered_programs, programs_file)

        except Exception as e:
            logging.error(f"FTA-SQL provider run failed: {e}")
            process_status.setdefault("errors", []).append(str(e))
        finally:
            process_status.update(
                is_running=False,
                end_time=datetime.now().isoformat(),
            )

    background_tasks.add_task(run)
    return JSONResponse(
        {"message": "FTA-SQL provider queued", "status": process_status}, 202
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
