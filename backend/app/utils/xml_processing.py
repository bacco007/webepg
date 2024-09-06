import xml.etree.ElementTree as ET
import re
from datetime import datetime
from app.utils.file_operations import write_json

def get_child_as_text(parent: ET.Element, tag: str) -> str:
    node = parent.find(tag)
    return node.text if node is not None else "N/A"

def process_program(program):
    start = datetime.strptime(program.attrib.get("start"), "%Y%m%d%H%M%S %z")
    end = datetime.strptime(program.attrib.get("stop"), "%Y%m%d%H%M%S %z")
    episode_number = None
    original_air_date = None
    for episode_num in program.findall('episode-num'):
        system = episode_num.attrib.get('system')
        if system == 'SxxExx':
            episode_number = episode_num.text
        # elif system == 'xmltv_ns':
        #     programme_details['episode_num_xmltv_ns'] = episode_num.text
        elif system == 'original-air-date':
            original_air_date = episode_num.text
    return {
        "start_time": start.isoformat(),
        "start": start.strftime("%H:%M"),
        "end_time": end.isoformat(),
        "end": end.strftime("%H:%M"),
        "length": str(end - start),
        "channel": re.sub(r'\W+', '-', program.attrib.get("channel")),
        "title": get_child_as_text(program, "title"),
        "subtitle": get_child_as_text(program, "sub-title"),
        "description": get_child_as_text(program, "title"),
        "categories": [category.text for category in program.findall('category')],
        "episode": episode_number if episode_number is not None else "N/A",
        "original_air_date": original_air_date if original_air_date is not None else "N/A",
        'rating': program.find('rating/value').text if program.find('rating/value') is not None else "N/A"
    }

async def process_xml_file(file_id, save_path):
    try:
        with open(save_path, encoding="utf-8") as file_desc:
            xml = ET.fromstring(file_desc.read())

        channels = []
        programs = []
        for child in xml:
            if child.tag == "channel":
                channels.append({
                    "channel_id": child.attrib.get("id"),
                    "channel_slug": re.sub(r'\W+', '-', child.attrib.get("id")),
                    "channel_name": child.find("display-name").text,
                    "channel_number": child.find("lcn").text if child.find("lcn") is not None else "N/A",
                    "chlogo": child.find("icon").get("src") if child.find("icon") is not None else "N/A"
                })
            elif child.tag == "programme":
                programs.append(process_program(child))

        write_json(f'{file_id}_channels.json', channels)
        write_json(f'{file_id}_programs.json', programs)

    except Exception as exc:
        logger.error(f"Error processing XML file {file_id}.xml: {str(exc)}")
