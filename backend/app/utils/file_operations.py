import gzip
import json
import logging
import lzma
from pathlib import Path
from typing import Any, Dict, List

import aiohttp
from aiohttp import ClientResponseError, ClientTimeout

from app.config import settings

logger = logging.getLogger(__name__)

async def download_file(
    session: aiohttp.ClientSession, file_url: str, file_id: str
) -> bool:
    """
    Download a file from a URL and save it locally.

    Args:
        session: aiohttp client session
        file_url: URL of the file to download
        file_id: Identifier for the file (used in the saved filename)

    Returns:
        bool: True if download and save were successful, False otherwise

    Raises:
        ClientResponseError: If the HTTP request fails
        OSError: If there are issues writing the file
    """
    save_path = Path(settings.XMLTV_DATA_DIR) / f"{file_id}.xml"
    save_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        timeout = ClientTimeout(total=30)
        async with session.get(file_url, timeout=timeout) as response:
            response.raise_for_status()
            content: bytes = await response.read()

        if file_url.endswith('.gz'):
            logger.info(f"Detected .gz file for {file_id}, decompressing")
            content = gzip.decompress(content)
        elif file_url.endswith(".xz"):
            logger.info(f"Detected .xz file for {file_id}, decompressing")
            content = lzma.decompress(content)

        save_path.write_bytes(content)
        logger.info(f"{file_id}.xml downloaded and saved to {save_path}")
        return True

    except ClientResponseError as e:
        logger.error(f"HTTP error downloading {file_url}: {e.status} {e.message}")
        return False
    except (OSError, lzma.LZMAError, gzip.BadGzipFile) as e:
        logger.error(f"File system error saving {file_id}.xml: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error downloading {file_url}: {str(e)}")
        return False

def write_json(filename: str, data: Any, indent: int = 4) -> None:
    """
    Write data to a JSON file.

    Args:
        filename: Name of the file to write
        data: Data to write to the file
        indent: Number of spaces for indentation

    Raises:
        OSError: If there are issues writing the file
        TypeError: If the data is not JSON serializable
    """
    file_path = Path(settings.XMLTV_DATA_DIR) / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with file_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=indent)
        logger.info(f"Data saved to {file_path}")
    except (OSError, TypeError) as e:
        logger.error(f"Error writing to {filename}: {str(e)}")
        raise

def load_json(filename: str) -> Any:
    """
    Load data from a JSON file.

    Args:
        filename: Name of the file to read

    Returns:
        The loaded JSON data

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    file_path = Path(settings.XMLTV_DATA_DIR) / filename

    try:
        with file_path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {filename}: {str(e)}")
        raise

def load_sources(filename: str) -> Dict[str, Any]:
    """
    Load source configuration from a JSON file.

    Args:
        filename: Path to the source configuration file

    Returns:
        Dictionary containing source configuration

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    file_path = Path(filename)

    try:
        with file_path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Source configuration file not found: {file_path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in source configuration {filename}: {str(e)}")
        raise

def load_list(file_path: str) -> List[Dict[str, Any]]:
    """
    Load JSON data from a file and return it as a list of dictionaries.

    Args:
        file_path: Path to the JSON file

    Returns:
        List of dictionaries from the JSON file

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
        ValueError: If the JSON data is not a list
    """
    path = Path(file_path)

    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError(f"JSON data in {file_path} is not a list")

        return data
    except FileNotFoundError:
        logger.error(f"File not found: {path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path}: {str(e)}")
        raise
