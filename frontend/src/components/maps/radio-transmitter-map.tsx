"use client";

import L from "leaflet";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

import "@drustack/leaflet.resetview";
import { Card, CardContent } from "@/components/ui/card";
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

// API types
interface RadioServiceBase {
  Callsign: string;
  Operator: string;
  Network: string;
  Frequency: string;
  Purpose: string;
  Polarisation: string;
  AntennaHeight: string;
  MaxERP: string;
  LicenceNo: string;
  LicenceArea: string;
}

interface AmService extends RadioServiceBase {
  DayNight?: string;
}

interface FmService extends RadioServiceBase {}

interface DrService extends RadioServiceBase {
  FreqBlock?: string;
}

interface RadioSite {
  ACMASiteID: number;
  SiteName: string;
  AreaServed: string;
  Lat: string;
  Long: string;
  State: string;
  FMServiceCnt: string;
  AMServiceCnt: string;
  DRServiceCnt: string;
  am: AmService[];
  fm: FmService[];
  dr: DrService[];
}

type RadioServiceType = "AM" | "FM" | "DR";

interface NormalizedRadioService extends RadioServiceBase {
  Type: RadioServiceType;
  DayNight?: string;
  FreqBlock?: string;
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

function getServicesForSite(site: RadioSite): NormalizedRadioService[] {
  const am = (site.am ?? []).map((s) => ({
    ...s,
    DayNight: (s as AmService).DayNight,
    Type: "AM" as RadioServiceType,
  }));
  const fm = (site.fm ?? []).map((s) => ({
    ...s,
    Type: "FM" as RadioServiceType,
  }));
  const dr = (site.dr ?? []).map((s) => ({
    ...s,
    FreqBlock: (s as DrService).FreqBlock,
    Type: "DR" as RadioServiceType,
  }));
  return [...am, ...fm, ...dr];
}

function servicesForSelectedTypes(
  site: RadioSite,
  selected: ("FM" | "AM" | "DAB")[]
): NormalizedRadioService[] {
  const all = getServicesForSite(site);
  const want = new Set<RadioServiceType>();
  if (selected.includes("FM")) {
    want.add("FM");
  }
  if (selected.includes("AM")) {
    want.add("AM");
  }
  if (selected.includes("DAB")) {
    want.add("DR");
  }
  return all.filter((s) => want.has(s.Type));
}

function parseCoord(v: string | number): number {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

interface RadioFilterState {
  callSignFilters: string[];
  areaServedFilters: string[];
  licenceAreaFilters: string[];
  purposeFilters: string[];
  freqBlockFilters: string[];
  networkFilters: string[];
  operatorFilters: string[];
  frequencyRange: [number, number];
  debouncedGlobalSearch: string;
}

function radioSearchMatches(
  s: NormalizedRadioService,
  site: RadioSite,
  q: string
): boolean {
  if (!q) {
    return true;
  }
  const l = q.toLowerCase();
  return (
    s.Callsign?.toLowerCase().includes(l) ||
    site.AreaServed?.toLowerCase().includes(l) ||
    s.LicenceArea?.toLowerCase().includes(l) ||
    s.Purpose?.toLowerCase().includes(l) ||
    s.Network?.toLowerCase().includes(l) ||
    s.Operator?.toLowerCase().includes(l) ||
    (s.FreqBlock?.toLowerCase().includes(l) ?? false)
  );
}

function radioFilterChecksMatch(
  s: NormalizedRadioService,
  site: RadioSite,
  state: RadioFilterState
): boolean {
  if (
    state.callSignFilters.length > 0 &&
    !state.callSignFilters.includes(s.Callsign)
  ) {
    return false;
  }
  if (
    state.areaServedFilters.length > 0 &&
    !state.areaServedFilters.includes(site.AreaServed)
  ) {
    return false;
  }
  if (
    state.licenceAreaFilters.length > 0 &&
    !state.licenceAreaFilters.includes(s.LicenceArea)
  ) {
    return false;
  }
  if (
    state.purposeFilters.length > 0 &&
    !state.purposeFilters.includes(s.Purpose)
  ) {
    return false;
  }
  if (
    state.networkFilters.length > 0 &&
    !state.networkFilters.includes(s.Network)
  ) {
    return false;
  }
  if (
    state.operatorFilters.length > 0 &&
    !state.operatorFilters.includes(s.Operator)
  ) {
    return false;
  }
  return true;
}

function radioServiceMatchesFilters(
  s: NormalizedRadioService,
  site: RadioSite,
  state: RadioFilterState
): boolean {
  const lat = parseCoord(site.Lat);
  const lng = parseCoord(site.Long);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return false;
  }
  const freq = Number.parseFloat(s.Frequency || "0") || 0;
  if (freq < state.frequencyRange[0] || freq > state.frequencyRange[1]) {
    return false;
  }
  if (!radioSearchMatches(s, site, state.debouncedGlobalSearch)) {
    return false;
  }
  if (!radioFilterChecksMatch(s, site, state)) {
    return false;
  }
  const fbOk =
    state.freqBlockFilters.length === 0 ||
    Boolean(s.FreqBlock && state.freqBlockFilters.includes(s.FreqBlock));
  if (!fbOk) {
    return false;
  }
  return true;
}

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
            <span className="text-xs">Radio Transmitter</span>
          </div>
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

const typeLabel = (t: RadioServiceType) => (t === "DR" ? "DAB" : t);

function toggleRowDetails(
  popupElement: HTMLElement,
  detailsId: string,
  index: string
) {
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
}

function createSitePopupContent(
  site: RadioSite,
  services: NormalizedRadioService[]
) {
  const siteName = escapeHtml(site.SiteName || "");
  const areaServed = escapeHtml(site.AreaServed || "");
  const lat = parseCoord(site.Lat);
  const lng = parseCoord(site.Long);
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const sorted = [...services].sort((a, b) => {
    const fa = Number.parseFloat(a.Frequency || "0") || 0;
    const fb = Number.parseFloat(b.Frequency || "0") || 0;
    return fa - fb;
  });

  const rows = sorted
    .map((s, index) => {
      const detailsId = `details-${index}`;
      const purpose = s.Purpose || "";
      const isInactive =
        purpose === "Unallocated" || purpose === "Licenced, Not on Air";
      const rowClass = isInactive
        ? "expandable-row border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors text-gray-400"
        : "expandable-row border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors";
      const detailsCells: string[] = [
        `<div><span class="font-semibold">Operator:</span> ${escapeHtml(s.Operator || "")}</div>`,
        `<div><span class="font-semibold">Purpose:</span> ${escapeHtml(purpose)}</div>`,
        `<div><span class="font-semibold">Polarisation:</span> ${escapeHtml(s.Polarisation || "")}</div>`,
        `<div><span class="font-semibold">Antenna Height:</span> ${s.AntennaHeight ? `${s.AntennaHeight}m` : ""}</div>`,
        `<div><span class="font-semibold">Licence No:</span> ${s.LicenceNo || ""}</div>`,
        `<div><span class="font-semibold">Licence Area:</span> ${escapeHtml(s.LicenceArea || "")}</div>`,
      ];
      if (s.DayNight) {
        detailsCells.push(
          `<div><span class="font-semibold">Day/Night:</span> ${escapeHtml(s.DayNight)}</div>`
        );
      }
      if (s.FreqBlock) {
        detailsCells.push(
          `<div><span class="font-semibold">Freq Block:</span> ${escapeHtml(s.FreqBlock)}</div>`
        );
      }
      const detailsSimple = detailsCells.join("");
      return `
    <tr class="${rowClass}" data-details-id="${detailsId}" data-index="${index}">
      <td class="px-3 py-2 text-left text-sm font-medium">${typeLabel(s.Type)}</td>
      <td class="px-3 py-2 text-left text-sm font-medium">${escapeHtml(s.Callsign)}</td>
      <td class="px-3 py-2 text-right text-sm font-medium">${s.Frequency} MHz</td>
      <td class="px-3 py-2 text-left text-sm">${escapeHtml(s.Network)}</td>
      <td class="px-3 py-2 text-left text-sm">${escapeHtml(s.MaxERP)}</td>
      <td class="px-3 py-2 text-center text-sm">
        <span class="expand-icon" data-icon-id="icon-${index}">▼</span>
      </td>
    </tr>
    <tr id="${detailsId}" class="details-row hidden bg-gray-50 border-b border-gray-200">
      <td colspan="6" class="px-3 py-3">
        <div class="grid grid-cols-2 gap-2 text-xs">${detailsSimple}</div>
      </td>
    </tr>`;
    })
    .join("");

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
        <div class="mt-1 flex items-center gap-2 text-sm flex-wrap">${headerContent}</div>
      </div>
      <div class="max-h-[400px] overflow-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Type</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Callsign</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700 text-right">Freq</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Network</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700">Power</th>
              <th class="px-3 py-2 text-xs font-semibold text-gray-700 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function createSiteMarker(
  site: RadioSite,
  services: NormalizedRadioService[],
  clusterGroup: ReturnType<typeof markerClusterGroup>
) {
  const lat = parseCoord(site.Lat);
  const lng = parseCoord(site.Long);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  const color = "#3b82f6";
  try {
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
        iconSize: [18, 18],
      }),
    });
    marker.bindPopup(createSitePopupContent(site, services), {
      maxHeight: 500,
      maxWidth: 850,
    });
    marker.on("popupopen", () => {
      const popup = marker.getPopup();
      const el = popup?.getElement();
      if (!el) {
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
          toggleRowDetails(el, detailsId, index);
        }
      };
      el.addEventListener("click", handleRowClick);
    });
    clusterGroup.addLayer(marker);
    return true;
  } catch {
    return false;
  }
}

