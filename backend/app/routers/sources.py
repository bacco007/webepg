import asyncio
import json
import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp
from fastapi import APIRouter, BackgroundTasks, Depends, Header, status
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
