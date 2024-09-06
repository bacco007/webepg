from fastapi import APIRouter, HTTPException
from app.config import settings
from app.utils.file_operations import load_json
from datetime import datetime

router = APIRouter()

@router.get("/py/channels/{id}")
async def get_channel_data(id: str):
    filename = f"{id}_channels.json"
    try:
        channels_data = load_json(filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File {filename} not found.")

    return {
        "date_pulled": datetime.utcnow().isoformat(),
        "query": "channels",
        "source": id,
        "data": {"channels": channels_data}
    }
