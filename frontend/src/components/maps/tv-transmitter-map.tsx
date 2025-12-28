"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Maximize,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import "@drustack/leaflet.resetview";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { FilterSection } from "@/components/filter-section";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import { TransmitterPopup } from "@/components/maps/transmitter-popup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Map as LeafletMapComponent,
  MapLayers,
  MapLocateControl,
  MapTileLayer,
  MapZoomControl,
} from "@/components/ui/map";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";

// Add custom styles for marker clusters
const clusterStyles = `
  .custom-marker-cluster {
    background: transparent;
  }
  .cluster-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    font-weight: 600;
    color: white;
    transition: all 0.3s ease;
  }
  .cluster-icon.small {
    background-color: rgba(59, 130, 246, 0.8);
    font-size: 12px;
  }
  .cluster-icon.medium {
    background-color: rgba(59, 130, 246, 0.9);
    font-size: 14px;
  }
  .cluster-icon.large {
    background-color: rgba(59, 130, 246, 1);
    font-size: 16px;
  }
  .cluster-icon:hover {
    transform: scale(1.1);
  }
`;

// Add styles to document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = clusterStyles;
  document.head.appendChild(style);
}

// Helper function to get marker icon SVG
const createMarkerIconSVG = (type: string) => {
  // SVG icons for each network
  const networkSVGs: Record<string, string> = {
    ABC: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="10" fill="#FF0000" stroke="white" stroke-width="2"/><text x="11" y="15" text-anchor="middle" font-size="10" fill="white" font-family="Arial" font-weight="bold">A</text></svg>`,
    Community: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="10" fill="#808080" stroke="white" stroke-width="2"/><text x="11" y="15" text-anchor="middle" font-size="8" fill="white" font-family="Arial" font-weight="bold">C</text></svg>`,
    Nine: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="11" rx="10" ry="8" fill="#FFFF00" stroke="white" stroke-width="2"/><text x="11" y="15" text-anchor="middle" font-size="10" fill="#333" font-family="Arial" font-weight="bold">9</text></svg>`,
    SBS: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="18" height="18" rx="6" fill="#00FF00" stroke="white" stroke-width="2"/><text x="11" y="15" text-anchor="middle" font-size="10" fill="white" font-family="Arial" font-weight="bold">S</text></svg>`,
    Seven: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 20,20 2,20" fill="#0000FF" stroke="white" stroke-width="2"/><text x="11" y="16" text-anchor="middle" font-size="10" fill="white" font-family="Arial" font-weight="bold">7</text></svg>`,
    Ten: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="18" height="18" rx="9" fill="#FF00FF" stroke="white" stroke-width="2"/><text x="11" y="15" text-anchor="middle" font-size="10" fill="white" font-family="Arial" font-weight="bold">10</text></svg>`,
  };
  // Network matching
  let svg = networkSVGs.Community;
  if (type.includes("ABC")) {
    svg = networkSVGs.ABC;
  } else if (type.includes("SBS")) {
    svg = networkSVGs.SBS;
  } else if (type.includes("Seven Network")) {
    svg = networkSVGs.Seven;
  } else if (type.includes("Nine Network")) {
    svg = networkSVGs.Nine;
  } else if (type.includes("Ten Network")) {
    svg = networkSVGs.Ten;
  } else if (type.includes("Community") || type.includes("Narrowcasting")) {
    svg = networkSVGs.Community;
  }
  return svg;
};

// Add custom marker styles and drop animation
const markerStyles = `
  .custom-marker-container {
    background: transparent;
  }
  .custom-marker {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
    overflow: hidden;
  }
  .custom-marker-drop {
    animation: markerDrop 0.6s cubic-bezier(.23,1.01,.32,1) both;
  }
  @keyframes markerDrop {
    0% { transform: translateY(-40px) scale(0.5); opacity: 0; }
    70% { transform: translateY(4px) scale(1.1); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  .custom-marker-highlight {
    border: 3px solid #3b82f6 !important;
    box-shadow: 0 0 0 4px #3b82f633 !important;
    z-index: 1000;
  }
`;

// Add styles to document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = markerStyles;
  document.head.appendChild(style);
}

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
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      name: string;
      NAME: string;
      [key: string]: string | number | boolean | null | undefined;
    };
    geometry: {
      type: string;
      coordinates: number[][][];
    };
  }>;
}

function MapControls({
  bounds,
  center,
  zoom,
}: {
  bounds: L.LatLngBounds | null;
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  const handleFitBounds = useCallback(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return (
    <div className="absolute top-16 left-1 z-[1000]">
      <div className="flex flex-col gap-2">
        <Button
          className="border"
          disabled={!bounds}
          onClick={handleFitBounds}
          size="icon"
          title="Fit to markers"
          variant="secondary"
        >
          <Target className="size-4" />
        </Button>
        <Button
          className="border"
          onClick={() => map.setView(center, zoom)}
          size="icon"
          title="Reset view"
          variant="secondary"
        >
          <Maximize className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const TVLicenceAreasLayer = React.lazy(
  () => import("@/components/maps/tv-licence-areas-layer")
);

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

  const handleFrequencyInputChange = (type: "min" | "max", value: string) => {
    const numValue = Number.parseFloat(value);

    if (type === "min") {
      setMinFrequency(value);
      if (!Number.isNaN(numValue)) {
        setFrequencyRange([numValue, frequencyRange[1]]);
      }
    } else {
      setMaxFrequency(value);
      if (!Number.isNaN(numValue)) {
        setFrequencyRange([frequencyRange[0], numValue]);
      }
    }
  };

  return (
    <Collapsible className="border-b" onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/10">
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
              <Label className="text-xs" htmlFor="min-frequency">
                Min.
              </Label>
              <div className="flex items-center">
                <Input
                  className="h-8 w-20 text-sm"
                  id="min-frequency"
                  onChange={(e) =>
                    handleFrequencyInputChange("min", e.target.value)
                  }
                  type="number"
                  value={minFrequency}
                />
                <span className="ml-1 text-muted-foreground text-xs">MHz</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="max-frequency">
                Max.
              </Label>
              <div className="flex items-center">
                <Input
                  className="h-8 w-20 text-sm"
                  id="max-frequency"
                  onChange={(e) =>
                    handleFrequencyInputChange("max", e.target.value)
                  }
                  type="number"
                  value={maxFrequency}
                />
                <span className="ml-1 text-muted-foreground text-xs">MHz</span>
              </div>
            </div>
          </div>
          <Slider
            className="mt-2"
            max={670}
            min={150}
            onValueChange={(value) => {
              setFrequencyRange(value as [number, number]);
              setMinFrequency(value[0].toString());
              setMaxFrequency(value[1].toString());
            }}
            step={1}
            value={frequencyRange}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MapLegend() {
  const networks = [
    { color: "#FF0000", name: "ABC", patterns: ["ABC"] },
    { color: "#00FF00", name: "SBS", patterns: ["SBS"] },
    { color: "#0000FF", name: "Seven", patterns: ["Seven Network"] },
    { color: "#FFFF00", name: "Nine", patterns: ["Nine Network"] },
    { color: "#FF00FF", name: "Ten", patterns: ["Ten Network"] },
    {
      color: "#808080",
      name: "Community",
      patterns: ["Community", "Narrowcasting"],
    },
  ];

  return (
    <div className="absolute bottom-5 left-5 z-[1000]">
      <Card className="w-28 rounded-lg border border-border bg-background/90 py-1 shadow-md">
        <CardContent className="p-2">
          <h3 className="mb-1 font-bold text-xs">Networks</h3>
          <ScrollArea className="h-[120px]">
            <div className="space-y-1">
              {networks.map((network) => (
                <div className="flex items-center gap-2" key={network.name}>
                  <div
                    className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: network.color }}
                  />
                  <span className="text-xs">{network.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MinimapControl() {
  const map = useMap();
  const { resolvedTheme } = useTheme();
  const minimapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!minimapRef.current) {
      return;
    }

    const minimap = L.map(minimapRef.current, {
      attributionControl: false,
      boxZoom: false,
      center: map.getCenter(),
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      scrollWheelZoom: false,
      touchZoom: false,
      zoom: map.getZoom() - 3,
      zoomControl: false,
    });

    L.tileLayer(
      resolvedTheme === "dark"
        ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
      }
    ).addTo(minimap);

    const updateMinimap = () => {
      minimap.setView(map.getCenter(), map.getZoom() - 3);
    };

    map.on("move", updateMinimap);
    map.on("zoom", updateMinimap);

    return () => {
      map.off("move", updateMinimap);
      map.off("zoom", updateMinimap);
      minimap.remove();
    };
  }, [map, resolvedTheme]);

  return (
    <div className="absolute right-20 bottom-16 z-[1000]">
      <div
        className="h-20 w-20 rounded-lg border border-border bg-background/90 shadow-lg"
        ref={minimapRef}
      />
    </div>
  );
}

export default function TVTransmitterMap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Update initial frequency range values
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([
    150, 670,
  ]);
  const [minFrequency, setMinFrequency] = useState<string>("150");
  const [maxFrequency, setMaxFrequency] = useState<string>("670");

  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
  const [callSignSearch, setCallSignSearch] = useState<string>("");
  const [areaServedSearch, setAreaServedSearch] = useState<string>("");
  const [licenceAreaSearch, setLicenceAreaSearch] = useState<string>("");
  const [operatorSearch, setOperatorSearch] = useState<string>("");
  const [networkSearch, setNetworkSearch] = useState<string>("");
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
  const [searchLocation, setSearchLocation] = useState("");
  const [searchResult, setSearchResult] = useState<{
    lat: number;
    lon: number;
    display_name: string;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const debouncedGlobalSearch = useDebounce(globalSearchTerm, 300);

  const {
    transmittersData: fetchedTransmittersData,
    geoJsonData: fetchedGeoJsonData,
    isLoading,
    error,
  } = useTransmitterData();

  const [mapView, setMapView] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  const [showLegend, setShowLegend] = useState(true);

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

  // On mount, set map view from URL if present
  useEffect(() => {
    const lat = Number.parseFloat(searchParams.get("lat") || "");
    const lng = Number.parseFloat(searchParams.get("lng") || "");
    const zoom = Number.parseInt(searchParams.get("zoom") || "", 10);
    if (!(Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(zoom))) {
      setMapView({ lat, lng, zoom });
    }
  }, [searchParams]);

  // When map moves, update URL
  const handleMapMove = useCallback(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      const params = new URLSearchParams(searchParams.toString());
      params.set("lat", center.lat.toFixed(5));
      params.set("lng", center.lng.toFixed(5));
      params.set("zoom", zoom.toString());
      router.replace(`?${params.toString()}`);
    }
  }, [router, searchParams]);

  // Share button handler
  const handleShare = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      const url = `${window.location.origin}${window.location.pathname}?lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}&zoom=${zoom}`;
      navigator.clipboard.writeText(url);
      toast({ description: url, title: "Map link copied!" });
    }
  };

  const filterTransmitters = useCallback(
    (transmitters: Transmitter[]) =>
      transmitters.filter(
        (transmitter) =>
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
          (debouncedGlobalSearch === "" ||
            transmitter.CallSign.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase()
            ) ||
            transmitter.AreaServed.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase()
            ) ||
            transmitter.LicenceArea.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase()
            ) ||
            transmitter.Operator.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase()
            ) ||
            transmitter.Network.toLowerCase().includes(
              debouncedGlobalSearch.toLowerCase()
            ))
      ),
    [
      callSignFilters,
      areaServedFilters,
      licenceAreaFilters,
      operatorFilters,
      networkFilters,
      frequencyRange,
      debouncedGlobalSearch,
    ]
  );

  // Update the useEffect that sets frequency range to respect the 150-670 bounds
  useEffect(() => {
    if (transmittersData.length > 0) {
      // Don't automatically set the frequency range from data
      // Keep the 150-670 range as specified
      setFrequencyRange([150, 670]);
      setMinFrequency("150");
      setMaxFrequency("670");
    }
  }, [transmittersData]);

  const uniqueCallSigns = useMemo(
    () => [...new Set(transmittersData.map((t) => t.CallSign))].sort(),
    [transmittersData]
  );

  const uniqueAreaServed = useMemo(
    () => [...new Set(transmittersData.map((t) => t.AreaServed))].sort(),
    [transmittersData]
  );

  const uniqueLicenceAreas = useMemo(
    () => [...new Set(transmittersData.map((t) => t.LicenceArea))].sort(),
    [transmittersData]
  );

  const uniqueOperators = useMemo(
    () => [...new Set(transmittersData.map((t) => t.Operator))].sort(),
    [transmittersData]
  );

  const uniqueNetworks = useMemo(
    () => [...new Set(transmittersData.map((t) => t.Network))].sort(),
    [transmittersData]
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
      (debouncedGlobalSearch === "" ||
        transmitter.CallSign.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.AreaServed.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.LicenceArea.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Operator.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Network.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ));

    // Count only transmitters that match all other filters
    for (const callSign of uniqueCallSigns) {
      counts[callSign] = transmittersData.filter(
        (t) => t.CallSign === callSign && filterWithoutCallSign(t)
      ).length;
    }

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
      (debouncedGlobalSearch === "" ||
        transmitter.CallSign.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.AreaServed.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.LicenceArea.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Operator.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Network.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ));

    // Count only transmitters that match all other filters
    for (const area of uniqueAreaServed) {
      counts[area] = transmittersData.filter(
        (t) => t.AreaServed === area && filterWithoutAreaServed(t)
      ).length;
    }

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
      (debouncedGlobalSearch === "" ||
        transmitter.CallSign.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.AreaServed.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.LicenceArea.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Operator.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Network.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ));

    // Count only transmitters that match all other filters
    for (const area of uniqueLicenceAreas) {
      counts[area] = transmittersData.filter(
        (t) => t.LicenceArea === area && filterWithoutLicenceArea(t)
      ).length;
    }

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
      (debouncedGlobalSearch === "" ||
        transmitter.CallSign.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.AreaServed.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.LicenceArea.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Operator.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Network.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ));

    // Count only transmitters that match all other filters
    for (const operator of uniqueOperators) {
      counts[operator] = transmittersData.filter(
        (t) => t.Operator === operator && filterWithoutOperator(t)
      ).length;
    }

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
      (debouncedGlobalSearch === "" ||
        transmitter.CallSign.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.AreaServed.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.LicenceArea.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Operator.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ) ||
        transmitter.Network.toLowerCase().includes(
          debouncedGlobalSearch.toLowerCase()
        ));

    // Count only transmitters that match all other filters
    for (const network of uniqueNetworks) {
      counts[network] = transmittersData.filter(
        (t) => t.Network === network && filterWithoutNetwork(t)
      ).length;
    }

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

  const filteredTransmitters = useMemo(
    () => filterTransmitters(transmittersData),
    [transmittersData, filterTransmitters]
  );

  const bounds = useMemo(() => {
    if (filteredTransmitters.length === 0) {
      return null;
    }
    return L.latLngBounds(filteredTransmitters.map((t) => [t.Lat, t.Long]));
  }, [filteredTransmitters]);

  // Fit map to bounds on initial load and when filteredTransmitters changes
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds]);

  const center: [number, number] = [-25.2744, 133.7751];
  const zoom = 4;

  const handleFilterChange = (
    filterType:
      | "callSign"
      | "areaServed"
      | "licenceArea"
      | "operator"
      | "network",
    value: string
  ) => {
    switch (filterType) {
      case "callSign": {
        setCallSignFilters((previous) =>
          previous.includes(value)
            ? previous.filter((v) => v !== value)
            : [...previous, value]
        );
        break;
      }
      case "areaServed": {
        setAreaServedFilters((previous) =>
          previous.includes(value)
            ? previous.filter((v) => v !== value)
            : [...previous, value]
        );
        break;
      }
      case "licenceArea": {
        setLicenceAreaFilters((previous) =>
          previous.includes(value)
            ? previous.filter((v) => v !== value)
            : [...previous, value]
        );
        break;
      }
      case "operator": {
        setOperatorFilters((previous) =>
          previous.includes(value)
            ? previous.filter((v) => v !== value)
            : [...previous, value]
        );
        break;
      }
      case "network": {
        setNetworkFilters((previous) =>
          previous.includes(value)
            ? previous.filter((v) => v !== value)
            : [...previous, value]
        );
        break;
      }
      default: {
        // Do nothing
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
    setGlobalSearchTerm("");
    setCallSignSearch("");
    setAreaServedSearch("");
    setLicenceAreaSearch("");
    setOperatorSearch("");
    setNetworkSearch("");

    // Reset frequency range to 150-670
    setFrequencyRange([150, 670]);
    setMinFrequency("150");
    setMaxFrequency("670");
  };

  // Refresh data
  const handleRefresh = async () => {
    setLocalIsLoading(true);
    try {
      const [transmittersResponse, geoJsonResponse] = await Promise.all([
        fetch("/api/py/transmitters/tv"),
        fetch("/TVLicenceAreas.geojson"),
      ]);

      if (!transmittersResponse.ok) {
        throw new Error("Failed to fetch transmitter data");
      }
      if (!geoJsonResponse.ok) {
        throw new Error("Failed to fetch TV Licence Areas data");
      }

      const transmittersDataResult = await transmittersResponse.json();
      const geoJsonDataResult = await geoJsonResponse.json();

      setTransmittersData(transmittersDataResult);
      setGeoJsonData(geoJsonDataResult);
      setLocalError(null);

      toast({
        description: `Loaded ${transmittersDataResult.length} transmitters.`,
        title: "Data refreshed",
      });
    } catch (_error) {
      setLocalError(_error instanceof Error ? _error.message : "Unknown error");
      toast({
        description: _error instanceof Error ? _error.message : "Unknown error",
        title: "Error refreshing data",
        variant: "destructive",
      });
    } finally {
      setLocalIsLoading(false);
    }
  };

  // Location search handler
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) {
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResult({
          display_name: data[0].display_name,
          lat: Number.parseFloat(data[0].lat),
          lon: Number.parseFloat(data[0].lon),
        });
        if (mapRef.current) {
          mapRef.current.setView(
            [Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon)],
            13
          );
        }
      } else {
        setSearchError("No results found.");
        setSearchResult(null);
      }
    } catch (_err) {
      setSearchError("Error searching location.");
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <form className="flex items-center gap-1" onSubmit={handleLocationSearch}>
        <Input
          className="h-8 w-40 text-xs"
          disabled={searchLoading}
          onChange={(e) => setSearchLocation(e.target.value)}
          placeholder="Search location..."
          value={searchLocation}
        />
        <Button
          className="h-8 w-8"
          disabled={searchLoading}
          size="icon"
          type="submit"
          variant="outline"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {searchError && (
        <span className="ml-2 text-destructive text-xs">{searchError}</span>
      )}
      <Button
        className="gap-1"
        onClick={handleShare}
        size="sm"
        title="Copy map link"
        variant="outline"
      >
        <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
          <title>Share map link</title>
          <path
            d="M15 7h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 15V3m0 0-3.5 3.5M12 3l3.5 3.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Button
        className="gap-1"
        disabled={localIsLoading}
        onClick={handleRefresh}
        size="sm"
        variant="outline"
      >
        <RefreshCw
          className={`h-4 w-4 ${localIsLoading ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <Button
        className="gap-1"
        onClick={() => setShowTVLicenceAreas(!showTVLicenceAreas)}
        size="sm"
        variant={showTVLicenceAreas ? "default" : "outline"}
      >
        <Layers className="h-4 w-4" />
        <span className="hidden sm:inline">TV Areas</span>
      </Button>
      <Button
        className="gap-1"
        onClick={() => setShowLegend((l) => !l)}
        size="sm"
        title={showLegend ? "Hide legend" : "Show legend"}
        variant="outline"
      >
        {showLegend ? (
          <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
            <title>Hide legend</title>
            <rect
              height="16"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              x="4"
              y="4"
            />
            <path d="M8 12h8" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : (
          <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
            <title>Show legend</title>
            <rect
              height="16"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              x="4"
              y="4"
            />
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {showLegend ? "Hide" : "Show"} Legend
        </span>
      </Button>
    </div>
  );

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setGlobalSearchTerm}
          placeholder="Search transmitters..."
          searchValue={globalSearchTerm}
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          counts={callSignCounts}
          filters={callSignFilters}
          onFilterChange={(value) => handleFilterChange("callSign", value)}
          onSearchChange={setCallSignSearch}
          options={uniqueCallSigns}
          searchValue={callSignSearch}
          showSearch={true}
          title="Call Signs"
        />
        <FilterSection
          counts={areaServedCounts}
          filters={areaServedFilters}
          onFilterChange={(value) => handleFilterChange("areaServed", value)}
          onSearchChange={setAreaServedSearch}
          options={uniqueAreaServed}
          searchValue={areaServedSearch}
          showSearch={true}
          title="Areas Served"
        />
        <FilterSection
          counts={licenceAreaCounts}
          filters={licenceAreaFilters}
          onFilterChange={(value) => handleFilterChange("licenceArea", value)}
          onSearchChange={setLicenceAreaSearch}
          options={uniqueLicenceAreas}
          searchValue={licenceAreaSearch}
          showSearch={true}
          title="Licence Areas"
        />
        <FilterSection
          counts={operatorCounts}
          filters={operatorFilters}
          onFilterChange={(value) => handleFilterChange("operator", value)}
          onSearchChange={setOperatorSearch}
          options={uniqueOperators}
          searchValue={operatorSearch}
          showSearch={true}
          title="Operators"
        />
        <FilterSection
          counts={networkCounts}
          filters={networkFilters}
          onFilterChange={(value) => handleFilterChange("network", value)}
          onSearchChange={setNetworkSearch}
          options={uniqueNetworks}
          searchValue={networkSearch}
          showSearch={true}
          title="Networks"
        />
        <FrequencyRangeFilter
          frequencyRange={frequencyRange}
          maxFrequency={maxFrequency}
          minFrequency={minFrequency}
          setFrequencyRange={setFrequencyRange}
          setMaxFrequency={setMaxFrequency}
          setMinFrequency={setMinFrequency}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="w-full text-xs"
          onClick={clearAllFilters}
          size="sm"
          variant="outline"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {filteredTransmitters.length} of {transmittersData.length}{" "}
          transmitters
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (localIsLoading || isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-72 border-r bg-background/80">
          <div className="p-4">
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="mb-2 h-6 w-40" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-muted">
          <Skeleton className="h-3/4 w-3/4 rounded-xl" />
        </div>
      </div>
    );
  }

  if (localError || error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border p-6 text-center">
          <p className="mb-4 font-semibold text-destructive text-lg">
            Error loading data
          </p>
          <p className="mb-4 text-muted-foreground">{localError || error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="p-0"
      sidebar={sidebar}
      title="TV Transmitter Map"
    >
      <div className="relative h-full w-full">
        <LeafletMapComponent
          center={mapView ? [mapView.lat, mapView.lng] : center}
          className="size-full"
          maxZoom={20}
          minZoom={3}
          ref={mapRef}
          whenReady={() => {
            if (mapRef.current) {
              mapRef.current.on("moveend", handleMapMove);
            }
          }}
          zoom={mapView ? mapView.zoom : zoom}
        >
          <MapLayers defaultTileLayer="Default">
            <MapTileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
              darkUrl="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              maxZoom={20}
              name="Default"
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            />
            <MapZoomControl className="top-1 left-1" />
            <MapLocateControl
              className="right-1 bottom-1"
              onLocationError={() => {
                toast({
                  description: "Unable to retrieve your location.",
                  title: "Geolocation error",
                  variant: "destructive",
                });
              }}
              onLocationFound={() => {
                toast({
                  description: "Map centered on your current location.",
                  title: "Location found",
                });
              }}
            />
            <MapControls bounds={bounds} center={center} zoom={zoom} />
            {showLegend && <MapLegend />}
            <MinimapControl />
            <React.Suspense fallback={<div>Loading TV Licence Areas...</div>}>
              {showTVLicenceAreas && geoJsonData && (
                <TVLicenceAreasLayer
                  geoJsonData={geoJsonData}
                  onSelectArea={setSelectedArea}
                />
              )}
            </React.Suspense>
            <MarkerClusterGroup
              animate={true}
              chunkedLoading
              iconCreateFunction={(cluster: {
                getChildCount: () => number;
              }) => {
                const count = cluster.getChildCount();
                let size = "large";
                if (count < 10) {
                  size = "small";
                } else if (count < 100) {
                  size = "medium";
                }
                return L.divIcon({
                  className: "custom-marker-cluster",
                  html: `<div class="cluster-icon ${size}">${count}</div>`,
                  iconSize: L.point(40, 40, true),
                });
              }}
              maxClusterRadius={60}
              removeOutsideVisibleBounds={true}
              showCoverageOnHover={true}
              spiderfyOnMaxZoom={true}
              zoomToBoundsOnClick={true}
            >
              {filteredTransmitters.map((transmitter) => {
                const markerId = `${transmitter.ACMASiteID}-${transmitter.CallSignChannel}`;
                const markerIcon = L.divIcon({
                  className: "custom-marker-container",
                  html: `<div class="custom-marker custom-marker-drop">${createMarkerIconSVG(transmitter.Network)}</div>`,
                  iconSize: L.point(22, 22, true),
                });

                return (
                  <Marker
                    eventHandlers={{
                      mouseout: (e) => {
                        e.target.closePopup();
                      },
                      mouseover: (e) => {
                        e.target.openPopup();
                      },
                    }}
                    icon={markerIcon}
                    key={markerId}
                    position={[transmitter.Lat, transmitter.Long]}
                  >
                    <Popup maxWidth={350}>
                      <TransmitterPopup transmitter={transmitter} />
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
            {/* Show a marker for the searched location */}
            {searchResult && (
              <Marker
                icon={L.divIcon({
                  className: "custom-marker-container",
                  html: `<div class='custom-marker custom-marker-drop' style='background-color:#3b82f6;border:2px solid white;width:22px;height:22px;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.2);'></div>`,
                  iconSize: L.point(22, 22, true),
                })}
                position={[searchResult.lat, searchResult.lon]}
              >
                <Popup>{searchResult.display_name}</Popup>
              </Marker>
            )}
          </MapLayers>
        </LeafletMapComponent>
        {selectedArea && (
          <div className="absolute top-4 right-4 z-[1000] rounded bg-background p-2 shadow-sm">
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
      fetch("/api/py/transmitters/tv").then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch transmitter data");
        }
        return response.json();
      }),
      fetch("/TVLicenceAreas.geojson").then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch TV Licence Areas data");
        }
        return response.json();
      }),
    ])
      .then(([transmittersDataResult, geoJsonDataResult]) => {
        setTransmittersData(transmittersDataResult);
        setGeoJsonData(geoJsonDataResult);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        setError(fetchError.message);
        setIsLoading(false);
      });
  }, []);

  return { error, geoJsonData, isLoading, transmittersData };
}
