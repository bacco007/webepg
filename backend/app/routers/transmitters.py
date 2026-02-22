from typing import List, Optional, Type, TypeVar, Union, cast

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.config import settings
from app.exceptions import ConfigurationError, DataProcessingError, TransmitterDataError
from app.utils.file_operations import load_sources

router = APIRouter()


# Nested format models (raw format)
class TVLicence(BaseModel):
    CallsignChannel: str
    Callsign: str
    Operator: str
    Network: str
    Frequency: float
    Purpose: str
    Polarisation: str
    AntennaHeight: int
    MaxERP: str
    LicenceNo: Union[float, str]  # Can be number or "N/A"
    Channel: str
    LicenceArea: str

    class Config:
        extra = "allow"


class TVSite(BaseModel):
    ACMASiteID: int
    SiteName: str
    AreaServed: str
    Lat: float
    Long: float
    State: str
    ServiceCnt: int
    licences: List[TVLicence]

    class Config:
        extra = "allow"


# Radio nested format models (raw format)
class AMLicence(BaseModel):
    Callsign: str
    Operator: str
    Network: str
    Frequency: Union[str, float]  # Can be string or number
    Purpose: str
    Polarisation: str
    AntennaHeight: Union[str, int]  # Can be string or number
    MaxERP: str
    LicenceNo: Union[str, int]  # Can be string or number
    DayNight: Optional[str] = None
    LicenceArea: str

    class Config:
        extra = "allow"


class FMLicence(BaseModel):
    Callsign: str
    Operator: str
    Network: str
    Frequency: Union[str, float]  # Can be string or number
    Purpose: str
    Polarisation: str
    AntennaHeight: Union[str, int]  # Can be string or number
    MaxERP: str
    LicenceNo: Union[str, int]  # Can be string or number
    LicenceArea: str

    class Config:
        extra = "allow"


class DRLicence(BaseModel):
    Callsign: str
    Operator: str
    Network: str
    Frequency: Union[str, float]  # Can be string or number
    Purpose: str
    Polarisation: str
    AntennaHeight: Union[str, int]  # Can be string or number
    MaxERP: str
    FreqBlock: str
    LicenceNo: Union[str, int]  # Can be string or number
    LicenceArea: str

    class Config:
        extra = "allow"


class RadioSite(BaseModel):
    ACMASiteID: int
    SiteName: str
    AreaServed: str
    Lat: Union[str, float]  # Can be string or number
    Long: Union[str, float]  # Can be string or number
    State: str
    FMServiceCnt: Union[str, int]  # Can be string or number
    AMServiceCnt: Union[str, int]  # Can be string or number
    DRServiceCnt: Union[str, int]  # Can be string or number
    am: List[AMLicence]
    fm: List[FMLicence]
    dr: List[DRLicence]

    class Config:
        extra = "allow"


# Legacy flat format models (for backward compatibility)
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


@router.get("/py/transmitters/tv", response_model=List[TVSite])
async def get_tv_transmitters(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
) -> List[TVSite]:
    """Get TV transmitter data with optional filtering in raw nested format."""
    return await _get_transmitters_nested(
        settings.TV_TRANSMITTER_DATA,
        TVSite,
        area_served,
        call_sign,
        network,
        operator,
        licence_area,
    )


