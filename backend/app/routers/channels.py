from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Path
from pydantic import BaseModel

from app.exceptions import ChannelNotFoundError, FileProcessingError
from app.utils.file_operations import load_json

router = APIRouter()


def deduplicate_channels(channels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate channels based on channel_id (or channel_slug) and channel_number.
    Keeps the first occurrence of each unique channel.
    
    This ensures channels with the same slug but different channel numbers
    are treated as unique channels.
    """
    seen_channels = set()
    unique_channels = []
    
    for channel in channels:
        # Use channel_id as primary identifier, fall back to channel_slug if channel_id is missing
        channel_id = channel.get("channel_id", "")
        channel_slug = channel.get("channel_slug", "")
        channel_number = channel.get("channel_number", "")
        
        # Create a composite unique key that includes both identifier and channel number
        identifier = channel_id if channel_id else channel_slug
        channel_key = f"{identifier}_{channel_number}" if identifier else None
        
        if channel_key and channel_key not in seen_channels:
            seen_channels.add(channel_key)
            unique_channels.append(channel)
        elif not channel_key:
            # If both identifier and channel_number are missing, use the channel dict itself as a fallback
            # This is a rare edge case
            unique_channels.append(channel)
    
    return unique_channels

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

    # Ensure channels_data is a list
    if not isinstance(channels_data, list):
        channels_data = []

    # Deduplicate channels before returning
    unique_channels = deduplicate_channels(channels_data)

    return {
        "date_pulled": datetime.now(timezone.utc).isoformat(),
        "query": "channels",
        "source": id,
        "data": {"channels": unique_channels},
    }
