import asyncio
import json
import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp
from fastapi import APIRouter, BackgroundTasks, Depends, Header, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.exceptions import (
    ConfigurationError,
    DataProcessingError,
    SourceNotFoundError,
    UnauthorizedError,
    WebEPGException,
)
from app.utils.file_operations import download_file, load_sources
from app.utils.xml_processing import process_xml_file

router = APIRouter()

# API Key authentication dependency
async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    """
    Verify the API key for protected endpoints.
    
    Args:
        x_api_key: The API key provided in the X-API-Key header.
    
    Returns:
        The validated API key.
    
    Raises:
        UnauthorizedError: If the API key is invalid or missing.
    """
    if not settings.ADMIN_API_KEY:
        raise UnauthorizedError("API key authentication is not configured")
    
    if x_api_key != settings.ADMIN_API_KEY:
        raise UnauthorizedError("Invalid API key")
    
    return x_api_key

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
    group: Optional[str] = None
    subgroup: Optional[str] = None
    location: Optional[str] = None


class Logo(BaseModel):
    light: str
    dark: str


class SourceEntry(BaseModel):
    id: str
    group: str
    subgroup: str
    location: str
    url: str
    logo: Optional[Logo] = None


class ChannelNames(BaseModel):
    """Nested model for channel name variations."""
    clean: Optional[str] = None
    location: Optional[str] = None
    real: Optional[str] = None


class ChannelLogo(BaseModel):
    """Nested model for channel logo URLs."""
    light: Optional[str] = None
    dark: Optional[str] = None


class OtherData(BaseModel):
    """Nested model for additional channel metadata."""
    channel_type: Optional[str] = None
    channel_specs: Optional[str] = None
    channel_availability: Optional[str] = None
    channel_packages: Optional[str] = None


class ChannelEntry(BaseModel):
    """Model for a single channel entry in additional data files.
    
    Matches the structure used in additionaldata.json files:
    - channel_names: nested object with clean, location, real
    - channel_logo: nested object with light, dark
    - other_data: nested object with channel_type, channel_specs, etc.
    """
    channel_id: str
    channel_slug: Optional[str] = None
    channel_name: Optional[str] = None
    channel_names: Optional[ChannelNames] = None
    channel_number: Optional[str] = None
    chlogo: Optional[str] = None
    channel_group: Optional[str] = None
    channel_url: Optional[str] = None
    channel_logo: Optional[ChannelLogo] = None
    other_data: Optional[OtherData] = None
    program_count: Optional[str | int] = None


class AdditionalDataEntry(BaseModel):
    """Model for additional data file content - array of channels."""
    channels: List[ChannelEntry]

@router.get(
    "/py/sources",
    summary="List All Sources",
    description="Retrieve a list of all configured XMLTV sources.",
    response_description="List of all available sources",
    responses={
        200: {
            "description": "Sources retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "xmltvnet",
                            "name": "XMLTV.net",
                            "url": "https://example.com/epg.xml",
                            "group": "Freeview",
                            "location": "Australia"
                        }
                    ]
                }
            }
        }
    }
)
async def get_sources() -> List[Dict[str, Any]]:
    """
    Get all configured XMLTV sources.
    
    Returns a merged list of sources from both main and local configuration files.
    Local sources take precedence over main sources if there are conflicts.
    
    **Returns:**
    A list of source objects containing:
    - `id`: Unique source identifier
    - `name`: Display name of the source
    - `url`: XMLTV file URL or "local" for local files
    - `group`: Source group/category (optional)
    - `location`: Geographic location (optional)
    
    **Example Response:**
    ```json
    [
        {
            "id": "xmltvnet",
            "name": "XMLTV.net",
            "url": "https://example.com/epg.xml",
            "group": "Freeview",
            "location": "Australia"
        }
    ]
    ```
    """
    # Load sources from both files
    main_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)  # type: ignore
    local_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES_LOCAL)  # type: ignore

    # Create a dictionary to store merged sources
    merged_sources: Dict[str, Dict[str, Any]] = {}

    # Merge main sources
    for source in main_sources:
        if "id" in source:
            merged_sources[source["id"]] = source

    # Merge local sources, overwriting main sources if there's a conflict
    for source in local_sources:
        if "id" in source:
            merged_sources[source["id"]] = source

    # Convert the merged dictionary back to a list
    return list(merged_sources.values())


