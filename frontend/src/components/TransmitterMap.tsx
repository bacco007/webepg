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
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Locate,
  Maximize,
  RefreshCw,
} from 'lucide-react';

import '@drustack/leaflet.resetview';
import { TransmitterPopup } from '@/components/TransmitterPopup';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from '@/hooks/use-toast';
import { FilterSection } from '@/components/filter-section';
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from '@/components/layouts/sidebar-layout';

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

// Frequency Range Filter component
function FrequencyRangeFilter({
  minFrequency,
  maxFrequency,
  frequencyRange,
  setMinFrequency,
  setMaxFrequency,
  setFrequencyRange,
}: {
  minFrequency: string;
  maxFrequency: string;
  frequencyRange: [number, number];
  setMinFrequency: (value: string) => void;
  setMaxFrequency: (value: string) => void;
  setFrequencyRange: (value: [number, number]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFrequencyInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = Number.parseFloat(value);

    if (type === 'min') {
      setMinFrequency(value);
      if (!isNaN(numValue)) {
        setFrequencyRange([numValue, frequencyRange[1]]);
      }
    } else {
      setMaxFrequency(value);
      if (!isNaN(numValue)) {
        setFrequencyRange([frequencyRange[0], numValue]);
      }
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b">
      <CollapsibleTrigger className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">
            Frequency
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3">
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="space-y-1">
              <Label htmlFor="min-frequency" className="text-xs">
                Min.
              </Label>
              <div className="flex items-center">
                <Input
                  id="min-frequency"
                  type="number"
                  value={minFrequency}
                  onChange={e =>
                    handleFrequencyInputChange('min', e.target.value)
                  }
                  className="w-20 h-8 text-sm"
                />
                <span className="ml-1 text-muted-foreground text-xs">MHz</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="max-frequency" className="text-xs">
                Max.
              </Label>
              <div className="flex items-center">
                <Input
                  id="max-frequency"
                  type="number"
                  value={maxFrequency}
                  onChange={e =>
                    handleFrequencyInputChange('max', e.target.value)
                  }
                  className="w-20 h-8 text-sm"
                />
                <span className="ml-1 text-muted-foreground text-xs">MHz</span>
              </div>
            </div>
          </div>
          <Slider
            value={frequencyRange}
            min={150}
            max={670}
            step={1}
            onValueChange={value => {
              setFrequencyRange(value as [number, number]);
              setMinFrequency(value[0].toString());
              setMaxFrequency(value[1].toString());
            }}
            className="mt-2"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function TransmitterMap() {
  // Update initial frequency range values
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([
    150, 670,
  ]);
  const [minFrequency, setMinFrequency] = useState<string>('150');
  const [maxFrequency, setMaxFrequency] = useState<string>('670');

  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [callSignSearch, setCallSignSearch] = useState<string>('');
  const [areaServedSearch, setAreaServedSearch] = useState<string>('');
  const [licenceAreaSearch, setLicenceAreaSearch] = useState<string>('');
  const [operatorSearch, setOperatorSearch] = useState<string>('');
  const [networkSearch, setNetworkSearch] = useState<string>('');
  const [callSignFilters, setCallSignFilters] = useState<string[]>([]);
  const [areaServedFilters, setAreaServedFilters] = useState<string[]>([]);
  const [licenceAreaFilters, setLicenceAreaFilters] = useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [networkFilters, setNetworkFilters] = useState<string[]>([]);
  const [transmittersData, setTransmittersData] = useState<Transmitter[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showTVLicenceAreas, setShowTVLicenceAreas] = useState(false);

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
          transmitter.Frequency >= frequencyRange[0] &&
          transmitter.Frequency <= frequencyRange[1] &&
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
      frequencyRange,
      debouncedGlobalSearch,
    ],
  );

  // Update the useEffect that sets frequency range to respect the 150-670 bounds
  useEffect(() => {
    if (transmittersData.length > 0) {
      // Don't automatically set the frequency range from data
      // Keep the 150-670 range as specified
      setFrequencyRange([150, 670]);
      setMinFrequency('150');
      setMaxFrequency('670');
    }
  }, [transmittersData]);

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

  // Filter counts
  const callSignCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes callSign filter
    const filterWithoutCallSign = (transmitter: Transmitter) =>
      (areaServedFilters.length === 0 ||
        areaServedFilters.includes(transmitter.AreaServed)) &&
      (licenceAreaFilters.length === 0 ||
        licenceAreaFilters.includes(transmitter.LicenceArea)) &&
      (operatorFilters.length === 0 ||
        operatorFilters.includes(transmitter.Operator)) &&
      (networkFilters.length === 0 ||
        networkFilters.includes(transmitter.Network)) &&
      transmitter.Frequency >= frequencyRange[0] &&
      transmitter.Frequency <= frequencyRange[1] &&
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
        ));

    // Count only transmitters that match all other filters
    uniqueCallSigns.forEach(callSign => {
      counts[callSign] = transmittersData.filter(
        t => t.CallSign === callSign && filterWithoutCallSign(t),
      ).length;
    });

    return counts;
  }, [
    transmittersData,
    uniqueCallSigns,
    areaServedFilters,
    licenceAreaFilters,
    operatorFilters,
    networkFilters,
    frequencyRange,
    debouncedGlobalSearch,
  ]);

  const areaServedCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes areaServed filter
    const filterWithoutAreaServed = (transmitter: Transmitter) =>
      (callSignFilters.length === 0 ||
        callSignFilters.includes(transmitter.CallSign)) &&
      (licenceAreaFilters.length === 0 ||
        licenceAreaFilters.includes(transmitter.LicenceArea)) &&
      (operatorFilters.length === 0 ||
        operatorFilters.includes(transmitter.Operator)) &&
      (networkFilters.length === 0 ||
        networkFilters.includes(transmitter.Network)) &&
      transmitter.Frequency >= frequencyRange[0] &&
      transmitter.Frequency <= frequencyRange[1] &&
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
        ));

    // Count only transmitters that match all other filters
    uniqueAreaServed.forEach(area => {
      counts[area] = transmittersData.filter(
        t => t.AreaServed === area && filterWithoutAreaServed(t),
      ).length;
    });

    return counts;
  }, [
    transmittersData,
    uniqueAreaServed,
    callSignFilters,
    licenceAreaFilters,
    operatorFilters,
    networkFilters,
    frequencyRange,
    debouncedGlobalSearch,
  ]);

  const licenceAreaCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes licenceArea filter
    const filterWithoutLicenceArea = (transmitter: Transmitter) =>
      (callSignFilters.length === 0 ||
        callSignFilters.includes(transmitter.CallSign)) &&
      (areaServedFilters.length === 0 ||
        areaServedFilters.includes(transmitter.AreaServed)) &&
      (operatorFilters.length === 0 ||
        operatorFilters.includes(transmitter.Operator)) &&
      (networkFilters.length === 0 ||
        networkFilters.includes(transmitter.Network)) &&
      transmitter.Frequency >= frequencyRange[0] &&
      transmitter.Frequency <= frequencyRange[1] &&
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
        ));

    // Count only transmitters that match all other filters
    uniqueLicenceAreas.forEach(area => {
      counts[area] = transmittersData.filter(
        t => t.LicenceArea === area && filterWithoutLicenceArea(t),
      ).length;
    });

    return counts;
  }, [
    transmittersData,
    uniqueLicenceAreas,
    callSignFilters,
    areaServedFilters,
    operatorFilters,
    networkFilters,
    frequencyRange,
    debouncedGlobalSearch,
  ]);

  const operatorCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes operator filter
    const filterWithoutOperator = (transmitter: Transmitter) =>
      (callSignFilters.length === 0 ||
        callSignFilters.includes(transmitter.CallSign)) &&
      (areaServedFilters.length === 0 ||
        areaServedFilters.includes(transmitter.AreaServed)) &&
      (licenceAreaFilters.length === 0 ||
        licenceAreaFilters.includes(transmitter.LicenceArea)) &&
      (networkFilters.length === 0 ||
        networkFilters.includes(transmitter.Network)) &&
      transmitter.Frequency >= frequencyRange[0] &&
      transmitter.Frequency <= frequencyRange[1] &&
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
        ));

    // Count only transmitters that match all other filters
    uniqueOperators.forEach(operator => {
      counts[operator] = transmittersData.filter(
        t => t.Operator === operator && filterWithoutOperator(t),
      ).length;
    });

    return counts;
  }, [
    transmittersData,
    uniqueOperators,
    callSignFilters,
    areaServedFilters,
    licenceAreaFilters,
    networkFilters,
    frequencyRange,
    debouncedGlobalSearch,
  ]);

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes network filter
    const filterWithoutNetwork = (transmitter: Transmitter) =>
      (callSignFilters.length === 0 ||
        callSignFilters.includes(transmitter.CallSign)) &&
      (areaServedFilters.length === 0 ||
        areaServedFilters.includes(transmitter.AreaServed)) &&
      (licenceAreaFilters.length === 0 ||
        licenceAreaFilters.includes(transmitter.LicenceArea)) &&
      (operatorFilters.length === 0 ||
        operatorFilters.includes(transmitter.Operator)) &&
      transmitter.Frequency >= frequencyRange[0] &&
      transmitter.Frequency <= frequencyRange[1] &&
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
        ));

    // Count only transmitters that match all other filters
    uniqueNetworks.forEach(network => {
      counts[network] = transmittersData.filter(
        t => t.Network === network && filterWithoutNetwork(t),
      ).length;
    });

    return counts;
  }, [
    transmittersData,
    uniqueNetworks,
    callSignFilters,
    areaServedFilters,
    licenceAreaFilters,
    operatorFilters,
    frequencyRange,
    debouncedGlobalSearch,
  ]);

  const filteredTransmitters = useMemo(() => {
    return filterTransmitters(transmittersData);
  }, [transmittersData, filterTransmitters]);

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

  // Clear all filters
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

    // Reset frequency range to 150-670
    setFrequencyRange([150, 670]);
    setMinFrequency('150');
    setMaxFrequency('670');
  };

  // Refresh data
  const handleRefresh = async () => {
    setLocalIsLoading(true);
    try {
      const [transmittersResponse, geoJsonResponse] = await Promise.all([
        fetch('/api/py/transmitters'),
        fetch('/TVLicenceAreas.geojson'),
      ]);

      if (!transmittersResponse.ok)
        throw new Error('Failed to fetch transmitter data');
      if (!geoJsonResponse.ok)
        throw new Error('Failed to fetch TV Licence Areas data');

      const transmittersData = await transmittersResponse.json();
      const geoJsonData = await geoJsonResponse.json();

      setTransmittersData(transmittersData);
      setGeoJsonData(geoJsonData);
      setLocalError(null);

      toast({
        title: 'Data refreshed',
        description: `Loaded ${transmittersData.length} transmitters.`,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error refreshing data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLocalIsLoading(false);
    }
  };

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleRefresh}
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={localIsLoading}
      >
        <RefreshCw
          className={`h-4 w-4 ${localIsLoading ? 'animate-spin' : ''}`}
        />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <Button
        variant={showTVLicenceAreas ? 'default' : 'outline'}
        size="sm"
        className="gap-1"
        onClick={() => setShowTVLicenceAreas(!showTVLicenceAreas)}
      >
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline">TV Areas</span>
      </Button>
    </div>
  );

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          value={globalSearchTerm}
          onChange={setGlobalSearchTerm}
          placeholder="Search transmitters..."
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          title="Call Signs"
          options={uniqueCallSigns}
          filters={callSignFilters}
          onFilterChange={value => handleFilterChange('callSign', value)}
          searchValue={callSignSearch}
          onSearchChange={setCallSignSearch}
          counts={callSignCounts}
          showSearch={true}
        />
        <FilterSection
          title="Areas Served"
          options={uniqueAreaServed}
          filters={areaServedFilters}
          onFilterChange={value => handleFilterChange('areaServed', value)}
          searchValue={areaServedSearch}
          onSearchChange={setAreaServedSearch}
          counts={areaServedCounts}
          showSearch={true}
        />
        <FilterSection
          title="Licence Areas"
          options={uniqueLicenceAreas}
          filters={licenceAreaFilters}
          onFilterChange={value => handleFilterChange('licenceArea', value)}
          searchValue={licenceAreaSearch}
          onSearchChange={setLicenceAreaSearch}
          counts={licenceAreaCounts}
          showSearch={true}
        />
        <FilterSection
          title="Operators"
          options={uniqueOperators}
          filters={operatorFilters}
          onFilterChange={value => handleFilterChange('operator', value)}
          searchValue={operatorSearch}
          onSearchChange={setOperatorSearch}
          counts={operatorCounts}
          showSearch={true}
        />
        <FilterSection
          title="Networks"
          options={uniqueNetworks}
          filters={networkFilters}
          onFilterChange={value => handleFilterChange('network', value)}
          searchValue={networkSearch}
          onSearchChange={setNetworkSearch}
          counts={networkCounts}
          showSearch={true}
        />
        <FrequencyRangeFilter
          minFrequency={minFrequency}
          maxFrequency={maxFrequency}
          frequencyRange={frequencyRange}
          setMinFrequency={setMinFrequency}
          setMaxFrequency={setMaxFrequency}
          setFrequencyRange={setFrequencyRange}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="w-full text-xs"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredTransmitters.length} of {transmittersData.length}{' '}
          transmitters
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (localIsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <RefreshCw className="mx-auto w-8 h-8 text-muted-foreground animate-spin" />
          <p className="mt-2">Loading transmitter data...</p>
        </div>
      </div>
    );
  }

  if (localError || error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="p-6 border rounded-lg max-w-md text-center">
          <p className="mb-4 font-semibold text-destructive text-lg">
            Error loading data
          </p>
          <p className="mb-4 text-muted-foreground">{localError || error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      title="Transmitter Map"
      sidebar={sidebar}
      contentClassName="p-0"
      actions={headerActions}
    >
      <div className="relative w-full h-full">
        <MapContainer
          center={center}
          zoom={zoom}
          className="size-full"
          ref={mapRef}
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
          <GeolocationControl />
        </MapContainer>
        {selectedArea && (
          <div className="top-4 right-4 z-[1000] absolute bg-background shadow-sm p-2 rounded">
            <p className="font-medium text-sm">Selected Area: {selectedArea}</p>
          </div>
        )}
      </div>
    </SidebarLayout>
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