export default function RadioTransmitterMap() {
  const [isLoading, setIsLoading] = useState(true);
  const [sitesData, setSitesData] = useState<RadioSite[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<("FM" | "AM" | "DAB")[]>([
    "AM",
    "DAB",
    "FM",
  ]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/py/transmitters/radio");
      if (!res.ok) {
        throw new Error("Failed to fetch radio transmitter data");
      }
      const data = await res.json();
      setSitesData(data);
    } catch (_err) {
      toast({
        description: "Failed to load transmitters",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const debouncedGlobalSearch = useDebounce(globalSearchTerm, 300);

  const allServices = useMemo(() => {
    const out: { service: NormalizedRadioService; site: RadioSite }[] = [];
    for (const site of sitesData) {
      const svc = servicesForSelectedTypes(site, selectedTypes);
      for (const s of svc) {
        out.push({ service: s, site });
      }
    }
    return out;
  }, [sitesData, selectedTypes]);

  // --- Add state for each filter section ---
  const [callSignSearch, setCallSignSearch] = useState("");
  const [areaServedSearch, setAreaServedSearch] = useState("");
  const [licenceAreaSearch, setLicenceAreaSearch] = useState("");
  const [purposeSearch, setPurposeSearch] = useState("");
  const [freqBlockSearch, setFreqBlockSearch] = useState("");
  const [networkSearch, setNetworkSearch] = useState("");
  const [operatorSearch, setOperatorSearch] = useState("");
  const [callSignFilters, setCallSignFilters] = useState<string[]>([]);
  const [areaServedFilters, setAreaServedFilters] = useState<string[]>([]);
  const [licenceAreaFilters, setLicenceAreaFilters] = useState<string[]>([]);
  const [purposeFilters, setPurposeFilters] = useState<string[]>([]);
  const [freqBlockFilters, setFreqBlockFilters] = useState<string[]>([]);
  const [networkFilters, setNetworkFilters] = useState<string[]>([]);
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
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

  const uniqueAreaServed = useMemo(
    () =>
      [...new Set(sitesData.map((s) => s.AreaServed))]
        .filter(Boolean)
        .sort() as string[],
    [sitesData]
  );
  const uniqueCallSigns = useMemo(
    () =>
      [...new Set(allServices.map(({ service }) => service.Callsign))]
        .filter(Boolean)
        .sort() as string[],
    [allServices]
  );
  const uniqueLicenceAreas = useMemo(
    () =>
      [...new Set(allServices.map(({ service }) => service.LicenceArea))]
        .filter(Boolean)
        .sort() as string[],
    [allServices]
  );
  const uniquePurposes = useMemo(
    () =>
      [...new Set(allServices.map(({ service }) => service.Purpose))]
        .filter(Boolean)
        .sort() as string[],
    [allServices]
  );
  const uniqueFreqBlocks = useMemo(
    () =>
      [
        ...new Set(
          allServices
            .map(({ service }) => service.FreqBlock)
            .filter((fb): fb is string => Boolean(fb))
        ),
      ].sort(),
    [allServices]
  );
  const uniqueNetworks = useMemo(
    () =>
      [...new Set(allServices.map(({ service }) => service.Network))]
        .filter(Boolean)
        .sort() as string[],
    [allServices]
  );
  const uniqueOperators = useMemo(
    () =>
      [...new Set(allServices.map(({ service }) => service.Operator))]
        .filter(Boolean)
        .sort() as string[],
    [allServices]
  );

  const filterState = useMemo<RadioFilterState>(
    () => ({
      areaServedFilters,
      callSignFilters,
      debouncedGlobalSearch,
      freqBlockFilters,
      frequencyRange,
      licenceAreaFilters,
      networkFilters,
      operatorFilters,
      purposeFilters,
    }),
    [
      areaServedFilters,
      callSignFilters,
      debouncedGlobalSearch,
      frequencyRange,
      freqBlockFilters,
      licenceAreaFilters,
      networkFilters,
      operatorFilters,
      purposeFilters,
    ]
  );

  const serviceMatchesFilters = useCallback(
    (s: NormalizedRadioService, site: RadioSite) =>
      radioServiceMatchesFilters(s, site, filterState),
    [filterState]
  );

  const siteMatchesFilters = useCallback(
    (site: RadioSite) => {
      const svc = servicesForSelectedTypes(site, selectedTypes);
      return svc.some((s) => serviceMatchesFilters(s, site));
    },
    [selectedTypes, serviceMatchesFilters]
  );

  const filteredSites = useMemo(
    () => sitesData.filter(siteMatchesFilters),
    [sitesData, siteMatchesFilters]
  );

  const callSignCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const cs of uniqueCallSigns) {
      c[cs] = sitesData.filter((site) =>
        servicesForSelectedTypes(site, selectedTypes).some(
          (s) => s.Callsign === cs
        )
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniqueCallSigns]);
  const areaServedCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const area of uniqueAreaServed) {
      c[area] = sitesData.filter(
        (site) =>
          site.AreaServed === area &&
          servicesForSelectedTypes(site, selectedTypes).length > 0
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniqueAreaServed]);
  const licenceAreaCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const la of uniqueLicenceAreas) {
      c[la] = sitesData.filter((site) =>
        servicesForSelectedTypes(site, selectedTypes).some(
          (s) => s.LicenceArea === la
        )
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniqueLicenceAreas]);
  const purposeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of uniquePurposes) {
      c[p] = sitesData.filter((site) =>
        servicesForSelectedTypes(site, selectedTypes).some(
          (s) => s.Purpose === p
        )
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniquePurposes]);
  const freqBlockCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const fb of uniqueFreqBlocks) {
      c[fb] = sitesData.filter((site) =>
        servicesForSelectedTypes(site, selectedTypes).some(
          (s) => s.FreqBlock === fb
        )
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniqueFreqBlocks]);
  const networkCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const net of uniqueNetworks) {
      c[net] = sitesData.filter((site) =>
        servicesForSelectedTypes(site, selectedTypes).some(
          (s) => s.Network === net
        )
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniqueNetworks]);
  const operatorCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const op of uniqueOperators) {
      c[op] = sitesData.filter((site) =>
        servicesForSelectedTypes(site, selectedTypes).some(
          (s) => s.Operator === op
        )
      ).length;
    }
    return c;
  }, [sitesData, selectedTypes, uniqueOperators]);

  const mapRef = useRef<L.Map | null>(null);

  const bounds = useMemo(() => {
    if (filteredSites.length === 0) {
      return null;
    }
    return L.latLngBounds(
      filteredSites.map((s) => [parseCoord(s.Lat), parseCoord(s.Long)])
    );
  }, [filteredSites]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    if (!bounds) {
      return;
    }
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds]);

  const handleLocationSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) {
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocation
        )}&countrycodes=au&limit=1`
      );
      const data = await res.json();
      if (data?.length > 0) {
        const lat = Number.parseFloat(data[0].lat);
        const lon = Number.parseFloat(data[0].lon);
        setSearchError(null);
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 13);
        }
      } else {
        setSearchError("Location not found");
      }
    } catch {
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
        onClick={() => fetchData()}
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

  const resetAllFilters = useCallback(() => {
    setCallSignFilters([]);
    setAreaServedFilters([]);
    setLicenceAreaFilters([]);
    setPurposeFilters([]);
    setFreqBlockFilters([]);
    setNetworkFilters([]);
    setOperatorFilters([]);
    setGlobalSearchTerm("");
    setCallSignSearch("");
    setAreaServedSearch("");
    setLicenceAreaSearch("");
    setPurposeSearch("");
    setFreqBlockSearch("");
    setNetworkSearch("");
    setOperatorSearch("");
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
          counts={networkCounts}
          filters={networkFilters}
          onFilterChange={(value) =>
            setNetworkFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setNetworkSearch}
          options={uniqueNetworks}
          searchValue={networkSearch}
          showSearch={true}
          title="Networks"
        />
        <FilterSection
          counts={operatorCounts}
          filters={operatorFilters}
          onFilterChange={(value) =>
            setOperatorFilters((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            )
          }
          onSearchChange={setOperatorSearch}
          options={uniqueOperators}
          searchValue={operatorSearch}
          showSearch={true}
          title="Operators"
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
          Showing {filteredSites.length} of {sitesData.length} sites
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  const markerLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }
    if (filteredSites.length === 0) {
      return;
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

    for (const site of filteredSites) {
      const svc = servicesForSelectedTypes(site, selectedTypes).filter((s) =>
        serviceMatchesFilters(s, site)
      );
      if (svc.length > 0 && createSiteMarker(site, svc, clusterGroup)) {
        // marker added
      }
    }

    clusterGroup.addTo(map);
    markerLayerRef.current = clusterGroup;

    return () => {
      if (markerLayerRef.current && map) {
        map.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }
    };
  }, [filteredSites, selectedTypes, serviceMatchesFilters]);

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
              bounds={bounds}
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