@router.get("/py/transmitters/radio", response_model=List[RadioSite])
async def get_radio_transmitters(
    area_served: Optional[str] = Query(None, description="Filter by AreaServed"),
    call_sign: Optional[str] = Query(None, description="Filter by CallSign"),
    network: Optional[str] = Query(None, description="Filter by Network"),
    operator: Optional[str] = Query(None, description="Filter by Operator"),
    licence_area: Optional[str] = Query(None, description="Filter by LicenceArea"),
    service_type: Optional[str] = Query(None, description="Filter by service type: 'am', 'fm', or 'dr'"),
) -> List[RadioSite]:
    """Get radio transmitter data with optional filtering in raw nested format."""
    return await _get_radio_transmitters_nested(
        settings.RADIO_TRANSMITTER_DATA,
        RadioSite,
        area_served,
        call_sign,
        network,
        operator,
        licence_area,
        service_type,
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


def _filter_transmitters_nested(
    sites: List[dict],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
) -> List[dict]:
    """Apply filters to nested transmitter sites (filter by licence properties)."""
    filtered_sites = []
    
    for site in sites:
        # Filter licences within the site based on criteria
        licences = site.get("licences", [])
        filtered_licences = licences.copy()
        
        if call_sign:
            filtered_licences = [licence for licence in filtered_licences if licence.get("Callsign") == call_sign]
        if network:
            filtered_licences = [licence for licence in filtered_licences if licence.get("Network") == network]
        if operator:
            filtered_licences = [licence for licence in filtered_licences if licence.get("Operator") == operator]
        if licence_area:
            filtered_licences = [licence for licence in filtered_licences if licence.get("LicenceArea") == licence_area]
        
        # Filter by area_served at site level
        if area_served and site.get("AreaServed") != area_served:
            continue
        
        # Only include site if it has matching licences after filtering
        if filtered_licences:
            filtered_site = site.copy()
            filtered_site["licences"] = filtered_licences
            filtered_site["ServiceCnt"] = len(filtered_licences)
            filtered_sites.append(filtered_site)
    
    return filtered_sites


def _filter_radio_transmitters_nested(
    sites: List[dict],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
    service_type: Optional[str] = None,
) -> List[dict]:
    """Apply filters to nested radio transmitter sites (filter across am, fm, dr arrays)."""
    filtered_sites = []
    
    for site in sites:
        # Filter by area_served at site level
        if area_served and site.get("AreaServed") != area_served:
            continue
        
        # Filter each service type array
        filtered_am = site.get("am", []).copy()
        filtered_fm = site.get("fm", []).copy()
        filtered_dr = site.get("dr", []).copy()
        
        # Apply service type filter if specified
        service_types_to_check = []
        if service_type:
            service_type_lower = service_type.lower()
            if service_type_lower == "am":
                service_types_to_check = ["am"]
            elif service_type_lower == "fm":
                service_types_to_check = ["fm"]
            elif service_type_lower == "dr":
                service_types_to_check = ["dr"]
        else:
            service_types_to_check = ["am", "fm", "dr"]
        
        # Filter each service type array based on criteria
        for service_type_key in service_types_to_check:
            if service_type_key == "am":
                licences = filtered_am
            elif service_type_key == "fm":
                licences = filtered_fm
            else:  # dr
                licences = filtered_dr
            
            if call_sign:
                licences = [licence for licence in licences if licence.get("Callsign") == call_sign]
            if network:
                licences = [licence for licence in licences if licence.get("Network") == network]
            if operator:
                licences = [licence for licence in licences if licence.get("Operator") == operator]
            if licence_area:
                licences = [licence for licence in licences if licence.get("LicenceArea") == licence_area]
            
            if service_type_key == "am":
                filtered_am = licences
            elif service_type_key == "fm":
                filtered_fm = licences
            else:  # dr
                filtered_dr = licences
        
        # Only include site if it has matching services after filtering
        if filtered_am or filtered_fm or filtered_dr:
            filtered_site = site.copy()
            filtered_site["am"] = filtered_am
            filtered_site["fm"] = filtered_fm
            filtered_site["dr"] = filtered_dr
            filtered_site["AMServiceCnt"] = str(len(filtered_am))
            filtered_site["FMServiceCnt"] = str(len(filtered_fm))
            filtered_site["DRServiceCnt"] = str(len(filtered_dr))
            filtered_sites.append(filtered_site)
    
    return filtered_sites


def _filter_transmitters(
    sources: List[dict],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
) -> List[dict]:
    """Apply filters to flat transmitter sources (legacy format)."""
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


def _normalize_licence_no_in_site(site: dict) -> None:
    """Normalize LicenceNo fields in nested site structure."""
    for licence in site.get("licences", []):
        licence_no = licence.get("LicenceNo")
        if isinstance(licence_no, float) and licence_no == int(licence_no):
            licence["LicenceNo"] = int(licence_no)
        # Keep "N/A" as string, keep other values as-is


def _normalize_radio_site(site: dict) -> None:
    """Normalize fields in radio site structure."""
    # Normalize LicenceNo in all service type arrays
    for licence in site.get("am", []):
        licence_no = licence.get("LicenceNo")
        if isinstance(licence_no, (int, float)) and licence_no == int(licence_no):
            licence["LicenceNo"] = int(licence_no)
    
    for licence in site.get("fm", []):
        licence_no = licence.get("LicenceNo")
        if isinstance(licence_no, (int, float)) and licence_no == int(licence_no):
            licence["LicenceNo"] = int(licence_no)
    
    for licence in site.get("dr", []):
        licence_no = licence.get("LicenceNo")
        if isinstance(licence_no, (int, float)) and licence_no == int(licence_no):
            licence["LicenceNo"] = int(licence_no)


def _normalize_licence_no(source: dict) -> None:
    """Normalize LicenceNo field to string format (for flat format)."""
    licence_no = source.get("LicenceNo")
    if isinstance(licence_no, (int, float)):
        source["LicenceNo"] = str(int(licence_no)) if licence_no == int(licence_no) else str(licence_no)
    elif licence_no == "N/A":
        source["LicenceNo"] = "N/A"
    elif licence_no is None:
        source["LicenceNo"] = ""
    
    # Handle Long/Lon field (for backward compatibility)
    if "Lon" in source:
        source["Long"] = source.pop("Lon")


async def _get_transmitters_nested(
    data_path: str,
    model_class: Type[TVSite],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
) -> List[TVSite]:
    """
    Fetch and filter transmitter data in nested format (raw format retained).

    Args:
        data_path: Path to the transmitter data file
        model_class: The Pydantic model class to use for validation (TVSite)
        area_served: Optional filter for AreaServed
        call_sign: Optional filter for CallSign
        network: Optional filter for Network
        operator: Optional filter for Operator
        licence_area: Optional filter for LicenceArea

    Returns:
        List of validated transmitter site objects with nested licences
    """
    try:
        transmitter_sources = load_sources(data_path)

        if not isinstance(transmitter_sources, list):
            raise TransmitterDataError("Transmitter data is not a list.")

        # Check if data is in nested format
        if not transmitter_sources or not isinstance(transmitter_sources[0], dict):
            raise TransmitterDataError("Transmitter data format is invalid.")
        
        if "licences" not in transmitter_sources[0]:
            raise TransmitterDataError("Transmitter data is not in nested format.")

        # Apply filters to nested structure
        transmitter_sources = _filter_transmitters_nested(
            transmitter_sources,
            area_served,
            call_sign,
            network,
            operator,
            licence_area,
        )

        # Normalize fields in each site
        for site in transmitter_sources:
            _normalize_licence_no_in_site(site)

        # Convert to model instances
        return [model_class(**site) for site in transmitter_sources]

    except FileNotFoundError as err:
        raise ConfigurationError("Transmitter data file not found") from err
    except ValueError as err:
        raise DataProcessingError("transmitter data validation", str(err)) from err
    except Exception as err:
        raise DataProcessingError("loading transmitter data", str(err)) from err


async def _get_radio_transmitters_nested(
    data_path: str,
    model_class: Type[RadioSite],
    area_served: Optional[str] = None,
    call_sign: Optional[str] = None,
    network: Optional[str] = None,
    operator: Optional[str] = None,
    licence_area: Optional[str] = None,
    service_type: Optional[str] = None,
) -> List[RadioSite]:
    """
    Fetch and filter radio transmitter data in nested format (raw format retained).

    Args:
        data_path: Path to the transmitter data file
        model_class: The Pydantic model class to use for validation (RadioSite)
        area_served: Optional filter for AreaServed
        call_sign: Optional filter for CallSign
        network: Optional filter for Network
        operator: Optional filter for Operator
        licence_area: Optional filter for LicenceArea
        service_type: Optional filter for service type ('am', 'fm', or 'dr')

    Returns:
        List of validated radio transmitter site objects with nested am, fm, dr arrays
    """
    try:
        transmitter_sources = load_sources(data_path)

        if not isinstance(transmitter_sources, list):
            raise TransmitterDataError("Transmitter data is not a list.")

        # Check if data is in nested format
        if not transmitter_sources or not isinstance(transmitter_sources[0], dict):
            raise TransmitterDataError("Transmitter data format is invalid.")
        
        if "am" not in transmitter_sources[0] and "fm" not in transmitter_sources[0] and "dr" not in transmitter_sources[0]:
            raise TransmitterDataError("Transmitter data is not in radio nested format.")

        # Apply filters to nested structure
        transmitter_sources = _filter_radio_transmitters_nested(
            transmitter_sources,
            area_served,
            call_sign,
            network,
            operator,
            licence_area,
            service_type,
        )

        # Normalize fields in each site
        for site in transmitter_sources:
            _normalize_radio_site(site)

        # Convert to model instances
        return [model_class(**site) for site in transmitter_sources]

    except FileNotFoundError as err:
        raise ConfigurationError("Transmitter data file not found") from err
    except ValueError as err:
        raise DataProcessingError("transmitter data validation", str(err)) from err
    except Exception as err:
        raise DataProcessingError("loading transmitter data", str(err)) from err


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
    Generic function to fetch and filter transmitter data (legacy flat format).

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
            raise TransmitterDataError("Transmitter data is not a list.")

        # Apply filters
        transmitter_sources = _filter_transmitters(
            transmitter_sources,
            area_served,
            call_sign,
            network,
            operator,
            licence_area,
        )

        # Normalize fields in each source
        for source in transmitter_sources:
            _normalize_licence_no(source)

        # Convert to model instances and cast to the correct type
        return cast(List[T], [model_class(**source) for source in transmitter_sources])

    except FileNotFoundError as err:
        raise ConfigurationError("Transmitter data file not found") from err
    except ValueError as err:
        raise DataProcessingError("transmitter data validation", str(err)) from err
    except Exception as err:
        raise DataProcessingError("loading transmitter data", str(err)) from err
