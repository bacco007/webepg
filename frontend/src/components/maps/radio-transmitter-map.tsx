"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// biome-ignore lint/suspicious/noExplicitAny: Blah
const markerClusterGroup = (L as any).markerClusterGroup;

import { Layers, Maximize, RefreshCw, Search, Target } from "lucide-react";
import { FilterSection } from "@/components/filter-section";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Map as LeafletMapComponent,
  MapLayers,
  MapLocateControl,
  MapTileLayer,
  MapZoomControl,
} from "@/components/ui/map";
import { toast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

import "@drustack/leaflet.resetview";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

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

// Types
interface RadioTransmitter {
  LicenceNo: string;
  CallSign: string;
  AreaServed: string;
  SiteName: string;
  Lat: number;
  Long: number;
  AntennaHeight: number;
  LicenceArea: string;
  Frequency: number;
  Purpose: string;
  Type?: "FM" | "AM" | "DAB";
  Polarity: string;
  Site: string;
  MaxERP: string;
  TransmitPower?: string;
  HoursOfOperaton?: string;
  FreqBlock?: string;
  BSL?: string;
  "Licence Area"?: string;
  uniqueKey: string;
}

interface RadioType {
  name: string;
  color: string;
}

const radioTypes: RadioType[] = [
  { color: "#FF6B6B", name: "AM" },
  { color: "#4ECDC4", name: "FM" },
  { color: "#45B7D1", name: "DAB" },
  { color: "#96CEB4", name: "DRM" },
  { color: "#FFEEAD", name: "Other" },
];

// Create cluster icon function
const createClusterIcon = (cluster: { getChildCount: () => number }) => {
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
};

// Map Controls Component
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
    <div className="absolute top-16 left-1 z-1000">
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

// Frequency Range Filter Component
const getFrequencyRange = (type: "FM" | "AM" | "DAB") => {
  switch (type) {
    case "FM":
      return { max: 108, min: 87.5 };
    case "AM":
      return { max: 1602, min: 531 };
    case "DAB":
      return { max: 240, min: 174 };
    default:
      return { max: 108, min: 87.5 };
  }
};

// Get combined frequency range for multiple types
const getCombinedFrequencyRange = (types: ("FM" | "AM" | "DAB")[]) => {
  if (types.length === 0) {
    return { max: 108, min: 87.5 };
  }
  const ranges = types.map((type) => getFrequencyRange(type));
  return {
    max: Math.max(...ranges.map((r) => r.max)),
    min: Math.min(...ranges.map((r) => r.min)),
  };
};

// Map Legend Component
function MapLegend() {
  const legendRadioTypes = [
    { color: "#ff0000", name: "FM" },
    { color: "#0000ff", name: "AM" },
    { color: "#00ff00", name: "DAB" },
  ];

  return (
    <div className="absolute bottom-5 left-5 z-1000">
      <Card className="w-28 rounded-lg border border-border bg-background/90 py-1 shadow-md">
        <CardContent className="p-2">
          <h3 className="mb-1 font-bold text-xs">Radio Types</h3>
          <ScrollArea className="h-[120px]">
            <div className="space-y-1">
              {legendRadioTypes.map((type) => (
                <div className="flex items-center gap-2" key={type.name}>
                  <div
                    className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-xs">{type.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Minimap Control Component
const MinimapControl = () => {
  const map = useMap();
  const minimapRef = useRef<HTMLDivElement>(null);
  const minimapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (minimapRef.current && !minimapInstance.current) {
      minimapInstance.current = L.map(minimapRef.current, {
        attributionControl: false,
        boxZoom: false,
        center: map.getCenter(),
        doubleClickZoom: false,
        dragging: false,
        keyboard: false,
        scrollWheelZoom: false,
        touchZoom: false,
        zoom: map.getZoom() - 4,
        zoomControl: false,
      });

      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 20,
        }
      ).addTo(minimapInstance.current);

      // Update minimap when main map moves
      map.on("move", () => {
        if (minimapInstance.current) {
          minimapInstance.current.setView(map.getCenter(), map.getZoom() - 4);
        }
      });
    }

    return () => {
      if (minimapInstance.current) {
        minimapInstance.current.remove();
        minimapInstance.current = null;
      }
    };
  }, [map]);

  return (
    <div className="absolute right-20 bottom-16 z-1000">
      <div
        className="h-20 w-20 rounded-lg border border-border bg-background/90 shadow-lg"
        ref={minimapRef}
      />
    </div>
  );
};

// Update the createPopupContent function for a modern, card-like popup
const createPopupContent = (transmitter: RadioTransmitter) => {
  const getNetworkColor = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case "fm":
        return "#ff0000";
      case "am":
        return "#0000ff";
      case "dab":
        return "#00ff00";
      default:
        return "#FFEEAD";
    }
  };

  return `
    <div class="bg-white shadow-lg p-4 rounded-lg min-w-[220px] max-w-[320px]">
      <div class="flex items-center gap-2 mb-2">
        <div class="rounded-full w-3 h-3" style="background-color: ${getNetworkColor(transmitter.Type)}"></div>
        <h3 class="font-bold text-base">${transmitter.CallSign || "Unknown"}</h3>
      </div>
      <div class="space-y-1 text-sm">
        ${transmitter.SiteName ? `<div><span class='font-semibold'>Site:</span> ${transmitter.SiteName}</div>` : ""}
        ${transmitter.AreaServed ? `<div><span class='font-semibold'>Area:</span> ${transmitter.AreaServed}</div>` : ""}
        ${transmitter.Frequency ? `<div><span class='font-semibold'>Frequency:</span> <span class='font-bold text-blue-700'>${transmitter.Frequency} MHz</span></div>` : ""}
        ${transmitter.MaxERP ? `<div><span class='font-semibold'>Power:</span> <span class='font-bold text-green-700'>${transmitter.MaxERP}</span></div>` : ""}
        ${transmitter.AntennaHeight ? `<div><span class='font-semibold'>Antenna Height:</span> ${transmitter.AntennaHeight}m</div>` : ""}
        ${transmitter.Purpose ? `<div><span class='font-semibold'>Purpose:</span> ${transmitter.Purpose}</div>` : ""}
      </div>
    </div>
  `;
};

