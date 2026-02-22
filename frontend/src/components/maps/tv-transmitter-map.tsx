"use client";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// biome-ignore lint/suspicious/noExplicitAny: Leaflet markercluster types
const markerClusterGroup = (L as any).markerClusterGroup;

import {
  ChevronDown,
  ChevronUp,
  Layers,
  Maximize,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import React from "react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Create popup content for a site: header (site info) + expandable table of services (licences)
const createSitePopupContent = (site: TransmitterSite) => {
  const siteName = escapeHtml(site.SiteName || "");
  const areaServed = escapeHtml(site.AreaServed || "");

  // Sort licences by channel number
  const sortedLicences = [...site.licences].sort((a, b) => {
    const channelA = Number.parseInt(a.Channel || "0", 10) || 0;
    const channelB = Number.parseInt(b.Channel || "0", 10) || 0;
    return channelA - channelB;
  });

  const rows = sortedLicences
    .map((l, index) => {
      const detailsId = `details-${index}`;
      const purpose = l.Purpose || "";
      const isInactive =
        purpose === "Unallocated" || purpose === "Licenced, Not on Air";
      const rowClass = isInactive
        ? "expandable-row border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors text-gray-400"
        : "expandable-row border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors";
      return `
    <tr class="${rowClass}" data-details-id="${detailsId}" data-index="${index}">
      <td class="px-3 py-2 text-left text-sm font-medium">${escapeHtml(l.Callsign)}</td>
      <td class="px-3 py-2 text-left text-sm">${escapeHtml(l.Channel)}</td>
      <td class="px-3 py-2 text-left text-sm">${escapeHtml(l.Network)}</td>
      <td class="px-3 py-2 text-right text-sm font-medium">${l.Frequency} MHz</td>
      <td class="px-3 py-2 text-left text-sm">${escapeHtml(l.MaxERP)}</td>
      <td class="px-3 py-2 text-center text-sm">
        <span class="expand-icon" data-icon-id="icon-${index}">▼</span>
      </td>
    </tr>
    <tr id="${detailsId}" class="details-row hidden bg-gray-50 border-b border-gray-200">
      <td colspan="6" class="px-3 py-3">
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div><span class="font-semibold">Callsign Channel:</span> ${escapeHtml(l.CallsignChannel || "")}</div>
          <div><span class="font-semibold">Operator:</span> ${escapeHtml(l.Operator || "")}</div>
          <div><span class="font-semibold">Purpose:</span> ${escapeHtml(purpose)}</div>
          <div><span class="font-semibold">Polarisation:</span> ${escapeHtml(l.Polarisation || "")}</div>
          <div><span class="font-semibold">Antenna Height:</span> ${l.AntennaHeight ? `${l.AntennaHeight}m` : ""}</div>
          <div><span class="font-semibold">Licence No:</span> ${l.LicenceNo || ""}</div>
          <div><span class="font-semibold">Licence Area:</span> ${escapeHtml(l.LicenceArea || "")}</div>
        </div>
      </td>
    </tr>`;
    })
    .join("");

  const googleMapsUrl = `https://www.google.com/maps?q=${site.Lat},${site.Long}`;
  const headerParts: string[] = [];
  if (areaServed) {
    headerParts.push(`<span class="text-gray-600">${areaServed}</span>`);
  }
  headerParts.push(
    `<span class="text-gray-600">ACMA Site ID: <span class="font-semibold">${site.ACMASiteID}</span></span>`
  );
  headerParts.push(
    `<a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline font-medium">View on Google Maps</a>`
  );
  const headerContent = headerParts.join(
    '<span class="text-gray-400">•</span>'
  );

  return `
    <div class="bg-white shadow-lg rounded-lg min-w-[600px] max-w-[800px] overflow-hidden">
      <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 class="font-bold text-base">${siteName || "Unknown site"}</h3>
        <div class="mt-1 flex items-center gap-2 text-sm flex-wrap">
          ${headerContent}
        </div>
      </div>
      <div class="max-h-[400px] overflow-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Callsign</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Ch</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Network</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700 text-right">Freq</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Power</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
};

// Helper function to validate coordinates
const isValidCoordinate = (value: number | string | null | undefined) => {
  const num =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return !Number.isNaN(num) && typeof num === "number";
};

// Helper function to toggle row details
const toggleRowDetails = (
  popupElement: HTMLElement,
  detailsId: string,
  index: string
) => {
  const detailsRow = popupElement.querySelector(`#${detailsId}`) as HTMLElement;
  const icon = popupElement.querySelector(
    `[data-icon-id="icon-${index}"]`
  ) as HTMLElement;

  if (!detailsRow) {
    return;
  }

  const isHidden = detailsRow.classList.contains("hidden");
  if (isHidden) {
    detailsRow.classList.remove("hidden");
    if (icon) {
      icon.textContent = "▲";
    }
  } else {
    detailsRow.classList.add("hidden");
    if (icon) {
      icon.textContent = "▼";
    }
  }
};

// Helper to create a marker for a site (one per site; popup shows table of services)
const createSiteMarker = (
  site: TransmitterSite,
  clusterGroup: ReturnType<typeof markerClusterGroup>
) => {
  const lat =
    typeof site.Lat === "number"
      ? site.Lat
      : Number.parseFloat(String(site.Lat));
  const lng =
    typeof site.Long === "number"
      ? site.Long
      : Number.parseFloat(String(site.Long));

  if (!isValidCoordinate(lat)) {
    return false;
  }
  if (!isValidCoordinate(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }

  // Use consistent color for all transmitters
  const color = "#3b82f6"; // Blue color for all markers

  try {
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
        iconSize: [18, 18],
      }),
    });
    const popupContent = createSitePopupContent(site);
    marker.bindPopup(popupContent, { maxHeight: 500, maxWidth: 850 });

    // Attach event listeners when popup opens
    marker.on("popupopen", () => {
      const popup = marker.getPopup();
      const popupElement = popup?.getElement();
      if (!popupElement) {
        return;
      }

      const handleRowClick = (e: Event) => {
        const row = (e.target as HTMLElement).closest(
          ".expandable-row"
        ) as HTMLElement;
        if (!row) {
          return;
        }

        const detailsId = row.getAttribute("data-details-id");
        const index = row.getAttribute("data-index");
        if (detailsId && index !== null) {
          toggleRowDetails(popupElement, detailsId, index);
        }
      };

      // Use event delegation on the popup container
      popupElement.addEventListener("click", handleRowClick);
    });

    clusterGroup.addLayer(marker);
    return true;
  } catch {
    return false;
  }
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

