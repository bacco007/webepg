from typing import List, Optional, Type, TypeVar, cast

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.utils.file_operations import load_sources

router = APIRouter()


class BaseTransmitter(BaseModel):
    AreaServed: str
    CallSign: str = ""
    SiteName: str
    Site: str
    Lat: float
    Long: Optional[float] = None  # Make Long optional
    Lon: Optional[float] = None  # Add Lon as optional
    AntennaHeight: int
    LicenceArea: str = ""
    LicenceNo: str  # Changed from int to str to handle formats like '10099939/1'
    Purpose: str

    class Config:
        extra = "allow"  # Allow extra fields in the data

    def get_longitude(self) -> float:
        """Return either Long or Lon value."""
        if self.Long is not None:
            return self.Long
        if self.Lon is not None:
            return self.Lon
        raise ValueError("Neither Long nor Lon is set")


class TVTransmitter(BaseTransmitter):
    CallSignChannel: str
    Channel: str
    Frequency: float
    Polarity: str


class RadioTransmitter(BaseTransmitter):
    Frequency: float
    ServiceType: str


class AMTransmitter(BaseTransmitter):
    Frequency: float
    Purpose: str
    Polarity: str
    TransmitPower: str
    HoursOfOperaton: str = ""

    class Config:
        extra = "allow"  # Allow extra fields in the data


class FMTransmitter(BaseTransmitter):
    Frequency: float
    Purpose: str
    Polarity: str
    MaxERP: str

    class Config:
        extra = "allow"  # Allow extra fields in the data


class DABTransmitter(BaseTransmitter):
    Frequency: float
    Purpose: str
    Polarity: str
    MaxERP: str
    FreqBlock: str
    BSL: str = ""

    class Config:
        extra = "allow"  # Allow extra fields in the data


T = TypeVar("T", TVTransmitter, AMTransmitter, FMTransmitter, DABTransmitter)


@router.get("/py/transmitters/tv", response_model=List[TVTransmitter])
async def get_tv_transmitters(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
) -> List[TVTransmitter]:
    """Get TV transmitter data with optional filtering."""
    return await _get_transmitters(
        settings.TV_TRANSMITTER_DATA,
        TVTransmitter,
        area_served,
        call_sign,
        network,
        operator,
        licence_area,
    )


@router.get("/py/transmitters/am", response_model=List[AMTransmitter])
async def get_am_transmitters(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
) -> List[AMTransmitter]:
    """Get AM radio transmitter data with optional filtering."""
    return await _get_transmitters(
        settings.RADIO_AM_TRANSMITTER_DATA,
        AMTransmitter,
        area_served,
        call_sign,
        network,
        operator,
        licence_area,
    )


@router.get("/py/transmitters/fm", response_model=List[FMTransmitter])
async def get_fm_transmitters(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
) -> List[FMTransmitter]:
    """Get FM radio transmitter data with optional filtering."""
    return await _get_transmitters(
        settings.RADIO_FM_TRANSMITTER_DATA,
        FMTransmitter,
        area_served,
        call_sign,
        network,
        operator,
        licence_area,
    )


@router.get("/py/transmitters/dab", response_model=List[DABTransmitter])
async def get_dab_transmitters(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
) -> List[DABTransmitter]:
    """Get DAB radio transmitter data with optional filtering."""
    return await _get_transmitters(
        settings.RADIO_DAB_TRANSMITTER_DATA,
        DABTransmitter,
        area_served,
        call_sign,
        network,
        operator,
        licence_area,
    )


def _filter_transmitters(
    sources: List[dict],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
) -> List[dict]:
    """Apply filters to transmitter sources."""
    if area_served:
        sources = [s for s in sources if s.get("AreaServed") == area_served]
    if call_sign:
        sources = [s for s in sources if s.get("CallSign") == call_sign]
    if network:
        sources = [s for s in sources if s.get("Network") == network]
    if operator:
        sources = [s for s in sources if s.get("Operator") == operator]
    if licence_area:
        sources = [s for s in sources if s.get("LicenceArea") == licence_area]
    return sources


async def _get_transmitters(
    data_path: str,
    model_class: Type[T],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
) -> List[T]:
    """
    Generic function to fetch and filter transmitter data.

    Args:
        data_path: Path to the transmitter data file
        model_class: The Pydantic model class to use for validation
        area_served: Optional filter for AreaServed
        call_sign: Optional filter for CallSign
        network: Optional filter for Network
        operator: Optional filter for Operator
        licence_area: Optional filter for LicenceArea

    Returns:
        List of validated transmitter objects
    """
    try:
        transmitter_sources = load_sources(data_path)

        if not isinstance(transmitter_sources, list):
            raise HTTPException(
                status_code=500, detail="Transmitter data is not a list."
            )

        # Apply filters
        transmitter_sources = _filter_transmitters(
            transmitter_sources,
            area_served,
            call_sign,
            network,
            operator,
            licence_area,
        )

        # Convert LicenceNo to string if it's an integer
        for source in transmitter_sources:
            if isinstance(source.get("LicenceNo"), int):
                source["LicenceNo"] = str(source["LicenceNo"])

            # Handle Long/Lon field
            if "Lon" in source:
                source["Long"] = source.pop("Lon")

        # Convert to model instances and cast to the correct type
        return cast(List[T], [model_class(**source) for source in transmitter_sources])

    except FileNotFoundError as err:
        raise HTTPException(
            status_code=404, detail="Transmitter data file not found."
        ) from err
    except ValueError as err:
        raise HTTPException(
            status_code=500, detail=f"Data format error: {str(err)}"
        ) from err
    except Exception as err:
        raise HTTPException(
            status_code=500, detail=f"An error occurred: {str(err)}"
        ) from err