export default function RadioTransmitterMap() {
  const [isLoading, setIsLoading] = useState(true);
  const [transmittersData, setTransmittersData] = useState<RadioTransmitter[]>(
    []
  );
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<("FM" | "AM" | "DAB")[]>([
    "FM",
  ]);

  const handleRefresh = useCallback(async () => {
    if (selectedTypes.length === 0) {
      setTransmittersData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch data for all selected types in parallel
      const fetchPromises = selectedTypes.map(async (type) => {
        const response = await fetch(
          `/api/py/transmitters/${type.toLowerCase()}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} data`);
        }
        const data = await response.json();
        // Add type information and ensure unique keys
        return data.map((t: RadioTransmitter) => ({
          ...t,
          Type: type,
          uniqueKey: `${type}-${t.LicenceNo}`,
        }));
      });

      const results = await Promise.all(fetchPromises);
      // Combine all data from different types
      const combinedData = results.flat();
      setTransmittersData(combinedData);
    } catch (_err) {
      toast({
        description: "Failed to load transmitters",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTypes]);

  // Load data when radio types change
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Memoize the unique areas to prevent unnecessary recalculations
  const uniqueAreaServed = useMemo(() => {
    const areas = new Set<string>();
    for (const transmitter of transmittersData) {
      if (transmitter.AreaServed) {
        areas.add(transmitter.AreaServed);
      }
    }
    return Array.from(areas).sort();
  }, [transmittersData]);

  // --- Add state for each filter section ---
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [callSignSearch, setCallSignSearch] = useState("");
  const [areaServedSearch, setAreaServedSearch] = useState("");
  const [licenceAreaSearch, setLicenceAreaSearch] = useState("");
  const [purposeSearch, setPurposeSearch] = useState("");
  const [freqBlockSearch, setFreqBlockSearch] = useState("");
  const [callSignFilters, setCallSignFilters] = useState<string[]>([]);
  const [areaServedFilters, setAreaServedFilters] = useState<string[]>([]);
  const [licenceAreaFilters, setLicenceAreaFilters] = useState<string[]>([]);
  const [purposeFilters, setPurposeFilters] = useState<string[]>([]);
  const [freqBlockFilters, setFreqBlockFilters] = useState<string[]>([]);
  const [minFrequency, setMinFrequency] = useState("");
  const [maxFrequency, setMaxFrequency] = useState("");
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([
    getCombinedFrequencyRange(selectedTypes).min,
    getCombinedFrequencyRange(selectedTypes).max,
  ]);

  // Update frequency range when selected types change
  useEffect(() => {
    const range = getCombinedFrequencyRange(selectedTypes);
    setFrequencyRange([range.min, range.max]);
    setMinFrequency(String(range.min));
    setMaxFrequency(String(range.max));
  }, [selectedTypes]);

  // --- Unique options for each filter ---
  const uniqueCallSigns = useMemo(
    () => [...new Set(transmittersData.map((t) => t.CallSign))].sort(),
    [transmittersData]
  );
  const uniqueLicenceAreas = useMemo(
    () => [...new Set(transmittersData.map((t) => t.LicenceArea))].sort(),
    [transmittersData]
  );
  const uniquePurposes = useMemo(
    () => [...new Set(transmittersData.map((t) => t.Purpose))].sort(),
    [transmittersData]
  );
  const uniqueFreqBlocks = useMemo(
    () =>
      [
        ...new Set(transmittersData
            .map((t) => t.FreqBlock)
            .filter((fb): fb is string => Boolean(fb))),
      ].sort(),
    [transmittersData]
  );

  // --- Counts for each filter ---
  const callSignCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cs of uniqueCallSigns) {
      counts[cs] = transmittersData.filter((t) => t.CallSign === cs).length;
    }
    return counts;
  }, [transmittersData, uniqueCallSigns]);
  const areaServedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const area of uniqueAreaServed) {
      counts[area] = transmittersData.filter(
        (t) => t.AreaServed === area
      ).length;
    }
    return counts;
  }, [transmittersData, uniqueAreaServed]);
  const licenceAreaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const area of uniqueLicenceAreas) {
      counts[area] = transmittersData.filter(
        (t) => t.LicenceArea === area
      ).length;
    }
    return counts;
  }, [transmittersData, uniqueLicenceAreas]);
  const purposeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of uniquePurposes) {
      counts[p] = transmittersData.filter((t) => t.Purpose === p).length;
    }
    return counts;
  }, [transmittersData, uniquePurposes]);
  const freqBlockCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const fb of uniqueFreqBlocks) {
      if (fb) {
        counts[fb] = transmittersData.filter((t) => t.FreqBlock === fb).length;
      }
    }
    return counts;
  }, [transmittersData, uniqueFreqBlocks]);

  // --- Consolidated filtering logic ---
  const filteredTransmitters = useMemo(() => {
    return transmittersData.filter((transmitter) => {
      // Validate coordinates - check for null, undefined, or NaN
      if (
        transmitter.Lat == null ||
        transmitter.Long == null ||
        Number.isNaN(transmitter.Lat) ||
        Number.isNaN(transmitter.Long)
      ) {
        return false;
      }

      // Advanced filter matches
      const callSignMatch =
        callSignFilters.length === 0 ||
        callSignFilters.includes(transmitter.CallSign);
      const areaServedMatch =
        areaServedFilters.length === 0 ||
        areaServedFilters.includes(transmitter.AreaServed);
      const licenceAreaMatch =
        licenceAreaFilters.length === 0 ||
        licenceAreaFilters.includes(transmitter.LicenceArea);
      const purposeMatch =
        purposeFilters.length === 0 ||
        purposeFilters.includes(transmitter.Purpose);
      const freqBlockMatch =
        freqBlockFilters.length === 0 ||
        (transmitter.FreqBlock &&
          freqBlockFilters.includes(transmitter.FreqBlock));
      const frequencyRangeMatch =
        transmitter.Frequency >= frequencyRange[0] &&
        transmitter.Frequency <= frequencyRange[1];

      // Global search match
      const searchMatch =
        globalSearchTerm === "" ||
        (transmitter.CallSign?.toLowerCase().includes(
            globalSearchTerm.toLowerCase()
          )) ||
        (transmitter.AreaServed?.toLowerCase().includes(
            globalSearchTerm.toLowerCase()
          )) ||
        (transmitter.LicenceArea?.toLowerCase().includes(
            globalSearchTerm.toLowerCase()
          )) ||
        (transmitter.Purpose?.toLowerCase().includes(
            globalSearchTerm.toLowerCase()
          )) ||
        (transmitter.FreqBlock?.toLowerCase().includes(
            globalSearchTerm.toLowerCase()
          ));

      return (
        callSignMatch &&
        areaServedMatch &&
        licenceAreaMatch &&
        purposeMatch &&
        freqBlockMatch &&
        frequencyRangeMatch &&
        searchMatch
      );
    });
  }, [
    transmittersData,
    callSignFilters,
    areaServedFilters,
    licenceAreaFilters,
    purposeFilters,
    freqBlockFilters,
    frequencyRange,
    globalSearchTerm,
  ]);

  // Use a ref to store the map instance
  const mapRef = useRef<L.Map | null>(null);

  // Update the map bounds when filtered transmitters change
  useEffect(() => {
    if (mapRef.current && filteredTransmitters.length > 0) {
      const bounds = L.latLngBounds(
        filteredTransmitters.map((t) => [t.Lat, t.Long])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [filteredTransmitters]);

  const handleLocationSearch = async () => {
    if (!searchLocation.trim()) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocation
        )}&countrycodes=au&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const mapElement = document.querySelector(".leaflet-container");
        if (mapElement) {
          const map = (mapElement as unknown as { _leaflet_map: L.Map })
            ._leaflet_map;
          if (map) {
            map.setView([lat, lon], 13);
          }
        }
      } else {
        setSearchError("Location not found");
      }
    } catch (_error) {
      setSearchError("Error searching location");
    } finally {
      setSearchLoading(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <form className="flex items-center gap-2" onSubmit={handleLocationSearch}>
        <Input
          className="h-8 w-40 text-xs"
          disabled={searchLoading}
          onChange={(e) => setSearchLocation(e.target.value)}
          placeholder="Search location..."
          type="text"
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
        className="h-8 w-8"
        disabled={isLoading}
        onClick={handleRefresh}
        size="icon"
        variant="outline"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button
        className="h-8 w-8"
        onClick={() => setShowLegend(!showLegend)}
        size="icon"
        variant="outline"
      >
        <Layers className="h-4 w-4" />
      </Button>
    </div>
  );

  // Helper to reset all filters
  const resetAllFilters = useCallback(() => {
    setCallSignFilters([]);
    setAreaServedFilters([]);
    setLicenceAreaFilters([]);
    setPurposeFilters([]);
    setFreqBlockFilters([]);
    setGlobalSearchTerm("");
    setCallSignSearch("");
    setAreaServedSearch("");
    setLicenceAreaSearch("");
    setPurposeSearch("");
    setFreqBlockSearch("");
    const range = getCombinedFrequencyRange(selectedTypes);
    setFrequencyRange([range.min, range.max]);
    setMinFrequency(String(range.min));
    setMaxFrequency(String(range.max));
  }, [selectedTypes]);

  // --- Sidebar refactor ---
  const sidebar = (
    <SidebarContainer>
      {/* Band Switcher at the very top */}
      <div className="mb-2 flex w-full justify-center gap-2 border-border border-b py-2">
        {(["FM", "AM", "DAB"] as const).map((band) => {
          const isSelected = selectedTypes.includes(band);
          return (
            <button
              className={`rounded border px-3 py-1 font-medium text-xs transition-colors duration-100 ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent"} `}
              key={band}
              onClick={() => {
                setSelectedTypes((prev) =>
                  isSelected ? prev.filter((t) => t !== band) : [...prev, band]
                );
              }}
              type="button"
            >
              {band}
            </button>
          );
        })}
      </div>
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
          onFilterChange={(value) =>
            setCallSignFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setCallSignSearch}
          options={uniqueCallSigns}
          searchValue={callSignSearch}
          showSearch={true}
          title="Call Signs"
        />
        <FilterSection
          counts={areaServedCounts}
          filters={areaServedFilters}
          onFilterChange={(value) =>
            setAreaServedFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setAreaServedSearch}
          options={uniqueAreaServed}
          searchValue={areaServedSearch}
          showSearch={true}
          title="Areas Served"
        />
        <FilterSection
          counts={licenceAreaCounts}
          filters={licenceAreaFilters}
          onFilterChange={(value) =>
            setLicenceAreaFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setLicenceAreaSearch}
          options={uniqueLicenceAreas}
          searchValue={licenceAreaSearch}
          showSearch={true}
          title="Licence Areas"
        />
        <FilterSection
          counts={purposeCounts}
          filters={purposeFilters}
          onFilterChange={(value) =>
            setPurposeFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setPurposeSearch}
          options={uniquePurposes}
          searchValue={purposeSearch}
          showSearch={true}
          title="Purpose"
        />
        <FilterSection
          counts={freqBlockCounts}
          filters={freqBlockFilters}
          onFilterChange={(value) =>
            setFreqBlockFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setFreqBlockSearch}
          options={uniqueFreqBlocks}
          searchValue={freqBlockSearch}
          showSearch={true}
          title="Frequency Block (DAB)"
        />
        {/* Frequency as a FilterSection */}
        <FilterSection
          counts={{}}
          filters={[]}
          onFilterChange={() => {
            // No-op function
          }}
          onSearchChange={() => {
            // No-op function
          }}
          options={[]}
          searchValue={""}
          showSearch={false}
          title="Frequency"
        >
          <div className="mt-2 space-y-2">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="mb-1 text-muted-foreground text-xs">Min.</div>
                <div className="flex items-center gap-1">
                  <Input
                    className="h-8 w-16 text-xs"
                    max={getCombinedFrequencyRange(selectedTypes).max}
                    min={getCombinedFrequencyRange(selectedTypes).min}
                    onChange={(e) => {
                      setMinFrequency(e.target.value);
                      const numValue = Number.parseFloat(e.target.value);
                      if (!Number.isNaN(numValue)) {
                        setFrequencyRange([numValue, frequencyRange[1]]);
                      }
                    }}
                    type="number"
                    value={minFrequency}
                  />
                  <span className="text-muted-foreground text-xs">MHz</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 text-muted-foreground text-xs">Max.</div>
                <div className="flex items-center gap-1">
                  <Input
                    className="h-8 w-16 text-xs"
                    max={getCombinedFrequencyRange(selectedTypes).max}
                    min={getCombinedFrequencyRange(selectedTypes).min}
                    onChange={(e) => {
                      setMaxFrequency(e.target.value);
                      const numValue = Number.parseFloat(e.target.value);
                      if (!Number.isNaN(numValue)) {
                        setFrequencyRange([frequencyRange[0], numValue]);
                      }
                    }}
                    type="number"
                    value={maxFrequency}
                  />
                  <span className="text-muted-foreground text-xs">MHz</span>
                </div>
              </div>
            </div>
            <Slider
              className="w-full"
              max={getCombinedFrequencyRange(selectedTypes).max}
              min={getCombinedFrequencyRange(selectedTypes).min}
              onValueChange={(val) => setFrequencyRange([val[0], val[1]])}
              step={selectedTypes.includes("FM") ? 0.1 : 1}
              value={frequencyRange}
            />
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{frequencyRange[0]} MHz</span>
              <span>{frequencyRange[1]} MHz</span>
            </div>
          </div>
        </FilterSection>
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="w-full text-xs"
          onClick={resetAllFilters}
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

  // Add markerLayerRef for the cluster group
  const markerLayerRef = useRef<L.Layer | null>(null);

  // Imperative marker management for performance
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    // Remove old marker layer if it exists
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
    }

    // Create a new marker cluster group
    const clusterGroup = markerClusterGroup({
      animate: true,
      animateAddingMarkers: true,
      chunkDelay: 50,
      chunkedLoading: true,
      chunkInterval: 100,
      disableClusteringAtZoom: 15,
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 60,
      removeOutsideVisibleBounds: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
    });

    // Add markers imperatively
    for (const t of filteredTransmitters) {
      // Validate coordinates before creating marker
      if (
        typeof t.Lat === "number" &&
        typeof t.Long === "number" &&
        !Number.isNaN(t.Lat) &&
        !Number.isNaN(t.Long) &&
        t.Lat >= -90 &&
        t.Lat <= 90 &&
        t.Long >= -180 &&
        t.Long <= 180
      ) {
        const marker = L.marker([t.Lat, t.Long], {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: ${
              radioTypes.find((rt: RadioType) => rt.name === t.Type)?.color ||
              "#FFEEAD"
            }; width: 12px; height: 12px; border-radius: 50%;"></div>`,
            iconSize: [12, 12],
          }),
        });
        marker.bindPopup(createPopupContent(t));
        clusterGroup.addLayer(marker);
      }
    }

    // Add to map
    clusterGroup.addTo(map);
    markerLayerRef.current = clusterGroup;

    // Clean up on unmount or update
    return () => {
      if (markerLayerRef.current) {
        map.removeLayer(markerLayerRef.current);
      }
    };
  }, [filteredTransmitters]);

  return (
    <SidebarLayout
      actions={headerActions}
      sidebar={sidebar}
      title="Radio Transmitter Map"
    >
      <div className="relative h-full w-full">
        <LeafletMapComponent
          center={[-25.2744, 133.7751]}
          className="size-full"
          maxZoom={18}
          minZoom={3}
          ref={mapRef}
          zoom={4}
        >
          <MapLayers defaultTileLayer="Default">
            <MapTileLayer
              attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
              darkUrl="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={18}
              minZoom={3}
              name="Default"
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
            <MapControls
              bounds={L.latLngBounds(
                filteredTransmitters.map((t) => [t.Lat, t.Long])
              )}
              center={[-25.2744, 133.7751]}
              zoom={4}
            />
            {showLegend && <MapLegend />}
            <MinimapControl />
          </MapLayers>
        </LeafletMapComponent>
      </div>
    </SidebarLayout>
  );
}
