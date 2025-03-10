import re
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional

from lxml import etree

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

        channels: List[Dict[str, Any]] = []
        programs: List[Dict[str, Any]] = []
        for child in root:
            if child.tag == "channel":
                channel_id: str = child.get("id", "")
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

                channels.append(
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

        # Count the number of programs for each channel
        channel_program_counts = Counter(program["channel"] for program in programs)

        # Add program_count to channels
        for channel in channels:
            channel["program_count"] = channel_program_counts.get(
                channel["channel_slug"], 0
            )

        write_json(f'{file_id}_channels.json', channels)
        write_json(f'{file_id}_programs.json', programs)

    except Exception as exc:
        print(f"Error processing XML file {file_id}.xml: {str(exc)}")