@router.get(
    "/py/sources/status",
    summary="Get Sources Status",
    description="Check the processing status of all XMLTV sources including file availability.",
    response_description="Status information for all sources",
    responses={
        200: {
            "description": "Status information retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "xmltvnet": {
                            "source_file": {
                                "status": "downloaded",
                                "date": "2024-01-15T08:00:00.000000"
                            },
                            "channels": {
                                "status": "downloaded",
                                "date": "2024-01-15T08:05:00.000000"
                            },
                            "programs": {
                                "status": "downloaded",
                                "date": "2024-01-15T08:10:00.000000"
                            },
                            "group": "Freeview",
                            "location": "Australia"
                        }
                    }
                }
            }
        },
        404: {"description": "Source configuration file not found"}
    }
)
async def get_sources_status() -> Dict[str, SourceStatus]:
    """
    Get processing status for all sources.
    
    Returns detailed status information for each source including:
    - Source XML file status and last modified date
    - Processed channels file status
    - Processed programs file status
    - Source metadata (group, location)
    
    **Status Values:**
    - `downloaded`: File exists and has been processed
    - `missing`: File not found or not yet processed
    
    **Use Cases:**
    - Monitor source freshness
    - Identify sources that need updating
    - Check if processing completed successfully
    """
    try:
        main_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)  # type: ignore
        local_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES_LOCAL)  # type: ignore
    except FileNotFoundError as err:
        raise ConfigurationError("XMLTV sources file not found") from err

    # Merge the sources, with local_sources taking precedence
    merged_sources: Dict[str, Dict[str, Any]] = {}

    # Merge main sources
    for source in main_sources:
        if "id" in source:
            merged_sources[source["id"]] = source

    # Merge local sources, overwriting main sources if there's a conflict
    for source in local_sources:
        if "id" in source:
            merged_sources[source["id"]] = source

    status_dict: Dict[str, SourceStatus] = {}

    for source_id, source in merged_sources.items():
        source_file = f"{source_id}.xml"
        channels_file = f"{source_id}_channels.json"
        programs_file = f"{source_id}_programs.json"

        status_dict[source_id] = SourceStatus(
            source_file=get_file_status(source_file),
            channels=get_file_status(channels_file),
            programs=get_file_status(programs_file),
            group=source.get("group"),
            subgroup=source.get("subgroup"),
            location=source.get("location"),
        )

    return status_dict

def get_file_status(filename: str) -> FileStatus:
    file_path = os.path.join(settings.XMLTV_DATA_DIR, filename)
    if os.path.exists(file_path):
        last_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
        return FileStatus(status="downloaded", date=last_modified.isoformat())
    else:
        return FileStatus(status="missing", date="")

async def process_source(
    session: aiohttp.ClientSession, source: Dict[str, Any]
) -> None:
    global process_status
    process_status["current_source"] = source["id"]

    file_id: str = source["id"]
    file_url: str = source["url"]
    save_path: str = os.path.join(settings.XMLTV_DATA_DIR, f"{file_id}.xml")

    if os.path.exists(save_path):
        file_age_hours: float = (time.time() - os.path.getmtime(save_path)) / 3600
        if file_age_hours < 2:
            await process_xml_file(file_id, save_path)
            process_status["processed_sources"].append(
                {
                    "id": file_id,
                    "status": "skipped",
                    "file_age_hours": round(file_age_hours, 2),
                }
            )
            return

    try:
        print(file_url)
        if file_url.lower() == "local":
            # If file_url is "local", skip downloading and process the existing file
            if os.path.exists(save_path):
                await process_xml_file(file_id, save_path)
                process_status["processed_sources"].append(
                    {"id": file_id, "status": "success", "file_age_hours": 0}
                )
            else:
                raise FileNotFoundError(f"Local file not found: {save_path}")
        else:
            # Download the file if it's not local
            success: bool = await download_file(session, file_url, file_id)
            if success:
                await process_xml_file(file_id, save_path)
                process_status["processed_sources"].append(
                    {"id": file_id, "status": "success", "file_age_hours": 0}
                )
            else:
                raise Exception("Download failed")
    except Exception as e:
        process_status["errors"].append({"id": file_id, "error": str(e)})
        process_status["processed_sources"].append(
            {"id": file_id, "status": "failed", "error": str(e)}
        )

