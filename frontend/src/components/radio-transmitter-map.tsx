"use client";

import L from "leaflet";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  ScaleControl,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/leaflet.markercluster.js";

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
  { name: "AM", color: "#FF6B6B" },
  { name: "FM", color: "#4ECDC4" },
  { name: "DAB", color: "#45B7D1" },
  { name: "DRM", color: "#96CEB4" },
  { name: "Other", color: "#FFEEAD" },
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
    html: `<div class="cluster-icon ${size}">${count}</div>`,
    className: "custom-marker-cluster",
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
    <div className="leaflet-top leaflet-left" style={{ marginTop: "60px" }}>
      <div className="leaflet-bar leaflet-control space-y-2">
        <Button
          disabled={!bounds}
          onClick={handleFitBounds}
          size="icon"
          title="Fit to markers"
          variant="outline"
        >
          <Target className="size-4" />
        </Button>
        <Button
          onClick={() => map.setView(center, zoom)}
          size="icon"
          title="Reset view"
          variant="outline"
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
      return { min: 87.5, max: 108 };
    case "AM":
      return { min: 531, max: 1602 };
    case "DAB":
      return { min: 174, max: 240 };
    default:
      return { min: 87.5, max: 108 };
  }
};

// Map Legend Component
function MapLegend() {
  const legendRadioTypes = [
    { name: "FM", color: "#ff0000" },
    { name: "AM", color: "#0000ff" },
    { name: "DAB", color: "#00ff00" },
  ];

  return (
    <div
      className="leaflet-bottom leaflet-left"
      style={{ marginBottom: "20px", marginLeft: "20px" }}
    >
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
        center: map.getCenter(),
        zoom: map.getZoom() - 4,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
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
    <div className="leaflet-control leaflet-bar absolute bottom-4 left-4 z-[1000]">
      <div className="h-32 w-32 rounded-lg border shadow-sm" ref={minimapRef} />
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
  const [selectedType, setSelectedType] = useState<"FM" | "AM" | "DAB">("FM");
  const [filters, setFilters] = useState({
    areas: [] as string[],
    frequency: [87.5, 108] as [number, number],
    power: [0, 50] as [number, number],
  });

  const { theme } = useTheme();

  // Update frequency range when radio type changes
  useEffect(() => {
    const range = getFrequencyRange(selectedType);
    setFilters((prev) => ({
      ...prev,
      frequency: [range.min, range.max],
    }));
  }, [selectedType]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/py/transmitters/${selectedType.toLowerCase()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();

      // Add type information and ensure unique keys
      const typedData = data.map((t: RadioTransmitter) => ({
        ...t,
        Type: selectedType,
        uniqueKey: `${selectedType}-${t.LicenceNo}`,
      }));

      setTransmittersData(typedData);
    } catch (_err) {
      toast({
        title: "Error",
        description: "Failed to load transmitters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  // Load data when radio type changes
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
  const [callSignFilters, setCallSignFilters] = useState<string[]>([]);
  const [areaServedFilters, setAreaServedFilters] = useState<string[]>([]);
  const [licenceAreaFilters, setLicenceAreaFilters] = useState<string[]>([]);
  const [purposeFilters, setPurposeFilters] = useState<string[]>([]);
  const [minFrequency, setMinFrequency] = useState("");
  const [maxFrequency, setMaxFrequency] = useState("");
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([
    getFrequencyRange(selectedType).min,
    getFrequencyRange(selectedType).max,
  ]);

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

  // --- Consolidated filtering logic ---
  const filteredTransmitters = useMemo(() => {
    return transmittersData.filter((transmitter) => {
      // Basic filter matches
      const areaMatch =
        filters.areas.length === 0 ||
        filters.areas.includes(transmitter.AreaServed);
      const frequencyMatch =
        transmitter.Frequency >= filters.frequency[0] &&
        transmitter.Frequency <= filters.frequency[1];

      // Convert MaxERP or TransmitPower to a number for comparison
      const powerStr = transmitter.MaxERP || transmitter.TransmitPower || "0 W";
      const powerValue = Number.parseFloat(powerStr);
      const powerMatch =
        powerValue >= filters.power[0] && powerValue <= filters.power[1];

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
      const frequencyRangeMatch =
        transmitter.Frequency >= frequencyRange[0] &&
        transmitter.Frequency <= frequencyRange[1];

      // Global search match
      const searchMatch =
        globalSearchTerm === "" ||
        transmitter.CallSign.toLowerCase().includes(
          globalSearchTerm.toLowerCase()
        ) ||
        transmitter.AreaServed.toLowerCase().includes(
          globalSearchTerm.toLowerCase()
        ) ||
        transmitter.LicenceArea.toLowerCase().includes(
          globalSearchTerm.toLowerCase()
        ) ||
        transmitter.Purpose.toLowerCase().includes(
          globalSearchTerm.toLowerCase()
        );

      return (
        areaMatch &&
        frequencyMatch &&
        powerMatch &&
        callSignMatch &&
        areaServedMatch &&
        licenceAreaMatch &&
        purposeMatch &&
        frequencyRangeMatch &&
        searchMatch
      );
    });
  }, [
    transmittersData,
    filters,
    callSignFilters,
    areaServedFilters,
    licenceAreaFilters,
    purposeFilters,
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

  // Helper to reset all filters for a band
  const resetAllFilters = useCallback((band: "FM" | "AM" | "DAB") => {
    setCallSignFilters([]);
    setAreaServedFilters([]);
    setLicenceAreaFilters([]);
    setPurposeFilters([]);
    setGlobalSearchTerm("");
    setCallSignSearch("");
    setAreaServedSearch("");
    setLicenceAreaSearch("");
    setPurposeSearch("");
    const range = getFrequencyRange(band);
    setFrequencyRange([range.min, range.max]);
    setMinFrequency(String(range.min));
    setMaxFrequency(String(range.max));
  }, []);

  // When band changes, fetch new data and reset filters
  useEffect(() => {
    handleRefresh();
    resetAllFilters(selectedType);
  }, [selectedType, handleRefresh, resetAllFilters]);

  // --- Sidebar refactor ---
  const sidebar = (
    <SidebarContainer>
      {/* Band Switcher at the very top */}
      <div className="mb-2 flex w-full justify-center gap-2 border-border border-b py-2">
        {["FM", "AM", "DAB"].map((band) => (
          <button
            className={`rounded border px-3 py-1 font-medium text-xs transition-colors duration-100 ${selectedType === band ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent"} `}
            key={band}
            onClick={() => setSelectedType(band as "FM" | "AM" | "DAB")}
            type="button"
          >
            {band}
          </button>
        ))}
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
                    max={getFrequencyRange(selectedType).max}
                    min={getFrequencyRange(selectedType).min}
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
                    max={getFrequencyRange(selectedType).max}
                    min={getFrequencyRange(selectedType).min}
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
              max={getFrequencyRange(selectedType).max}
              min={getFrequencyRange(selectedType).min}
              onValueChange={(val) => setFrequencyRange([val[0], val[1]])}
              step={selectedType === "FM" ? 0.1 : 1}
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
          onClick={() => resetAllFilters(selectedType)}
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
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 15,
      chunkInterval: 100,
      chunkDelay: 50,
      iconCreateFunction: createClusterIcon,
    });

    // Add markers imperatively
    for (const t of filteredTransmitters) {
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
        <MapContainer
          attributionControl={false}
          center={[-25.2744, 133.7751]}
          maxZoom={18}
          minZoom={3}
          preferCanvas={true}
          ref={mapRef}
          style={{ height: "100%", width: "100%" }}
          zoom={4}
          zoomControl={false}
        >
          <TileLayer
            maxZoom={18}
            minZoom={3}
            url={
              theme === "dark"
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
          />
          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" />
          <MapControls
            bounds={L.latLngBounds(
              filteredTransmitters.map((t) => [t.Lat, t.Long])
            )}
            center={[-25.2744, 133.7751]}
            zoom={4}
          />
          {showLegend && <MapLegend />}
          <MinimapControl />
        </MapContainer>
      </div>
    </SidebarLayout>
  );
}
