import gzip
import json
import logging
import os
from typing import Any, Dict

import aiohttp

from app.config import settings

logger = logging.getLogger(__name__)

async def download_file(
    session: aiohttp.ClientSession, file_url: str, file_id: str
) -> bool:
    save_path: str = os.path.join(settings.XMLTV_DATA_DIR, f"{file_id}.xml")

    try:
        async with session.get(file_url) as response:
            response.raise_for_status()
            content: bytes = await response.read()

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

def write_json(filename: str, data: Any) -> None:
    file_path: str = os.path.join(settings.XMLTV_DATA_DIR, filename)
    with open(file_path, 'w', encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    logger.info(f"Data saved to {filename}")

def load_json(filename: str) -> Any:
    file_path: str = os.path.join(settings.XMLTV_DATA_DIR, filename)
    with open(file_path, 'r', encoding="utf-8") as f:
        return json.load(f)

def load_sources(filename: str) -> Dict[str, Any]:
    file_path: str = os.path.join(filename)
    with open(file_path, 'r', encoding="utf-8") as f:
        return json.load(f)