async def process_all_sources(session: aiohttp.ClientSession) -> None:
    global process_status
    process_status["is_running"] = True
    process_status["start_time"] = datetime.now().isoformat()
    process_status["processed_sources"] = []
    process_status["errors"] = []

    xmltv_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)  # type: ignore

    for source in xmltv_sources:
        await process_source(session, source)
        if process_status["processed_sources"][-1]["status"] != "skipped":
            await asyncio.sleep(2)  # 2-second pause between downloads

    process_status["is_running"] = False
    process_status["end_time"] = datetime.now().isoformat()
    process_status["current_source"] = None

@router.get("/py/process-sources")
async def process_sources(background_tasks: BackgroundTasks) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Process is already running", "status": process_status}
        )

    async def run_process() -> None:
        async with aiohttp.ClientSession() as session:
            await process_all_sources(session)

    background_tasks.add_task(run_process)
    return JSONResponse(
        {"message": "Processing sources in the background", "status": process_status}
    )

@router.get("/py/process-status")
async def get_process_status() -> Dict[str, Any]:
    global process_status
    return process_status

@router.get("/py/process-source/{source_id}")
@router.post("/py/process-source/{source_id}")
async def process_single_source(
    source_id: str, background_tasks: BackgroundTasks
) -> JSONResponse:
    global process_status
    if process_status["is_running"]:
        return JSONResponse(
            {"message": "Another process is already running", "status": process_status}
        )

    main_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)  # type: ignore
    local_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES_LOCAL)  # type: ignore

    merged_sources: Dict[str, Dict[str, Any]] = {}
    for source in main_sources + local_sources:
        if "id" in source:
            merged_sources[source["id"]] = source

    if source_id not in merged_sources:
        raise SourceNotFoundError(source_id)

    source = merged_sources[source_id]

    async def run_single_process() -> None:
        global process_status
        process_status["is_running"] = True
        process_status["start_time"] = datetime.now().isoformat()
        process_status["processed_sources"] = []
        process_status["errors"] = []

        async with aiohttp.ClientSession() as session:
            await process_source(session, source)

        process_status["is_running"] = False
        process_status["end_time"] = datetime.now().isoformat()
        process_status["current_source"] = None

    background_tasks.add_task(run_single_process)
    return JSONResponse(
        {
            "message": f"Processing source {source_id} in the background",
            "status": process_status,
        }
    )


# ==================== Source Configuration Management Endpoints ====================

def read_sources_json(file_path: str) -> List[Dict[str, Any]]:
    """
    Read all sources from a JSON file.
    
    Args:
        file_path: Path to the JSON file.
    
    Returns:
        List of source dictionaries.
    """
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                return []
            return data
    except Exception as e:
        logging.error(f"Error reading sources JSON file {file_path}: {e}")
        raise DataProcessingError("read sources JSON", str(e)) from e


