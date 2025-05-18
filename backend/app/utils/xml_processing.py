import json
import os
import re
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional

from lxml import etree

from app.config import settings
from app.utils.channel_name import clean_channel_name, get_channel_group
from app.utils.file_operations import write_json


def get_child_as_text(parent: etree._Element, tag: str) -> str:
    node: Optional[etree._Element] = parent.find(tag)
    return node.text if node is not None and node.text is not None else "N/A"

def process_program(program: etree._Element) -> Dict[str, Any]:
    start: datetime = datetime.strptime(program.get("start", ""), "%Y%m%d%H%M%S %z")
    end: datetime = datetime.strptime(program.get("stop", ""), "%Y%m%d%H%M%S %z")
    episode_number: Optional[str] = None
    original_air_date: Optional[str] = None
    for episode_num in program.findall('episode-num'):
        system: Optional[str] = episode_num.get("system")
        if system == 'SxxExx':
            episode_number = episode_num.text
        elif system == 'original-air-date':
            original_air_date = episode_num.text

    rating_element: Optional[etree._Element] = program.find("rating/value")
    rating: str = (
        rating_element.text
        if rating_element is not None and rating_element.text is not None
        else "N/A"
    )

    return {
        "start_time": start.isoformat(),
        "start": start.strftime("%H:%M"),
        "end_time": end.isoformat(),
        "end": end.strftime("%H:%M"),
        "length": str(end - start),
        "channel": re.sub(r"\W+", "-", program.get("channel", "")),
        "title": get_child_as_text(program, "title"),
        "subtitle": get_child_as_text(program, "sub-title"),
        "description": get_child_as_text(program, "desc"),
        "categories": [
            category.text
            for category in program.findall("category")
            if category.text is not None
        ],
        "episode": episode_number if episode_number is not None else "N/A",
        "original_air_date": original_air_date
        if original_air_date is not None
        else "N/A",
        "rating": rating,
    }

async def process_xml_file(file_id: str, save_path: str) -> None:  # noqa: C901
    try:
        parser = etree.XMLParser(recover=True)
        tree = etree.parse(save_path, parser)
        root = tree.getroot()

        original_channels: List[Dict[str, Any]] = []
        programs: List[Dict[str, Any]] = []
        for child in root:
            if child.tag == "channel":
                channel_id: str = child.get("id", "")
                if any(
                    channel.get("channel_id") == channel_id
                    for channel in original_channels
                ):
                    print(
                        f"Warning: Duplicate channel ID '{channel_id}' found. Skipping."
                    )
                    continue  # Skip to the next channel element
                display_name: Optional[etree._Element] = child.find("display-name")
                lcn: Optional[etree._Element] = child.find("lcn")
                icon: Optional[etree._Element] = child.find("icon")
                url: Optional[etree._Element] = child.find("url")
                chlogo: str = "N/A"
                if icon is not None:
                    src = icon.get("src")
                    if src is not None:
                        chlogo = str(src)

                if display_name is not None and display_name.text is not None:
                    channel_name = display_name.text
                else:
                    channel_name = "N/A"

                if url is not None and url.text is not None:
                    channel_url = url.text
                else:
                    channel_url = "N/A"

                if channel_name != "N/A" and file_id.startswith("xmltvnet"):
                    cleaned_name = clean_channel_name(channel_name)
                    cleaned_name_slug = re.sub(r"\W+", "-", cleaned_name).lower()
                    channel_group = get_channel_group(cleaned_name)
                    chlogo = "/logos/" + cleaned_name_slug + ".png"
                    channel_name = cleaned_name
                else:
                    cleaned_name = channel_name
                    channel_group = "Unknown"
                    cleaned_name_slug = "placeholder"

                original_channels.append(
                    {
                        "channel_id": channel_id,
                        "channel_slug": re.sub(r"\W+", "-", channel_id),
                        "channel_name": channel_name,
                        "channel_names": {
                            "clean": cleaned_name,
                            "location": channel_name,
                            "real": channel_name,
                        },
                        "channel_number": lcn.text
                        if lcn is not None and lcn.text is not None
                        else "N/A",
                        "chlogo": chlogo,
                        "channel_group": channel_group,
                        "channel_url": channel_url,
                        "channel_logo": {"light": chlogo, "dark": chlogo},
                        "other_data": {"channel_type": "N/A", "channel_specs": "N/A"},
                    }
                )

            elif child.tag == "programme":
                programs.append(process_program(child))

        updated_channels: List[Dict[str, Any]] = []
        unchanged_channels: List[Dict[str, Any]] = []
        additional_data_file = os.path.join(
            settings.XMLTV_DATA_DIR, f"{file_id}_additionaldata.json"
        )
        additional_channels_map: Dict[str, Dict[str, Any]] = {}

        if os.path.exists(additional_data_file):
            with open(additional_data_file, "r", encoding="utf-8") as f:
                additional_channels: List[Dict[str, Any]] = json.load(f)
                additional_channels_map = {
                    channel.get("channel_id"): channel
                    for channel in additional_channels
                    if channel.get("channel_id")
                }
        else:
            print(
                f"Info: Additional channel data file '{additional_data_file}' not found."
            )

        # Process original channels: update if in additional data, otherwise keep original
        for original_channel in original_channels:
            channel_id = original_channel["channel_id"]
            if channel_id in additional_channels_map:
                updated_channels.append(additional_channels_map[channel_id])
                # Remove processed channel_id from the map to track new channels
                del additional_channels_map[channel_id]
            else:
                updated_channels.append(original_channel)
                unchanged_channels.append(original_channel)

        # Add any remaining channels from additional_channels_map (these are the new ones)
        for new_channel_id, new_channel_data in additional_channels_map.items():
            updated_channels.append(new_channel_data)

        # Count the number of programs for each channel (using the possibly updated channel_slug)
        channel_program_counts = Counter(program["channel"] for program in programs)

        # Add program_count to channels
        for channel in updated_channels:
            channel["program_count"] = channel_program_counts.get(
                channel.get(
                    "channel_slug", re.sub(r"\W+", "-", channel.get("channel_id", ""))
                ),
                0,
            )

        write_json(f"{file_id}_channels.json", updated_channels)
        write_json(f'{file_id}_programs.json', programs)
        write_json(f"{file_id}_datacheck.json", unchanged_channels)

    except Exception as exc:
        print(f"Error processing XML file {file_id}.xml: {str(exc)}")
