'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Locate,
  Maximize,
  Search,
  X,
} from 'lucide-react';

import '@drustack/leaflet.resetview';
import { TransmitterPopup } from '@/components/TransmitterPopup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from '@/hooks/use-toast';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface Transmitter {
  AreaServed: string;
  CallSignChannel: string;
  CallSign: string;
  Operator: string;
  Network: string;
  Purpose: string;
  Channel: string;
  Frequency: number;
  Polarity: string;
  SiteName: string;
  Site: string;
  ACMASiteID: number;
  Lat: number;
  Long: number;
  AntennaHeight: number;
  MaxERP: string;
  LicenceArea: string;
  LicenceNo: string;
  OnAirDate: string;
}

interface GeoJsonData {
  type: string;
  features: Array<{
    type: string;
    properties: {
      name: string;
      [key: string]: any;
    };
    geometry: {
      type: string;
      coordinates: number[][][];
    };
  }>;
}

function ResetViewControl({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  const handleResetView = () => {
    map.fitBounds(bounds);
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: '60px' }}>
      <div className="leaflet-bar leaflet-control">
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetView}
          title="Reset view"
        >
          <Maximize className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const TVLicenceAreasLayer = React.lazy(
  () => import('@/components/TVLicenceAreasLayer'),
);

function LayerControl({
  showLayer,
  setShowLayer,
}: {
  showLayer: boolean;
  setShowLayer: (show: boolean) => void;
}) {
  return (
    <div
      className="leaflet-bottom leaflet-left"
      style={{ marginBottom: '20px' }}
    >
      <div className="leaflet-bar leaflet-control">
        <Button
          variant={showLayer ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowLayer(!showLayer)}
          title="Toggle TV Licence Areas"
        >
          <Layers className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function GeolocationControl() {
  const map = useMap();

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 13);
          toast({
            title: 'Location found',
            description: 'Map centered on your current location.',
          });
        },
        error => {
          console.error('Geolocation error:', error);
          toast({
            title: 'Geolocation error',
            description: 'Unable to retrieve your location.',
            variant: 'destructive',
          });
        },
      );
    } else {
      toast({
        title: 'Geolocation not supported',
        description: "Your browser doesn't support geolocation.",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-bar leaflet-control">
        <Button
          variant="outline"
          size="icon"
          onClick={handleGeolocation}
          title="Find my location"
        >
          <Locate className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  options,
  filters,
  onFilterChange,
  searchValue,
  onSearchChange,
}: {
  title: string;
  options: string[];
  filters: string[];
  onFilterChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [options, debouncedSearch]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {filters.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {filters.length}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title}...`}
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            className="mb-2 pl-8"
          />
        </div>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {filteredOptions.map(option => (
              <label key={option} className="flex cursor-pointer items-center">
                <Checkbox
                  checked={filters.includes(option)}
                  onCheckedChange={() => onFilterChange(option)}
                  className="mr-2"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function TransmitterMap() {
  const [transmittersData, setTransmittersData] = useState<Transmitter[]>([]);
  const [callSignFilters, setCallSignFilters] = useState<string[]>([]);
  const [areaServedFilters, setAreaServedFilters] = useState<string[]>([]);
  const [licenceAreaFilters, setLicenceAreaFilters] = useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [networkFilters, setNetworkFilters] = useState<string[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [callSignSearch, setCallSignSearch] = useState('');
  const [areaServedSearch, setAreaServedSearch] = useState('');
  const [licenceAreaSearch, setLicenceAreaSearch] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [networkSearch, setNetworkSearch] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    callSign: false,
    areaServed: false,
    licenceArea: false,
    operator: false,
    network: false,
  });
  const [showTVLicenceAreas, setShowTVLicenceAreas] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const debouncedGlobalSearch = useDebounce(globalSearchTerm, 300);
  const debouncedCallSignSearch = useDebounce(callSignSearch, 300);
  const debouncedAreaServedSearch = useDebounce(areaServedSearch, 300);
  const debouncedLicenceAreaSearch = useDebounce(licenceAreaSearch, 300);
  const debouncedOperatorSearch = useDebounce(operatorSearch, 300);
  const debouncedNetworkSearch = useDebounce(networkSearch, 300);

  const {
    transmittersData: fetchedTransmittersData,
    geoJsonData: fetchedGeoJsonData,
    isLoading,
    error,
  } = useTransmitterData();
  useEffect(() => {
    if (!isLoading) {
      setTransmittersData(fetchedTransmittersData);
      setGeoJsonData(fetchedGeoJsonData);
      setLocalIsLoading(false);
    }
    if (error) {
      setLocalError(error);
    }
  }, [fetchedTransmittersData, fetchedGeoJsonData, isLoading, error]);

  const filterTransmitters = useCallback(
    (transmitters: Transmitter[]) => {
      return transmitters.filter(
        transmitter =>
          (callSignFilters.length === 0 ||
            callSignFilters.includes(transmitter.CallSign)) &&
          (areaServedFilters.length === 0 ||
            areaServedFilters.includes(transmitter.AreaServed)) &&
          (licenceAreaFilters.length === 0 ||
            licenceAreaFilters.includes(transmitter.LicenceArea)) &&
          (operatorFilters.length === 0 ||
            operatorFilters.includes(transmitter.Operator)) &&
          (networkFilters.length === 0 ||
            networkFilters.includes(transmitter.Network)) &&
          (debouncedGlobalSearch === '' ||
            transmitter.CallSign.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase(),
            ) ||
            transmitter.AreaServed.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase(),
            ) ||
            transmitter.LicenceArea.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase(),
            ) ||
            transmitter.Operator.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase(),
            ) ||
            transmitter.Network.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase(),
            )),
      );
    },
    [
      callSignFilters,
      areaServedFilters,
      licenceAreaFilters,
      operatorFilters,
      networkFilters,
      debouncedGlobalSearch,
    ],
  );

  const filteredTransmitters = useMemo(
    () => filterTransmitters(transmittersData),
    [transmittersData, filterTransmitters],
  );

  const uniqueCallSigns = useMemo(
    () => [...new Set(transmittersData.map(t => t.CallSign))].sort(),
    [transmittersData],
  );

  const uniqueAreaServed = useMemo(
    () => [...new Set(transmittersData.map(t => t.AreaServed))].sort(),
    [transmittersData],
  );

  const uniqueLicenceAreas = useMemo(
    () => [...new Set(transmittersData.map(t => t.LicenceArea))].sort(),
    [transmittersData],
  );

  const uniqueOperators = useMemo(
    () => [...new Set(transmittersData.map(t => t.Operator))].sort(),
    [transmittersData],
  );

  const uniqueNetworks = useMemo(
    () => [...new Set(transmittersData.map(t => t.Network))].sort(),
    [transmittersData],
  );

  const bounds = useMemo(() => {
    if (filteredTransmitters.length === 0) return null;
    return L.latLngBounds(filteredTransmitters.map(t => [t.Lat, t.Long]));
  }, [filteredTransmitters]);

  const center: [number, number] = [-25.2744, 133.7751];
  const zoom = 4;

  const handleFilterChange = (
    filterType:
      | 'callSign'
      | 'areaServed'
      | 'licenceArea'
      | 'operator'
      | 'network',
    value: string,
  ) => {
    switch (filterType) {
      case 'callSign': {
        setCallSignFilters(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
      case 'areaServed': {
        setAreaServedFilters(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
      case 'licenceArea': {
        setLicenceAreaFilters(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
      case 'operator': {
        setOperatorFilters(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
      case 'network': {
        setNetworkFilters(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
    }
  };

  const clearAllFilters = () => {
    setCallSignFilters([]);
    setAreaServedFilters([]);
    setLicenceAreaFilters([]);
    setOperatorFilters([]);
    setNetworkFilters([]);
    setGlobalSearchTerm('');
    setCallSignSearch('');
    setAreaServedSearch('');
    setLicenceAreaSearch('');
    setOperatorSearch('');
    setNetworkSearch('');
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(previous => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const filterOptions = (options: string[], searchTerm: string) => {
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  if (localIsLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading transmitter data...
      </div>
    );
  }

  if (localError || error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error: {localError || error}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-64 shrink-0 border-r bg-background">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            <div className="sticky top-0 z-10 bg-background pb-4 pt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Global Search..."
                  value={globalSearchTerm}
                  onChange={e => setGlobalSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-2 w-full"
              >
                Clear All Filters
              </Button>
            </div>
            <div className="space-y-2">
              <FilterSection
                title="Call Signs"
                options={uniqueCallSigns}
                filters={callSignFilters}
                onFilterChange={value => handleFilterChange('callSign', value)}
                searchValue={callSignSearch}
                onSearchChange={setCallSignSearch}
              />
              <FilterSection
                title="Areas Served"
                options={uniqueAreaServed}
                filters={areaServedFilters}
                onFilterChange={value =>
                  handleFilterChange('areaServed', value)
                }
                searchValue={areaServedSearch}
                onSearchChange={setAreaServedSearch}
              />
              <FilterSection
                title="Licence Areas"
                options={uniqueLicenceAreas}
                filters={licenceAreaFilters}
                onFilterChange={value =>
                  handleFilterChange('licenceArea', value)
                }
                searchValue={licenceAreaSearch}
                onSearchChange={setLicenceAreaSearch}
              />
              <FilterSection
                title="Operators"
                options={uniqueOperators}
                filters={operatorFilters}
                onFilterChange={value => handleFilterChange('operator', value)}
                searchValue={operatorSearch}
                onSearchChange={setOperatorSearch}
              />
              <FilterSection
                title="Networks"
                options={uniqueNetworks}
                filters={networkFilters}
                onFilterChange={value => handleFilterChange('network', value)}
                searchValue={networkSearch}
                onSearchChange={setNetworkSearch}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
      <div className="h-full flex-1">
        <MapContainer
          center={center}
          zoom={zoom}
          className="size-full"
          ref={mapRef}
          whenReady={() => {
            if (mapRef.current) {
              const map = mapRef.current;
              // Use a more efficient method for adding markers
              const markerLayer = L.layerGroup().addTo(map);
              filteredTransmitters.forEach(transmitter => {
                const marker = L.marker([transmitter.Lat, transmitter.Long]);
                marker.bindPopup(() => {
                  const popupContent = document.createElement('div');
                  const root = createRoot(popupContent);
                  root.render(<TransmitterPopup transmitter={transmitter} />);
                  return popupContent;
                });
                markerLayer.addLayer(marker);
              });
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          <React.Suspense fallback={<div>Loading TV Licence Areas...</div>}>
            {showTVLicenceAreas && geoJsonData && (
              <TVLicenceAreasLayer
                geoJsonData={geoJsonData}
                onSelectArea={setSelectedArea}
              />
            )}
          </React.Suspense>
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={(cluster: { getChildCount: () => any }) => {
              return L.divIcon({
                html: `<div class="cluster-icon">${cluster.getChildCount()}</div>`,
                className: 'custom-marker-cluster',
                iconSize: L.point(40, 40, true),
              });
            }}
          >
            {filteredTransmitters.map(transmitter => (
              <Marker
                key={`${transmitter.ACMASiteID}-${transmitter.CallSignChannel}`}
                position={[transmitter.Lat, transmitter.Long]}
              >
                <Popup maxWidth={350}>
                  <TransmitterPopup transmitter={transmitter} />
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
          {bounds && <ResetViewControl bounds={bounds} />}
          <LayerControl
            showLayer={showTVLicenceAreas}
            setShowLayer={setShowTVLicenceAreas}
          />
          <GeolocationControl />
        </MapContainer>
        {selectedArea && (
          <div className="absolute right-4 top-4 z-[1000] rounded bg-white p-2 shadow">
            Selected Area: {selectedArea}
          </div>
        )}
      </div>
    </div>
  );
}

// Custom hook for data fetching
function useTransmitterData() {
  const [transmittersData, setTransmittersData] = useState<Transmitter[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/py/transmitters').then(response => {
        if (!response.ok) throw new Error('Failed to fetch transmitter data');
        return response.json();
      }),
      fetch('/TVLicenceAreas.geojson').then(response => {
        if (!response.ok)
          throw new Error('Failed to fetch TV Licence Areas data');
        return response.json();
      }),
    ])
      .then(([transmittersData, geoJsonData]) => {
        setTransmittersData(transmittersData);
        setGeoJsonData(geoJsonData);
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  }, []);

  return { transmittersData, geoJsonData, isLoading, error };
}
