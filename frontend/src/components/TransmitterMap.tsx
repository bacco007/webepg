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
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Locate,
  Maximize,
  Search,
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
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

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

// Now update the FilterSection component to hide options with zero count
// Modify the FilterSection component to filter out options with zero count
function FilterSection({
  title,
  options,
  filters,
  onFilterChange,
  searchValue,
  onSearchChange,
  counts,
  showSearch = false,
  badge,
}: {
  title: string;
  options: string[];
  filters: string[];
  onFilterChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  counts: Record<string, number>;
  showSearch?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);

  // Filter options to only include those with counts > 0 or those already selected
  const availableOptions = useMemo(() => {
    return options
      .filter(
        option =>
          filters.includes(option) || // Always show selected options
          counts[option] > 0, // Only show options with counts > 0
      )
      .filter(option =>
        option.toLowerCase().includes(debouncedSearch.toLowerCase()),
      );
  }, [options, counts, filters, debouncedSearch]);

  // Calculate total available options for display
  const totalAvailableOptions = useMemo(() => {
    return options.filter(
      option => counts[option] > 0 || filters.includes(option),
    ).length;
  }, [options, counts, filters]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b">
      <CollapsibleTrigger className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">
            {title}
          </span>
          {badge && (
            <Badge variant="outline" className="font-normal text-xs">
              {badge}
            </Badge>
          )}
          {filters.length > 0 && (
            <Badge variant="primary" className="font-normal text-xs">
              {filters.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {totalAvailableOptions}
          </span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3">
        {showSearch && (
          <div className="relative mb-2">
            <Search className="top-2.5 left-2 absolute size-4 text-muted-foreground" />
            <Input
              placeholder={`Search`}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        )}
        <div className="space-y-1 pr-1 max-h-[200px] overflow-y-auto">
          {availableOptions.length > 0 ? (
            availableOptions.map(option => (
              <label
                key={option}
                className="flex justify-between items-center py-1 cursor-pointer"
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={filters.includes(option)}
                    onCheckedChange={() => onFilterChange(option)}
                    className="mr-2"
                  />
                  <span className="text-sm">{option}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {counts[option]}
                </span>
              </label>
            ))
          ) : (
            <div className="py-2 text-muted-foreground text-sm text-center">
              No options available
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Update the FrequencyRangeFilter component to accept props from the parent
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

// Update the TransmitterMap component to initialize frequency range with 150-670
export default function TransmitterMap() {
  // ... existing code ...

  // Update initial frequency range values
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([
    150, 670,
  ]);
  const [minFrequency, setMinFrequency] = useState<string>('150');
  const [maxFrequency, setMaxFrequency] = useState<string>('670');

  // ... existing code ...
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

  // Update the filter counts to be based on the currently filtered data, not the entire dataset
  // Modify the useMemo hooks for filter counts to use the filtered data

  // Replace the existing callSignCounts useMemo with this:
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

  // Replace the existing areaServedCounts useMemo with this:
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

  // Replace the existing licenceAreaCounts useMemo with this:
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

  // Replace the existing operatorCounts useMemo with this:
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

  // Replace the existing networkCounts useMemo with this:
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

  // Update the clearAllFilters function to reset to 150-670
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

  if (localIsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading transmitter data...
      </div>
    );
  }

  if (localError || error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {localError || error}
      </div>
    );
  }

  // In the return statement, update the FrequencyRangeFilter component
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* ... existing code ... */}
      <div className="bg-background border-r w-64 shrink-0">
        <div className="flex flex-col h-full">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="top-2.5 left-2 absolute size-4 text-muted-foreground" />
              <Input
                placeholder="Search transmitters..."
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y">
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
                onFilterChange={value =>
                  handleFilterChange('areaServed', value)
                }
                searchValue={areaServedSearch}
                onSearchChange={setAreaServedSearch}
                counts={areaServedCounts}
                showSearch={true}
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
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
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
          </div>
        </div>
      </div>
      {/* ... rest of the component ... */}
      <div className="flex-1 h-full">
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
          <div className="top-4 right-4 z-[1000] absolute bg-white shadow p-2 rounded">
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
