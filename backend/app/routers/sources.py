import asyncio
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.utils.file_operations import download_file, load_sources
from app.utils.xml_processing import process_xml_file

router = APIRouter()

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

@router.get("/py/sources")
async def get_sources() -> List[Dict[str, Any]]:
    # Load sources from both files
    main_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)
    local_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES_LOCAL)

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


@router.get("/py/sources/status")
async def get_sources_status() -> Dict[str, SourceStatus]:
    try:
        main_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)
        local_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES_LOCAL)
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=404, detail="XMLTV sources file not found"
        ) from err

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

    main_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES)
    local_sources: List[Dict[str, Any]] = load_sources(settings.XMLTV_SOURCES_LOCAL)

    merged_sources: Dict[str, Dict[str, Any]] = {}
    for source in main_sources + local_sources:
        if "id" in source:
            merged_sources[source["id"]] = source

    if source_id not in merged_sources:
        raise HTTPException(
            status_code=404, detail=f"Source with ID {source_id} not found"
        )

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
