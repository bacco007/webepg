from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel

from app.utils.file_operations import load_json

router = APIRouter()

class ChannelResponse(BaseModel):
    date_pulled: str
    query: str
    source: str
    data: Dict[str, Any]


@router.get("/py/channels/{id}", response_model=ChannelResponse)
async def get_channel_data(
    id: str = Path(..., min_length=1, description="Channel identifier"),
) -> Dict[str, Any]:
    """
    Retrieve channel data for a specific channel ID.

    Args:
        id (str): The channel identifier

    Returns:
        Dict[str, Any]: Channel data including metadata

    Raises:
        HTTPException: If the channel data file is not found or cannot be parsed
    """
    filename = f"{id}_channels.json"
    try:
        channels_data = load_json(filename)
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=404, detail=f"Channel data for ID '{id}' not found."
        ) from err
    except Exception as err:
        raise HTTPException(
            status_code=500, detail=f"Error processing channel data: {str(err)}"
        ) from err

    return {
        "date_pulled": datetime.utcnow().isoformat(),
        "query": "channels",
        "source": id,
        "data": {"channels": channels_data},
    }
