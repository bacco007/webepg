import os
import json
import aiohttp
import gzip
import logging
from app.config import settings

logger = logging.getLogger(__name__)

async def download_file(session, file_url, file_id):
    save_path = os.path.join(settings.XMLTV_DATA_DIR, f'{file_id}.xml')

    try:
        async with session.get(file_url) as response:
            response.raise_for_status()
            content = await response.read()

        if file_url.endswith('.gz'):
            logger.info(f"Detected .gz file for {file_id}, decompressing")
            content = gzip.decompress(content)

        with open(save_path, 'wb') as f:
            f.write(content)

        logger.info(f"{file_id}.xml downloaded and saved.")
        return True
    except Exception as e:
        logger.error(f"Error downloading {file_url}: {str(e)}")
        return False

def write_json(filename, data):
    file_path = os.path.join(settings.XMLTV_DATA_DIR, filename)
    with open(file_path, 'w', encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    logger.info(f"Data saved to {filename}")

def load_json(filename):
    file_path = os.path.join(settings.XMLTV_DATA_DIR, filename)
    with open(file_path, 'r', encoding="utf-8") as f:
        return json.load(f)

def load_sources(filename):
    file_path = os.path.join(filename)
    with open(file_path, 'r', encoding="utf-8") as f:
        return json.load(f)
