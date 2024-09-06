from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.utils.file_operations import load_json

router = APIRouter()

@router.get("/py/channels/{id}")
async def get_channel_data(id: str) -> Dict[str, Any]:
    filename = f"{id}_channels.json"
    try:
        channels_data = load_json(filename)
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=404, detail=f"File {filename} not found."
        ) from err

    return {
        "date_pulled": datetime.utcnow().isoformat(),
        "query": "channels",
        "source": id,
        "data": {"channels": channels_data},
    }
