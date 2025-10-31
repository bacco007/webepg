from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Path
from pydantic import BaseModel

from app.exceptions import ChannelNotFoundError, FileProcessingError
from app.utils.file_operations import load_json

router = APIRouter()

class ChannelResponse(BaseModel):
    date_pulled: str
    query: str
    source: str
    data: Dict[str, Any]


@router.get(
    "/py/channels/{id}",
    response_model=ChannelResponse,
    summary="Get Channel Data",
    description="Retrieve channel information and metadata for a specific source.",
    response_description="Channel data including metadata and channel listings",
    responses={
        200: {
            "description": "Channel data retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "date_pulled": "2024-01-15T10:30:00.000000",
                        "query": "channels",
                        "source": "source1",
                        "data": {
                            "channels": [
                                {
                                    "channel_id": "channel1",
                                    "channel_slug": "channel-1",
                                    "channel_name": "Channel One",
                                    "channel_number": "10",
                                    "channel_url": "https://example.com",
                                    "chlogo": "/logos/channel1.png"
                                }
                            ]
                        }
                    }
                }
            }
        },
        404: {"description": "Channel data for the specified ID not found"},
        500: {"description": "Error processing channel data"}
    }
)
async def get_channel_data(
    id: str = Path(
        ...,
        min_length=1,
        description="Source identifier (e.g., 'source1', 'xmltvnet')",
        example="xmltvnet"
    ),
) -> Dict[str, Any]:
    """
    Retrieve channel data for a specific source ID.
    
    Returns a list of all channels available for the specified source, including:
    - Channel metadata (ID, name, slug, number)
    - Channel logos and URLs
    - Channel grouping information
    
    **Parameters:**
    - **id**: Source identifier matching a processed XMLTV source
    
    **Example Request:**
    ```
    GET /api/py/channels/xmltvnet
    ```
    
    **Example Response:**
    ```json
    {
        "date_pulled": "2024-01-15T10:30:00.000000",
        "query": "channels",
        "source": "xmltvnet",
        "data": {
            "channels": []
        }
    }
    ```
    """
    filename = f"{id}_channels.json"
    try:
        channels_data = load_json(filename)
    except FileNotFoundError as err:
        raise ChannelNotFoundError(id) from err
    except Exception as err:
        raise FileProcessingError(filename, str(err)) from err

    return {
        "date_pulled": datetime.now(timezone.utc).isoformat(),
        "query": "channels",
        "source": id,
        "data": {"channels": channels_data},
    }