// API response structure
interface Licence {
  CallsignChannel: string;
  Callsign: string;
  Operator: string;
  Network: string;
  Frequency: number;
  Purpose: string;
  Polarisation: string;
  AntennaHeight: number;
  MaxERP: string;
  LicenceNo: number;
  Channel: string;
  LicenceArea: string;
}

interface TransmitterSite {
  ACMASiteID: number;
  SiteName: string;
  AreaServed: string;
  Lat: number;
  Long: number;
  State: string;
  ServiceCnt: number;
  licences: Licence[];
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

interface BaseMatchOpts {
  skipCallSign?: boolean;
  skipAreaServed?: boolean;
  skipLicenceArea?: boolean;
  skipOperator?: boolean;
  skipNetwork?: boolean;
}

interface BaseMatchState {
  frequencyRange: [number, number];
  debouncedGlobalSearch: string;
  callSignFilters: string[];
  areaServedFilters: string[];
  licenceAreaFilters: string[];
  operatorFilters: string[];
  networkFilters: string[];
}

function licenceSiteBaseMatch(
  l: Licence,
  s: TransmitterSite,
  opts: BaseMatchOpts,
  state: BaseMatchState
): boolean {
  if (
    s.Lat == null ||
    s.Long == null ||
    Number.isNaN(s.Lat) ||
    Number.isNaN(s.Long)
  ) {
    return false;
  }
  const freqOk =
    l.Frequency != null &&
    !Number.isNaN(l.Frequency) &&
    l.Frequency >= state.frequencyRange[0] &&
    l.Frequency <= state.frequencyRange[1];
  if (!freqOk) {
    return false;
  }
  const q = state.debouncedGlobalSearch.toLowerCase();
  const searchOk =
    state.debouncedGlobalSearch === "" ||
    l.Callsign?.toLowerCase().includes(q) ||
    s.AreaServed?.toLowerCase().includes(q) ||
    l.LicenceArea?.toLowerCase().includes(q) ||
    l.Operator?.toLowerCase().includes(q) ||
    l.Network?.toLowerCase().includes(q);
  if (!searchOk) {
    return false;
  }
  if (
    !opts.skipCallSign &&
    state.callSignFilters.length > 0 &&
    !state.callSignFilters.includes(l.Callsign)
  ) {
    return false;
  }
  if (
    !opts.skipAreaServed &&
    state.areaServedFilters.length > 0 &&
    !state.areaServedFilters.includes(s.AreaServed)
  ) {
    return false;
  }
  if (
    !opts.skipLicenceArea &&
    state.licenceAreaFilters.length > 0 &&
    !state.licenceAreaFilters.includes(l.LicenceArea)
  ) {
    return false;
  }
  if (
    !opts.skipOperator &&
    state.operatorFilters.length > 0 &&
    !state.operatorFilters.includes(l.Operator)
  ) {
    return false;
  }
  if (
    !opts.skipNetwork &&
    state.networkFilters.length > 0 &&
    !state.networkFilters.includes(l.Network)
  ) {
    return false;
  }
  return true;
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
  return (
    <div className="absolute bottom-5 left-5 z-1000">
      <Card className="w-32 rounded-lg border border-border bg-background/90 py-1 shadow-md">
        <CardContent className="p-2">
          <h3 className="mb-1 font-bold text-xs">Transmitters</h3>
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: "#3b82f6" }}
            />
            <span className="text-xs">TV Transmitter</span>
          </div>
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
    <div className="absolute right-20 bottom-16 z-1000">
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
  const [sitesData, setSitesData] = useState<TransmitterSite[]>([]);
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
    sitesData: fetchedSitesData,
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
      setSitesData(fetchedSitesData);
      setGeoJsonData(fetchedGeoJsonData);
      setLocalIsLoading(false);
    }
    if (error) {
      setLocalError(error);
    }
  }, [fetchedSitesData, fetchedGeoJsonData, isLoading, error]);

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

  const filterState = useMemo(
    () => ({
      areaServedFilters,
      callSignFilters,
      debouncedGlobalSearch,
      frequencyRange,
      licenceAreaFilters,
      networkFilters,
      operatorFilters,
    }),
    [
      areaServedFilters,
      callSignFilters,
      debouncedGlobalSearch,
      frequencyRange,
      licenceAreaFilters,
      networkFilters,
      operatorFilters,
    ]
  );

  const licenceMatchesFilters = useCallback(
    (licence: Licence, site: TransmitterSite) =>
      licenceSiteBaseMatch(licence, site, {}, filterState),
    [filterState]
  );

  const siteMatchesFilters = useCallback(
    (site: TransmitterSite) =>
      Array.isArray(site.licences) &&
      site.licences.length > 0 &&
      site.licences.some((l) => licenceMatchesFilters(l, site)),
    [licenceMatchesFilters]
  );

  const filterSites = useCallback(
    (sites: TransmitterSite[]) => sites.filter(siteMatchesFilters),
    [siteMatchesFilters]
  );

  const allLicences = useMemo(
    () =>
      sitesData.flatMap((s) =>
        (s.licences ?? []).map((l) => ({ licence: l, site: s }))
      ),
    [sitesData]
  );

  // Calculate frequency range from actual data
  useEffect(() => {
    if (allLicences.length > 0) {
      const validFrequencies = allLicences
        .map(({ licence }) => licence.Frequency)
        .filter(
          (freq) =>
            freq != null && !Number.isNaN(freq) && typeof freq === "number"
        );
      if (validFrequencies.length > 0) {
        const minFreq = Math.min(...validFrequencies);
        const maxFreq = Math.max(...validFrequencies);
        const calculatedMin = Math.max(0, Math.floor(minFreq));
        const calculatedMax = Math.ceil(maxFreq);
        setFrequencyRange([calculatedMin, calculatedMax]);
        setMinFrequency(String(calculatedMin));
        setMaxFrequency(String(calculatedMax));
      }
    }
  }, [allLicences]);

  const uniqueCallSigns = useMemo(
    () =>
      [...new Set(allLicences.map(({ licence }) => licence.Callsign))]
        .filter(Boolean)
        .sort() as string[],
    [allLicences]
  );
  const uniqueAreaServed = useMemo(
    () =>
      [...new Set(sitesData.map((s) => s.AreaServed))].filter(Boolean).sort(),
    [sitesData]
  );
  const uniqueLicenceAreas = useMemo(
    () =>
      [...new Set(allLicences.map(({ licence }) => licence.LicenceArea))]
        .filter(Boolean)
        .sort() as string[],
    [allLicences]
  );
  const uniqueOperators = useMemo(
    () =>
      [...new Set(allLicences.map(({ licence }) => licence.Operator))]
        .filter(Boolean)
        .sort() as string[],
    [allLicences]
  );
  const uniqueNetworks = useMemo(
    () =>
      [...new Set(allLicences.map(({ licence }) => licence.Network))]
        .filter(Boolean)
        .sort() as string[],
    [allLicences]
  );

  type LicenceSitePred = (l: Licence, s: TransmitterSite) => boolean;

  const countSitesWithMatchingLicence = useCallback(
    (pred: LicenceSitePred) => {
      const seen = new Set<number>();
      for (const site of sitesData) {
        const match = site.licences?.some((l) => pred(l, site));
        if (match) {
          seen.add(site.ACMASiteID);
        }
      }
      return seen.size;
    },
    [sitesData]
  );

  const baseMatch = useCallback(
    (opts: BaseMatchOpts) => (l: Licence, s: TransmitterSite) =>
      licenceSiteBaseMatch(l, s, opts, filterState),
    [filterState]
  );

  const callSignCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const match = baseMatch({ skipCallSign: true });
    for (const callSign of uniqueCallSigns) {
      counts[callSign] = countSitesWithMatchingLicence(
        (l, s) => l.Callsign === callSign && match(l, s)
      );
    }
    return counts;
  }, [uniqueCallSigns, countSitesWithMatchingLicence, baseMatch]);

  const areaServedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const match = baseMatch({ skipAreaServed: true });
    for (const area of uniqueAreaServed) {
      counts[area] = countSitesWithMatchingLicence(
        (l, s) => s.AreaServed === area && match(l, s)
      );
    }
    return counts;
  }, [uniqueAreaServed, countSitesWithMatchingLicence, baseMatch]);

  const licenceAreaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const match = baseMatch({ skipLicenceArea: true });
    for (const area of uniqueLicenceAreas) {
      counts[area] = countSitesWithMatchingLicence(
        (l, s) => l.LicenceArea === area && match(l, s)
      );
    }
    return counts;
  }, [uniqueLicenceAreas, countSitesWithMatchingLicence, baseMatch]);

  const operatorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const match = baseMatch({ skipOperator: true });
    for (const op of uniqueOperators) {
      counts[op] = countSitesWithMatchingLicence(
        (l, s) => l.Operator === op && match(l, s)
      );
    }
    return counts;
  }, [uniqueOperators, countSitesWithMatchingLicence, baseMatch]);

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const match = baseMatch({ skipNetwork: true });
    for (const net of uniqueNetworks) {
      counts[net] = countSitesWithMatchingLicence(
        (l, s) => l.Network === net && match(l, s)
      );
    }
    return counts;
  }, [uniqueNetworks, countSitesWithMatchingLicence, baseMatch]);

  const filteredSites = useMemo(
    () => filterSites(sitesData),
    [sitesData, filterSites]
  );

  const bounds = useMemo(() => {
    if (filteredSites.length === 0) {
      return null;
    }
    return L.latLngBounds(filteredSites.map((s) => [s.Lat, s.Long]));
  }, [filteredSites]);

  // Fit map to bounds on initial load and when filteredSites changes
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    if (!bounds) {
      return;
    }
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
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

      const sites = await transmittersResponse.json();
      const geoJsonDataResult = await geoJsonResponse.json();

      setSitesData(sites);
      setGeoJsonData(geoJsonDataResult);
      setLocalError(null);

      toast({
        description: `Loaded ${sites.length} sites.`,
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
          Showing {filteredSites.length} of {sitesData.length} sites
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // Add markerLayerRef for the cluster group
  const markerLayerRef = useRef<L.Layer | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  // Imperative marker management for performance (one marker per site)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || filteredSites.length === 0) {
      return;
    }

    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }

    const clusterGroup = markerClusterGroup({
      animate: true,
      animateAddingMarkers: true,
      chunkDelay: 50,
      chunkedLoading: true,
      chunkInterval: 100,
      disableClusteringAtZoom: 12,
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 40,
      removeOutsideVisibleBounds: true,
      showCoverageOnHover: true,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
    });

    let markerCount = 0;
    for (const site of filteredSites) {
      if (createSiteMarker(site, clusterGroup)) {
        markerCount++;
      }
    }

    if (markerCount > 0) {
      clusterGroup.addTo(map);
      markerLayerRef.current = clusterGroup;
    }

    return () => {
      if (markerLayerRef.current && map) {
        map.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }
    };
  }, [filteredSites]);

  // Handle search result marker imperatively
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    // Remove old search marker if it exists
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    // Add new search marker if searchResult exists
    if (searchResult) {
      const searchMarker = L.marker([searchResult.lat, searchResult.lon], {
        icon: L.divIcon({
          className: "custom-marker-container",
          html: `<div class='custom-marker custom-marker-drop' style='background-color:#3b82f6;border:2px solid white;width:22px;height:22px;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.2);'></div>`,
          iconSize: L.point(22, 22, true),
        }),
      });
      searchMarker.bindPopup(searchResult.display_name);
      searchMarker.addTo(map);
      searchMarkerRef.current = searchMarker;
    }

    // Clean up on unmount or update
    return () => {
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
      }
    };
  }, [searchResult]);

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
          </MapLayers>
        </LeafletMapComponent>
        {selectedArea && (
          <div className="absolute top-4 right-4 z-1000 rounded bg-background p-2 shadow-sm">
            <p className="font-medium text-sm">Selected Area: {selectedArea}</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

// Custom hook for data fetching (returns sites; one marker per site)
function useTransmitterData() {
  const [sitesData, setSitesData] = useState<TransmitterSite[]>([]);
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
      .then(([sites, geoJsonDataResult]) => {
        setSitesData(sites);
        setGeoJsonData(geoJsonDataResult);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        setError(fetchError.message);
        setIsLoading(false);
      });
  }, []);

  return { error, geoJsonData, isLoading, sitesData };
}