def write_sources_json(file_path: str, sources: List[Dict[str, Any]]) -> None:
    """
    Write sources to a JSON file.
    
    Args:
        file_path: Path to the JSON file.
        sources: List of source dictionaries.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(sources, f, indent=2, ensure_ascii=False)
        logging.info(f"Successfully wrote {len(sources)} sources to {file_path}")
    except Exception as e:
        logging.error(f"Error writing sources JSON file {file_path}: {e}")
        raise DataProcessingError("write sources JSON", str(e)) from e


# ==================== Additional Data File Helpers ====================

def get_additional_data_file_path(source_id: str, is_xmlepg: bool = False) -> str:
    """
    Get the path to an additional data file for a source.
    
    Supports two naming patterns:
    - Regular sources: {source_id}_additionaldata.json
    - XMLEPG sources: xmlepg_{source_id}_additionaldata.json
    
    Args:
        source_id: The source identifier.
        is_xmlepg: If True, use xmlepg_ prefix pattern.
    
    Returns:
        Full path to the additional data file.
    """
    if is_xmlepg:
        filename = f"xmlepg_{source_id}_additionaldata.json"
    else:
        filename = f"{source_id}_additionaldata.json"
    
    return os.path.join(settings.XMLTV_DATA_DIR, filename)


def find_additional_data_file(source_id: str) -> Optional[str]:
    """
    Find an additional data file for a source, checking both naming patterns.
    
    Args:
        source_id: The source identifier.
    
    Returns:
        Full path to the file if found, None otherwise.
    """
    # Try regular pattern first
    regular_path = get_additional_data_file_path(source_id, is_xmlepg=False)
    if os.path.exists(regular_path):
        return regular_path
    
    # Try xmlepg pattern
    xmlepg_path = get_additional_data_file_path(source_id, is_xmlepg=True)
    if os.path.exists(xmlepg_path):
        return xmlepg_path
    
    return None


def discover_additional_data_files() -> List[Dict[str, Any]]:
    """
    Discover all additional data files in the remote directory.
    
    Returns:
        List of dictionaries with source_id, file_path, and pattern info.
    """
    additional_data_files: List[Dict[str, Any]] = []
    
    if not os.path.exists(settings.XMLTV_DATA_DIR):
        return additional_data_files
    
    try:
        for file in os.listdir(settings.XMLTV_DATA_DIR):
            if file.endswith("_additionaldata.json"):
                # Determine pattern and extract source_id
                if file.startswith("xmlepg_") and file.endswith("_additionaldata.json"):
                    # Pattern: xmlepg_{source_id}_additionaldata.json
                    source_id = file[7:-19]  # Remove "xmlepg_" prefix and "_additionaldata.json" suffix
                    is_xmlepg = True
                elif file.endswith("_additionaldata.json"):
                    # Pattern: {source_id}_additionaldata.json
                    source_id = file[:-19]  # Remove "_additionaldata.json" suffix
                    is_xmlepg = False
                else:
                    continue
                
                file_path = os.path.join(settings.XMLTV_DATA_DIR, file)
                
                # Get file stats
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    last_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
                    
                    additional_data_files.append({
                        "source_id": source_id,
                        "file_path": file_path,
                        "filename": file,
                        "is_xmlepg": is_xmlepg,
                        "file_size": file_size,
                        "last_modified": last_modified.isoformat(),
                    })
    
    except Exception as e:
        logging.error(f"Error discovering additional data files: {e}")
    
    return additional_data_files


def read_additional_data_json(file_path: str) -> List[Dict[str, Any]]:
    """
    Read additional data from a JSON file.
    
    Args:
        file_path: Path to the JSON file.
    
    Returns:
        List of channel dictionaries.
    """
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                return []
            return data
    except Exception as e:
        logging.error(f"Error reading additional data JSON file {file_path}: {e}")
        raise DataProcessingError("read additional data JSON", str(e)) from e


def write_additional_data_json(file_path: str, channels: List[Dict[str, Any]]) -> None:
    """
    Write additional data to a JSON file.
    
    Args:
        file_path: Path to the JSON file.
        channels: List of channel dictionaries.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(channels, f, indent=2, ensure_ascii=False)
        logging.info(f"Successfully wrote {len(channels)} channels to {file_path}")
    except Exception as e:
        logging.error(f"Error writing additional data JSON file {file_path}: {e}")
        raise DataProcessingError("write additional data JSON", str(e)) from e


@router.get("/py/sources/remote")
async def get_remote_sources(
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Get all remote sources from xmltvsources.json.
    
    Returns:
        Dictionary containing list of all remote source entries.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES)
        return {
            "count": len(sources),
            "sources": sources
        }
    except Exception as e:
        logging.error(f"Error retrieving remote sources: {e}")
        raise DataProcessingError("retrieve remote sources", str(e)) from e


@router.get("/py/sources/remote/{id}")
async def get_remote_source(
    id: str,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Get a specific remote source by id.
    
    Args:
        id: The unique identifier of the source.
    
    Returns:
        Dictionary representing the source entry.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES)
        for source in sources:
            if source.get("id") == id:
                return source
        
        raise SourceNotFoundError(id)
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error retrieving remote source {id}: {e}")
        raise DataProcessingError("retrieve remote source", str(e)) from e


