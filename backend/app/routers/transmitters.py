from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.utils.file_operations import load_sources

router = APIRouter()


class Transmitter(BaseModel):
    AreaServed: str
    CallSignChannel: str
    CallSign: str
    Operator: str
    Network: str
    Purpose: str
    Channel: str
    Frequency: float
    Polarity: str
    SiteName: str
    Site: str
    ACMASiteID: int
    Lat: float
    Long: float
    AntennaHeight: int
    MaxERP: str
    LicenceArea: str
    LicenceNo: str
    OnAirDate: str


@router.get("/py/transmitters", response_model=List[Transmitter])
async def get_sources(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
) -> List[Transmitter]:
    """
    API endpoint to fetch and return transmitter sources.

    - Loads source data from a JSON file specified in settings.
    - Optionally filters results based on query parameters.
    """
    try:
        # Load sources from the specified JSON file
        transmitter_sources = load_sources(settings.TRANSMITTER_DATA)

        if not isinstance(transmitter_sources, list):
            raise HTTPException(
                status_code=500, detail="Transmitter data is not a list."
            )

        # Filter sources based on query parameters
        if area_served:
            transmitter_sources = [
                source
                for source in transmitter_sources
                if source.get("AreaServed") == area_served
            ]
        if call_sign:
            transmitter_sources = [
                source
                for source in transmitter_sources
                if source.get("CallSign") == call_sign
            ]
        if network:
            transmitter_sources = [
                source
                for source in transmitter_sources
                if source.get("Network") == network
            ]
        if operator:
            transmitter_sources = [
                source
                for source in transmitter_sources
                if source.get("Operator") == operator
            ]
        if licence_area:
            transmitter_sources = [
                source
                for source in transmitter_sources
                if source.get("LicenceArea") == licence_area
            ]

        # Convert dictionaries to Transmitter models
        transmitters = [Transmitter(**source) for source in transmitter_sources]

        return transmitters
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Transmitter data file not found.")  # noqa: B904
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=f"Data format error: {str(ve)}")  # noqa: B904
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An  error occurred: {str(e)}")  # noqa: B904