@router.post("/py/sources/remote")
async def create_remote_source(
    source: SourceEntry,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Add a new remote source to xmltvsources.json.
    
    Args:
        source: The source data to add.
    
    Returns:
        Dictionary with success message and the created source.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES)
        
        # Check if source already exists
        for existing_source in sources:
            if existing_source.get("id") == source.id:
                raise WebEPGException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Source with id '{source.id}' already exists",
                    error_code="SOURCE_EXISTS",
                    error_type="SourceExistsError"
                )
        
        # Convert Pydantic model to dict
        source_dict = source.model_dump(exclude_none=True)
        sources.append(source_dict)
        write_sources_json(settings.XMLTV_SOURCES, sources)
        
        return {
            "message": "Source created successfully",
            "source": source_dict
        }
    except WebEPGException:
        raise
    except Exception as e:
        logging.error(f"Error creating remote source: {e}")
        raise DataProcessingError("create remote source", str(e)) from e


@router.put("/py/sources/remote/{id}")
async def update_remote_source(
    id: str,
    source: SourceEntry,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Update an existing remote source in xmltvsources.json.
    
    Args:
        id: The unique identifier of the source to update.
        source: The updated source data. The 'id' field in the body will be ignored (uses path parameter).
    
    Returns:
        Dictionary with success message and the updated source.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES)
        
        # Find and update the source
        updated_source = None
        for i, existing_source in enumerate(sources):
            if existing_source.get("id") == id:
                # Convert Pydantic model to dict
                source_dict = source.model_dump(exclude_none=True)
                # Override id with path parameter to ensure consistency
                source_dict["id"] = id
                sources[i] = source_dict
                updated_source = source_dict
                break
        
        if updated_source is None:
            raise SourceNotFoundError(id)
        
        write_sources_json(settings.XMLTV_SOURCES, sources)
        
        return {
            "message": "Source updated successfully",
            "source": updated_source
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error updating remote source {id}: {e}")
        raise DataProcessingError("update remote source", str(e)) from e


@router.delete("/py/sources/remote/{id}")
async def delete_remote_source(
    id: str,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, str]:
    """
    Delete a remote source from xmltvsources.json.
    
    Args:
        id: The unique identifier of the source to delete.
    
    Returns:
        Dictionary with success message.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES)
        
        # Find and remove the source
        original_count = len(sources)
        sources = [s for s in sources if s.get("id") != id]
        
        if len(sources) == original_count:
            raise SourceNotFoundError(id)
        
        write_sources_json(settings.XMLTV_SOURCES, sources)
        
        return {
            "message": f"Source '{id}' deleted successfully"
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error deleting remote source {id}: {e}")
        raise DataProcessingError("delete remote source", str(e)) from e


@router.get("/py/sources/local")
async def get_local_sources(
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Get all local sources from local.json.
    
    Returns:
        Dictionary containing list of all local source entries.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES_LOCAL)
        return {
            "count": len(sources),
            "sources": sources
        }
    except Exception as e:
        logging.error(f"Error retrieving local sources: {e}")
        raise DataProcessingError("retrieve local sources", str(e)) from e


@router.get("/py/sources/local/{id}")
async def get_local_source(
    id: str,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Get a specific local source by id.
    
    Args:
        id: The unique identifier of the source.
    
    Returns:
        Dictionary representing the source entry.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES_LOCAL)
        for source in sources:
            if source.get("id") == id:
                return source
        
        raise SourceNotFoundError(id)
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error retrieving local source {id}: {e}")
        raise DataProcessingError("retrieve local source", str(e)) from e


@router.post("/py/sources/local")
async def create_local_source(
    source: SourceEntry,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Add a new local source to local.json.
    
    Args:
        source: The source data to add.
    
    Returns:
        Dictionary with success message and the created source.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES_LOCAL)
        
        # Check if source already exists
        for existing_source in sources:
            if existing_source.get("id") == source.id:
                raise WebEPGException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Source with id '{source.id}' already exists",
                    error_code="SOURCE_EXISTS",
                    error_type="SourceExistsError"
                )
        
        # Convert Pydantic model to dict
        source_dict = source.model_dump(exclude_none=True)
        sources.append(source_dict)
        write_sources_json(settings.XMLTV_SOURCES_LOCAL, sources)
        
        return {
            "message": "Source created successfully",
            "source": source_dict
        }
    except WebEPGException:
        raise
    except Exception as e:
        logging.error(f"Error creating local source: {e}")
        raise DataProcessingError("create local source", str(e)) from e


@router.put("/py/sources/local/{id}")
async def update_local_source(
    id: str,
    source: SourceEntry,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Update an existing local source in local.json.
    
    Args:
        id: The unique identifier of the source to update.
        source: The updated source data. The 'id' field in the body will be ignored (uses path parameter).
    
    Returns:
        Dictionary with success message and the updated source.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES_LOCAL)
        
        # Find and update the source
        updated_source = None
        for i, existing_source in enumerate(sources):
            if existing_source.get("id") == id:
                # Convert Pydantic model to dict
                source_dict = source.model_dump(exclude_none=True)
                # Override id with path parameter to ensure consistency
                source_dict["id"] = id
                sources[i] = source_dict
                updated_source = source_dict
                break
        
        if updated_source is None:
            raise SourceNotFoundError(id)
        
        write_sources_json(settings.XMLTV_SOURCES_LOCAL, sources)
        
        return {
            "message": "Source updated successfully",
            "source": updated_source
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error updating local source {id}: {e}")
        raise DataProcessingError("update local source", str(e)) from e


@router.delete("/py/sources/local/{id}")
async def delete_local_source(
    id: str,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, str]:
    """
    Delete a local source from local.json.
    
    Args:
        id: The unique identifier of the source to delete.
    
    Returns:
        Dictionary with success message.
    """
    try:
        sources = read_sources_json(settings.XMLTV_SOURCES_LOCAL)
        
        # Find and remove the source
        original_count = len(sources)
        sources = [s for s in sources if s.get("id") != id]
        
        if len(sources) == original_count:
            raise SourceNotFoundError(id)
        
        write_sources_json(settings.XMLTV_SOURCES_LOCAL, sources)
        
        return {
            "message": f"Source '{id}' deleted successfully"
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error deleting local source {id}: {e}")
        raise DataProcessingError("delete local source", str(e)) from e


# ==================== Additional Data Management Endpoints ====================

@router.get("/py/sources/additional-data")
async def get_all_additional_data(
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Get all additional data files.
    
    Discovers all additional data files in the remote directory and returns
    metadata about each file including source_id, file path, size, and last modified date.
    
    **Returns:**
    Dictionary containing:
    - `count`: Number of additional data files found
    - `files`: List of file metadata objects with:
      - `source_id`: Source identifier
      - `file_path`: Full path to the file
      - `filename`: Name of the file
      - `is_xmlepg`: Boolean indicating if using xmlepg_ prefix pattern
      - `file_size`: Size of file in bytes
      - `last_modified`: ISO format timestamp of last modification
    
    **Example Response:**
    ```json
    {
      "count": 2,
      "files": [
        {
          "source_id": "FTACEN",
          "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
          "filename": "xmlepg_FTACEN_additionaldata.json",
          "is_xmlepg": true,
          "file_size": 12345,
          "last_modified": "2024-01-15T08:00:00.000000"
        },
        {
          "source_id": "freeviewuk",
          "file_path": "/path/to/xmltvdata/remote/freeviewuk_additionaldata.json",
          "filename": "freeviewuk_additionaldata.json",
          "is_xmlepg": false,
          "file_size": 67890,
          "last_modified": "2024-01-15T09:00:00.000000"
        }
      ]
    }
    ```
    """
    try:
        files = discover_additional_data_files()
        return {
            "count": len(files),
            "files": files
        }
    except Exception as e:
        logging.error(f"Error retrieving additional data files: {e}")
        raise DataProcessingError("retrieve additional data files", str(e)) from e


@router.get("/py/sources/additional-data/{source_id}")
async def get_additional_data(
    source_id: str,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Get additional data for a specific source.
    
    Retrieves the channel data from an additional data file. The system
    automatically checks both naming patterns:
    - Regular: `{source_id}_additionaldata.json`
    - XMLEPG: `xmlepg_{source_id}_additionaldata.json`
    
    **Args:**
    - `source_id`: The unique identifier of the source.
    
    **Returns:**
    Dictionary containing:
    - `source_id`: Source identifier
    - `file_path`: Path to the file
    - `filename`: Name of the file
    - `is_xmlepg`: Boolean indicating pattern used
    - `channels`: Array of channel objects
    - `channel_count`: Number of channels
    
    **Channel Object Structure:**
    Each channel object contains fields such as:
    - `channel_id` (required): Unique channel identifier
    - `channel_slug`: URL-friendly channel identifier
    - `channel_name`: Display name of the channel
    - `channel_name_location`: Location-specific name
    - `channel_name_real`: Official channel name
    - `chantype`: Channel type/format
    - `chancomp`: Channel company/owner
    - `channel_url`: Channel website URL
    - `chanbouq`: Bouquet information
    - `chanlcnfta1`, `chanlcnfta2`, `chanlcnfta3`: FTA logical channel numbers
    - `chanlcnfox`, `chanlcnfet`: Foxtel/Fetch logical channel numbers
    - `channel_number`: Channel number
    - `chlogo_light`, `chlogo_dark`: Logo URLs for light/dark themes
    - `channel_group`: Channel group/network
    - `channel_type`: Type of channel (e.g., "Free to Air")
    - `chlogo`: Default logo URL
    - `channel_availability`: Availability description
    - `channel_packages`: Package/subscription information
    - `guidelink`: Guide link identifier
    
    **Example Response:**
    ```json
    {
      "source_id": "FTACEN",
      "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
      "filename": "xmlepg_FTACEN_additionaldata.json",
      "is_xmlepg": true,
      "channels": [
        {
          "channel_id": "85459auepg.com.au",
          "channel_slug": "85459auepg-com-au",
          "channel_name": "10 HD",
          "channel_name_location": "10 HD Sydney",
          "channel_name_real": "10 HD",
          "chantype": "HD 1080i MPEG-4",
          "channel_group": "10 Network",
          "channel_type": "Free-to-Air"
        }
      ],
      "channel_count": 1
    }
    ```
    
    **Raises:**
    - `SourceNotFoundError`: If the additional data file doesn't exist
    """
    try:
        file_path = find_additional_data_file(source_id)
        
        if not file_path:
            raise SourceNotFoundError(f"Additional data file for source '{source_id}' not found")
        
        # Determine pattern from filename
        filename = os.path.basename(file_path)
        is_xmlepg = filename.startswith("xmlepg_")
        
        channels = read_additional_data_json(file_path)
        
        return {
            "source_id": source_id,
            "file_path": file_path,
            "filename": filename,
            "is_xmlepg": is_xmlepg,
            "channels": channels,
            "channel_count": len(channels)
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error retrieving additional data for source {source_id}: {e}")
        raise DataProcessingError("retrieve additional data", str(e)) from e


@router.post("/py/sources/additional-data/{source_id}")
async def create_additional_data(
    source_id: str,
    data: AdditionalDataEntry,
    is_xmlepg: bool = Query(False, description="If true, uses xmlepg_ prefix pattern"),
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Create a new additional data file for a source.
    
    Creates an additional data file with the provided channel data. The file
    will be created using the specified naming pattern.
    
    **Args:**
    - `source_id`: The unique identifier of the source.
    - `data`: AdditionalDataEntry object containing array of channels.
    - `is_xmlepg`: Query parameter (default: false). If true, uses `xmlepg_{source_id}_additionaldata.json` pattern.
                   If false, uses `{source_id}_additionaldata.json` pattern.
    
    **Request Body:**
    ```json
    {
      "channels": [
        {
          "channel_id": "85459auepg.com.au",
          "channel_slug": "85459auepg-com-au",
          "channel_name": "10 HD",
          "channel_name_location": "10 HD Sydney",
          "channel_name_real": "10 HD",
          "chantype": "HD 1080i MPEG-4",
          "channel_group": "10 Network",
          "channel_type": "Free-to-Air"
        }
      ]
    }
    ```
    
    **Returns:**
    Dictionary with success message and file information.
    
    **Example Response:**
    ```json
    {
      "message": "Additional data created successfully",
      "source_id": "FTACEN",
      "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
      "filename": "xmlepg_FTACEN_additionaldata.json",
      "is_xmlepg": true,
      "channel_count": 1
    }
    ```
    
    **Raises:**
    - `WebEPGException` (409): If the additional data file already exists
    """
    try:
        file_path = get_additional_data_file_path(source_id, is_xmlepg=is_xmlepg)
        
        # Check if file already exists
        if os.path.exists(file_path):
            raise WebEPGException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Additional data file for source '{source_id}' already exists",
                error_code="ADDITIONAL_DATA_EXISTS",
                error_type="AdditionalDataExistsError"
            )
        
        # Convert Pydantic models to dicts
        channels = [channel.model_dump(exclude_none=True) for channel in data.channels]
        
        write_additional_data_json(file_path, channels)
        
        return {
            "message": "Additional data created successfully",
            "source_id": source_id,
            "file_path": file_path,
            "filename": os.path.basename(file_path),
            "is_xmlepg": is_xmlepg,
            "channel_count": len(channels)
        }
    except WebEPGException:
        raise
    except Exception as e:
        logging.error(f"Error creating additional data for source {source_id}: {e}")
        raise DataProcessingError("create additional data", str(e)) from e


@router.put("/py/sources/additional-data/{source_id}")
async def update_additional_data(
    source_id: str,
    data: AdditionalDataEntry,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, Any]:
    """
    Update an existing additional data file for a source.
    
    Updates the channel data in an existing additional data file. The system
    automatically detects which naming pattern is used by checking both patterns.
    This endpoint only updates existing files - use POST to create new files.
    
    **Args:**
    - `source_id`: The unique identifier of the source.
    - `data`: AdditionalDataEntry object containing array of channels.
    
    **Request Body:**
    Same as POST endpoint - AdditionalDataEntry with channels array.
    
    **Returns:**
    Dictionary with success message and file information.
    
    **Example Response:**
    ```json
    {
      "message": "Additional data updated successfully",
      "source_id": "FTACEN",
      "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
      "filename": "xmlepg_FTACEN_additionaldata.json",
      "is_xmlepg": true,
      "channel_count": 2
    }
    ```
    
    **Raises:**
    - `SourceNotFoundError`: If the additional data file doesn't exist (use POST to create new files)
    """
    try:
        # Find existing file - checks both patterns automatically
        existing_path = find_additional_data_file(source_id)
        if not existing_path:
            raise SourceNotFoundError(
                f"Additional data file for source '{source_id}' not found. Use POST endpoint to create a new file."
            )
        
        # Determine pattern from filename
        filename = os.path.basename(existing_path)
        is_xmlepg = filename.startswith("xmlepg_")
        file_path = existing_path
        
        # Convert Pydantic models to dicts
        channels = [channel.model_dump(exclude_none=True) for channel in data.channels]
        
        write_additional_data_json(file_path, channels)
        
        return {
            "message": "Additional data updated successfully",
            "source_id": source_id,
            "file_path": file_path,
            "filename": filename,
            "is_xmlepg": is_xmlepg,
            "channel_count": len(channels)
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error updating additional data for source {source_id}: {e}")
        raise DataProcessingError("update additional data", str(e)) from e


@router.delete("/py/sources/additional-data/{source_id}")
async def delete_additional_data(
    source_id: str,
    api_key: str = Depends(verify_api_key)
) -> Dict[str, str]:
    """
    Delete an additional data file for a source.
    
    Deletes the additional data file. The system automatically checks both
    naming patterns to find and delete the file.
    
    **Args:**
    - `source_id`: The unique identifier of the source.
    
    **Returns:**
    Dictionary with success message.
    
    **Example Response:**
    ```json
    {
      "message": "Additional data file for source 'FTACEN' deleted successfully",
      "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json"
    }
    ```
    
    **Raises:**
    - `SourceNotFoundError`: If the additional data file doesn't exist
    """
    try:
        file_path = find_additional_data_file(source_id)
        
        if not file_path:
            raise SourceNotFoundError(f"Additional data file for source '{source_id}' not found")
        
        os.remove(file_path)
        logging.info(f"Deleted additional data file: {file_path}")
        
        return {
            "message": f"Additional data file for source '{source_id}' deleted successfully",
            "file_path": file_path
        }
    except SourceNotFoundError:
        raise
    except Exception as e:
        logging.error(f"Error deleting additional data for source {source_id}: {e}")
        raise DataProcessingError("delete additional data", str(e)) from e
