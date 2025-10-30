"use client";

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FilterSection } from "@/components/filter-section";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import {
  ChannelCard,
  LocationSelector,
  ViewModeToggle,
} from "@/components/freeview-channel-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  abbreviateText as abbreviateTextUtil,
  stateAbbreviations,
} from "@/lib/abbreviation-utils";
import { deslugifyRegion, slugifyRegion } from "@/lib/slugify";
import { channelSpecColors } from "@/lib/ticker-constants";

// Define the ChannelData type that matches the API response structure
type ChannelData = {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_number: string;
  channel_group: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  other_data?: {
    channel_type?: string;
    channel_specs?: string;
  };
  channel_network?: string;
};

type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: ChannelData[];
  };
};

type SourceData = {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo: {
    light: string;
    dark: string;
  };
};

type AdditionalSourceMapping = {
  sourceId: string;
  additionalRegions: string[];
  customLocationName?: string;
};

type MergedCell = {
  startIndex: number;
  endIndex: number;
  channel: ChannelData | null; // Allow null for empty cells
};

// Custom hook to manage all the state and logic
function useChannelMapData() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sources, setSources] = useState<SourceData[]>([]);
  const [allSources, setAllSources] = useState<SourceData[]>([]);
  const [channelData, setChannelData] = useState<Record<string, ChannelData[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkGroups, setNetworkGroups] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>(
    []
  );
  const [selectedChannelSpecs, setSelectedChannelSpecs] = useState<string[]>(
    []
  );
  const [networkSearch, setNetworkSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [specsSearch, setSpecsSearch] = useState("");
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [collapsedNetworks, setCollapsedNetworks] = useState<
    Record<string, boolean>
  >({});
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>("");
  const [visibleLocations, setVisibleLocations] = useState<string[]>([]);
  const [expandedChannels, setExpandedChannels] = useState<
    Record<string, boolean>
  >({});
  const [viewMode, setViewMode] = useState<"networks" | "flat">("networks");
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const isMobile = useIsMobile();
  const debouncedGlobalSearch = useDebounce(globalFilter, 300);

  // Helper function to get background color based on channel specs
  const getChannelColor = useCallback((specs?: string): string => {
    if (!specs) {
      return "bg-background";
    }

    const spec = specs.toLowerCase();
    if (spec.includes("hd") && spec.includes("mpeg-4")) {
      return channelSpecColors.hdMpeg4;
    }
    if (spec.includes("hd") && spec.includes("mpeg-2")) {
      return channelSpecColors.hdMpeg2;
    }
    if (spec.includes("sd") && spec.includes("mpeg-4")) {
      return channelSpecColors.sdMpeg4;
    }
    if (spec.includes("sd") && spec.includes("mpeg-2")) {
      return channelSpecColors.sdMpeg2;
    }
    if (spec.includes("radio")) {
      return channelSpecColors.radio;
    }

    return "bg-background";
  }, []);

  // Helper function to abbreviate state names
  const abbreviateChannelName = useCallback((channelName: string): string => {
    try {
      return abbreviateTextUtil(channelName, stateAbbreviations);
    } catch (_error) {
      // Fallback if import fails
      return channelName;
    }
  }, []);

  // Wrapper function to match the expected signature for render functions
  const abbreviateText = useCallback(
    (channelName: string, _abbreviations: Record<string, string>): string =>
      abbreviateChannelName(channelName),
    [abbreviateChannelName]
  );

  // Wrapper function for ChannelCard component that expects single parameter
  const abbreviateStateName = useCallback(
    (channelName: string): string => abbreviateChannelName(channelName),
    [abbreviateChannelName]
  );

  // Function to update URL parameters
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // Function to set selected subgroup with URL update
  const setSelectedSubgroupWithUrl = useCallback(
    (subgroup: string) => {
      setSelectedSubgroup(subgroup);
      updateUrlParams({ region: slugifyRegion(subgroup) });
    },
    [updateUrlParams]
  );

  // Function to set view mode with URL update
  const setViewModeWithUrl = useCallback(
    (mode: "networks" | "flat") => {
      setViewMode(mode);
      updateUrlParams({ layout: mode });
    },
    [updateUrlParams]
  );

  // Get unique subgroups from sources
  const getUniqueSubgroups = useCallback(
    (sourceList: SourceData[]): string[] => {
      const subgroups = new Set<string>();
      for (const source of sourceList) {
        subgroups.add(source.subgroup);
      }
      return Array.from(subgroups).sort();
    },
    []
  );

  // Read URL parameters on mount (after getUniqueSubgroups is defined)
  useEffect(() => {
    const urlRegion = searchParams.get("region");
    const urlLayout = searchParams.get("layout") as "networks" | "flat" | null;

    if (urlRegion) {
      // Convert slug back to region name and find matching subgroup
      const deslugifiedRegion = deslugifyRegion(urlRegion);
      const subgroups = getUniqueSubgroups(sources);
      const matchingSubgroup = subgroups.find(
        (subgroup) =>
          slugifyRegion(subgroup) === urlRegion ||
          subgroup === deslugifiedRegion
      );

      if (matchingSubgroup) {
        setSelectedSubgroup(matchingSubgroup);
      }
    }

    if (urlLayout && (urlLayout === "networks" || urlLayout === "flat")) {
      setViewMode(urlLayout);
    }
  }, [searchParams, sources, getUniqueSubgroups]);

  // Fetch sources on initial load
  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/py/sources");
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.status}`);
      }

      const allSourcesData: SourceData[] = await response.json();
      setAllSources(allSourcesData);

      // Filter sources based on criteria
      const filteredSources = allSourcesData.filter(
        (source) =>
          source.group === "Australia" &&
          source.subgroup.includes("FTA") &&
          !source.subgroup.includes("Streaming") &&
          !source.subgroup.includes("All Regions") &&
          !source.subgroup.includes("by Network") &&
          !source.location.includes("Regional News") &&
          !source.location.includes("ABC/SBS - All States")
      );

      setSources(filteredSources);

      // Set the first subgroup as selected by default
      const subgroups = getUniqueSubgroups(filteredSources);
      if (subgroups.length > 0) {
        setSelectedSubgroup(subgroups[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [getUniqueSubgroups]);

  // Helper function to get additional sources for a subgroup
  const getAdditionalSourcesForSubgroup = useCallback(
    (subgroup: string): SourceData[] => {
      const additionalSources: SourceData[] = [];

      // Define additional source mappings - only specify regions where the source should appear ADDITIONALLY
      const additionalSourceMappings: AdditionalSourceMapping[] = [
        {
          additionalRegions: ["FTA - Regional NSW"],
          customLocationName: "NNSW/QLD - Gold Coast", // Only appears in NSW in addition to its original region
          sourceId: "xmlepg_FTAGOL",
        },
        {
          additionalRegions: ["FTA - Regional NSW"],
          customLocationName: "SNSW/VIC - Albury/Wodonga", // Appears in NSW and VIC in addition to its original region
          sourceId: "xmlepg_FTAALB",
        },
        {
          additionalRegions: ["FTA - Regional SA"],
          customLocationName: "Broken Hill", // Appears in NSW and VIC in addition to its original region
          sourceId: "xmlepg_FTABRO",
        },
        {
          additionalRegions: ["FTA - Regional NSW"],
          customLocationName: "SNSW/ACT - ACT / Canberra", // Appears in NSW and VIC in addition to its original region
          sourceId: "xmlepg_FTACAN",
        },
        // Add more mappings here as needed
      ];

      // Check if any additional sources should be included in this subgroup
      for (const mapping of additionalSourceMappings) {
        if (mapping.additionalRegions.includes(subgroup)) {
          const additionalSource = allSources.find(
            (source) => source.id === mapping.sourceId
          );
          if (additionalSource) {
            additionalSources.push({
              ...additionalSource,
              location: mapping.customLocationName || additionalSource.location,
              subgroup: additionalSource.subgroup,
            });
          }
        }
      }

      return additionalSources;
    },
    [allSources]
  );

  const fetchChannelDataForSubgroup = useCallback(
    async (subgroup: string) => {
      try {
        setLoading(true);
        setError(null);

        // Get all sources for this subgroup
        const subgroupSources = sources.filter(
          (source) => source.subgroup === subgroup
        );

        // Add VAST source if this is a regional subgroup
        const vastSources: SourceData[] = [];
        const stateVastMapping: Record<string, string> = {
          "FTA - Regional ACT": "xmlepg_VASTACT",
          "FTA - Regional NSW": "xmlepg_VASTNSW",
          "FTA - Regional NT": "xmlepg_VASTNT",
          "FTA - Regional QLD": "xmlepg_VASTQLD",
          "FTA - Regional SA": "xmlepg_VASTSA",
          "FTA - Regional TAS": "xmlepg_VASTTAS",
          "FTA - Regional VIC": "xmlepg_VASTVIC",
          "FTA - Regional WA": "xmlepg_VASTWA",
        };

        const vastSourceId = stateVastMapping[subgroup];
        if (vastSourceId) {
          const vastSource = allSources.find(
            (source) => source.id === vastSourceId
          );
          if (vastSource) {
            vastSources.push({
              ...vastSource,
              location: "VAST (Regional & Remote, Satellite)",
              subgroup: vastSource.subgroup,
            });
          }
        }

        // Get additional sources for this subgroup
        const additionalSources = getAdditionalSourcesForSubgroup(subgroup);

        // Combine subgroup sources with VAST sources and additional sources
        const allSourcesToFetch = [
          ...subgroupSources,
          ...vastSources,
          ...additionalSources,
        ];

        // Reset channel data
        setChannelData({});

        // Fetch channel data for each source using Promise.all for concurrent requests
        const channelDataMap: Record<string, ChannelData[]> = {};
        const allNetworks = new Set<string>();

        const fetchPromises = allSourcesToFetch.map(async (source) => {
          const response = await fetch(`/api/py/channels/${source.id}`);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch data for ${source.location}: ${response.status}`
            );
          }

          const data: ApiResponse = await response.json();

          // Use location as the key instead of state code
          channelDataMap[source.location] = data.data.channels;

          // Collect all network groups
          for (const channel of data.data.channels) {
            if (channel.channel_group) {
              allNetworks.add(channel.channel_group);
            }
          }

          return { data, source };
        });

        await Promise.all(fetchPromises);

        setChannelData(channelDataMap);
        setNetworkGroups(Array.from(allNetworks).sort());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    },
    [sources, allSources, getAdditionalSourcesForSubgroup]
  );

  // Toggle network collapse state
  const toggleNetworkCollapse = (network: string) => {
    setCollapsedNetworks((prev) => ({
      ...prev,
      [network]: !prev[network],
    }));
  };

  // Toggle channel expansion for mobile view
  const toggleChannelExpansion = (channelKey: string) => {
    setExpandedChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  };

  // Toggle collapse all networks
  const toggleAllNetworks = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    for (const network of Object.keys(filteredChannelMap)) {
      newState[network] = collapse;
    }
    setCollapsedNetworks(newState);
  };

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebarCollapsed",
      desktopSidebarCollapsed.toString()
    );
  }, [desktopSidebarCollapsed]);

  // Fetch sources on initial load
  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Fetch channel data when subgroup changes
  useEffect(() => {
    if (selectedSubgroup) {
      fetchChannelDataForSubgroup(selectedSubgroup);
    }
  }, [selectedSubgroup, fetchChannelDataForSubgroup]);

  // Update visible locations when locations change
  const locationsForSubgroup = useMemo(() => {
    // Get locations from sources
    const sourceLocations = sources
      .filter((source) => source.subgroup === selectedSubgroup)
      .map((source) => source.location);

    // Get additional sources for this subgroup
    const additionalSources = getAdditionalSourcesForSubgroup(selectedSubgroup);
    const additionalSourceLocations = additionalSources.map(
      (source) => source.location
    );

    // Get locations from channel data (includes VAST and additional sources)
    const channelDataLocations = Object.keys(channelData).map((location) =>
      location === "VAST" ? location : location
    );

    // Combine and deduplicate locations
    const allLocations = [
      ...new Set([
        ...sourceLocations,
        ...additionalSourceLocations,
        ...channelDataLocations,
      ]),
    ];

    return allLocations.sort((a, b) => a.localeCompare(b));
  }, [sources, selectedSubgroup, channelData, getAdditionalSourcesForSubgroup]);

  useEffect(() => {
    setVisibleLocations(locationsForSubgroup);
  }, [locationsForSubgroup]);

  // Helper function to collect all unique channel numbers by network
  const collectNetworksAndChannelNumbers = useCallback(() => {
    const networks: Record<string, Set<string>> = {};

    for (const [_location, channels] of Object.entries(channelData)) {
      for (const channel of channels) {
        const network = channel.channel_group || "Other";
        if (!networks[network]) {
          networks[network] = new Set();
        }

        // Use channel number as the identifier
        if (channel.channel_number) {
          networks[network].add(channel.channel_number);
        }
      }
    }

    return networks;
  }, [channelData]);

  // Helper function to organize channels by network, channel number, and location
  const organizeChannelsByNetwork = useCallback(
    (networks: Record<string, Set<string>>) => {
      const channelMap: Record<
        string,
        Record<string, Record<string, ChannelData>>
      > = {};

      for (const [network, channelNumbers] of Object.entries(networks)) {
        channelMap[network] = {};

        for (const channelNumber of channelNumbers) {
          channelMap[network][channelNumber] = {};

          // Find this channel number in each location
          for (const [location, channels] of Object.entries(channelData)) {
            // Find channels with matching number and network
            const matchingChannels = channels.filter(
              (c) =>
                c.channel_number === channelNumber &&
                c.channel_group === network
            );

            // If multiple channels match, use the first one
            if (matchingChannels.length > 0) {
              channelMap[network][channelNumber][location] =
                matchingChannels[0];
            }
          }
        }
      }

      return channelMap;
    },
    [channelData]
  );

  // Helper function to sort networks alphabetically
  const sortNetworksAlphabetically = useCallback(
    (
      channelMap: Record<string, Record<string, Record<string, ChannelData>>>
    ) => {
      const sortedChannelMap: Record<
        string,
        Record<string, Record<string, ChannelData>>
      > = {};

      for (const network of Object.keys(channelMap).sort((a, b) =>
        a.localeCompare(b)
      )) {
        sortedChannelMap[network] = channelMap[network];
      }

      return sortedChannelMap;
    },
    []
  );

  // Group channels by network and channel number
  const getChannelMap = useCallback(() => {
    const networks = collectNetworksAndChannelNumbers();
    const channelMap = organizeChannelsByNetwork(networks);
    return sortNetworksAlphabetically(channelMap);
  }, [
    collectNetworksAndChannelNumbers,
    organizeChannelsByNetwork,
    sortNetworksAlphabetically,
  ]);

  // Helper function to create a placeholder channel object
  const createPlaceholderChannel = useCallback(
    (channelName: string): ChannelData => ({
      channel_group: "",
      channel_id: "",
      channel_logo: { dark: "", light: "" },
      channel_name: channelName,
      channel_names: {
        clean: channelName,
        location: channelName,
        real: channelName,
      },
      channel_number: "",
      channel_slug: "",
    }),
    []
  );

  // Helper function to end a current merge and add it to mergedCells
  const endCurrentMerge = useCallback(
    (
      mergedCells: MergedCell[],
      currentMergeStart: number,
      endIndex: number,
      currentChannelName: string | null
    ): void => {
      if (currentMergeStart !== -1) {
        mergedCells.push({
          channel: currentChannelName
            ? createPlaceholderChannel(currentChannelName)
            : null,
          endIndex,
          startIndex: currentMergeStart,
        });
      }
    },
    [createPlaceholderChannel]
  );

  // Helper function to handle a location that has a channel
  const handleLocationWithChannel = useCallback(
    ({
      location,
      locationChannels,
      i,
      currentMergeStart,
      currentChannelName,
      mergedCells,
    }: {
      location: string;
      locationChannels: Record<string, ChannelData>;
      i: number;
      currentMergeStart: number;
      currentChannelName: string | null;
      mergedCells: MergedCell[];
    }): { newMergeStart: number; newChannelName: string | null } => {
      const channel = locationChannels[location];
      const channelName =
        channel.channel_names.location || channel.channel_name;

      // If we're not in a merge or the channel name is different, start a new merge
      if (currentMergeStart === -1 || channelName !== currentChannelName) {
        // If we were in a merge, end it
        endCurrentMerge(
          mergedCells,
          currentMergeStart,
          i - 1,
          currentChannelName
        );

        // Start a new merge
        return { newChannelName: channelName, newMergeStart: i };
      }

      // If the channel name is the same, continue the current merge
      return {
        newChannelName: currentChannelName,
        newMergeStart: currentMergeStart,
      };
    },
    [endCurrentMerge]
  );

  // Helper function to handle a location that doesn't have a channel
  const handleLocationWithoutChannel = useCallback(
    (
      i: number,
      currentMergeStart: number,
      currentChannelName: string | null,
      mergedCells: MergedCell[]
    ): { newMergeStart: number; newChannelName: string | null } => {
      // If we're in a merge, check if we should end it
      if (currentMergeStart !== -1) {
        // End the current merge
        endCurrentMerge(
          mergedCells,
          currentMergeStart,
          i - 1,
          currentChannelName
        );

        // Start a new "Not available" merge
        return { newChannelName: null, newMergeStart: i };
      }

      // Start a new "Not available" merge
      return { newChannelName: null, newMergeStart: i };
    },
    [endCurrentMerge]
  );

  // Function to determine which cells can be merged
  const getMergedCells = useCallback(
    (
      locationChannels: Record<string, ChannelData>,
      filteredLocations: string[]
    ): MergedCell[] => {
      const mergedCells: MergedCell[] = [];
      const locationsWithChannels = new Set(Object.keys(locationChannels));

      let currentMergeStart = -1;
      let currentChannelName: string | null = null;

      for (let i = 0; i < filteredLocations.length; i++) {
        const location = filteredLocations[i];
        const hasChannel = locationsWithChannels.has(location);

        if (hasChannel) {
          const result = handleLocationWithChannel({
            currentChannelName,
            currentMergeStart,
            i,
            location,
            locationChannels,
            mergedCells,
          });
          currentMergeStart = result.newMergeStart;
          currentChannelName = result.newChannelName;
        } else {
          const result = handleLocationWithoutChannel(
            i,
            currentMergeStart,
            currentChannelName,
            mergedCells
          );
          currentMergeStart = result.newMergeStart;
          currentChannelName = result.newChannelName;
        }
      }

      // Add the last merge if there is one
      endCurrentMerge(
        mergedCells,
        currentMergeStart,
        filteredLocations.length - 1,
        currentChannelName
      );

      return mergedCells;
    },
    [handleLocationWithChannel, handleLocationWithoutChannel, endCurrentMerge]
  );

  // Helper function to render a channel cell
  const renderChannelCell = useCallback(
    ({
      mergedCell,
      locationChannels,
      filteredLocations,
      locationIndex,
      location,
      colspan,
    }: {
      mergedCell: MergedCell;
      locationChannels: Record<string, ChannelData>;
      filteredLocations: string[];
      locationIndex: number;
      location: string;
      colspan: number;
    }) => {
      // This is a channel cell - find the actual channel data for logo
      const actualChannel = locationChannels[filteredLocations[locationIndex]];
      const logoUrl = actualChannel?.channel_logo?.light || "";

      // Get the channel name and apply abbreviation
      const channelName =
        mergedCell.channel?.channel_names.location ||
        mergedCell.channel?.channel_name ||
        "";
      const abbreviatedChannelName = abbreviateChannelName(channelName);

      // Get background color based on channel specs
      const backgroundColor = getChannelColor(
        actualChannel?.other_data?.channel_specs
      );

      return (
        <TableCell
          className={`whitespace-normal border py-2 text-center ${backgroundColor}`}
          colSpan={colspan}
          key={`location-${location}`}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            {logoUrl && (
              <div className="flex size-10 items-center justify-center rounded-md bg-muted/50">
                <img
                  alt=""
                  className="max-h-full max-w-full object-contain p-1"
                  height={32}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=32&width=32";
                  }}
                  src={logoUrl || "/placeholder.svg"}
                  width={32}
                />
              </div>
            )}
            <div className="font-medium text-xs">{abbreviatedChannelName}</div>
          </div>
        </TableCell>
      );
    },
    [abbreviateChannelName, getChannelColor]
  );

  // Helper function to render a "not available" cell
  const renderNotAvailableCell = useCallback(
    (location: string, colspan: number) => (
      <TableCell
        className="whitespace-normal border bg-muted/50 py-2 text-center"
        colSpan={colspan}
        key={`location-${location}`}
      >
        <span className="text-muted-foreground text-xs">Not available</span>
      </TableCell>
    ),
    []
  );

  // Render a row with merged cells
  const renderChannelRow = useCallback(
    (
      network: string,
      channelNumber: string,
      locationChannels: Record<string, ChannelData>
    ) => {
      const filteredLocations = locationsForSubgroup.filter((loc) =>
        visibleLocations.includes(loc)
      );
      const mergedCells = getMergedCells(locationChannels, filteredLocations);

      return (
        <TableRow
          className="hover:bg-muted/50"
          key={`${network}-${channelNumber}`}
        >
          <TableCell className="sticky left-0 z-10 w-[100px] min-w-[100px] border bg-background py-2 font-medium shadow-sm">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="font-medium">Ch {channelNumber}</div>
              </div>
            </div>
          </TableCell>

          {/* Render each location column */}
          {filteredLocations.map((location, locationIndex) => {
            // Find the merged cell that contains this location index
            const mergedCell = mergedCells.find(
              (cell) =>
                locationIndex >= cell.startIndex &&
                locationIndex <= cell.endIndex
            );

            // If we found a merged cell and this is the first location in the merged range,
            // render it with the appropriate colspan
            if (mergedCell && locationIndex === mergedCell.startIndex) {
              const colspan = mergedCell.endIndex - mergedCell.startIndex + 1;

              if (mergedCell.channel) {
                return renderChannelCell({
                  colspan,
                  filteredLocations,
                  location,
                  locationChannels,
                  locationIndex,
                  mergedCell,
                });
              }

              return renderNotAvailableCell(location, colspan);
            }

            if (!mergedCell || locationIndex !== mergedCell.startIndex) {
              // Skip this cell as it's part of a colspan
              return null;
            }

            // Fallback - should not reach here
            return (
              <TableCell
                className="border text-center"
                key={`location-${location}`}
              >
                <span className="text-muted-foreground text-xs">Error</span>
              </TableCell>
            );
          })}
        </TableRow>
      );
    },
    [
      locationsForSubgroup,
      visibleLocations,
      getMergedCells,
      renderChannelCell,
      renderNotAvailableCell,
    ]
  );

  // Get all unique channel types and specs
  const channelTypes = useMemo(() => {
    const types = new Set<string>();
    for (const channels of Object.values(channelData)) {
      for (const channel of channels) {
        if (channel.other_data?.channel_type) {
          types.add(channel.other_data.channel_type);
        }
      }
    }
    return Array.from(types).sort();
  }, [channelData]);

  const channelSpecs = useMemo(() => {
    const specs = new Set<string>();
    for (const channels of Object.values(channelData)) {
      for (const channel of channels) {
        if (channel.other_data?.channel_specs) {
          specs.add(channel.other_data.channel_specs);
        }
      }
    }
    return Array.from(specs).sort();
  }, [channelData]);

  // Helper function to check if a channel matches the current filters
  const channelMatchesFilters = useCallback(
    (channel: ChannelData): boolean => {
      // Filter by channel type
      if (
        selectedChannelTypes.length > 0 &&
        !(
          channel.other_data?.channel_type &&
          selectedChannelTypes.includes(channel.other_data.channel_type)
        )
      ) {
        return false;
      }

      // Filter by channel specs
      if (
        selectedChannelSpecs.length > 0 &&
        !(
          channel.other_data?.channel_specs &&
          selectedChannelSpecs.includes(channel.other_data.channel_specs)
        )
      ) {
        return false;
      }

      // Filter by search term
      if (debouncedGlobalSearch) {
        const searchTerm = debouncedGlobalSearch.toLowerCase();
        return (
          channel.channel_name.toLowerCase().includes(searchTerm) ||
          channel.channel_names.real.toLowerCase().includes(searchTerm) ||
          channel.channel_number.toLowerCase().includes(searchTerm) ||
          channel.channel_group.toLowerCase().includes(searchTerm) ||
          (channel.other_data?.channel_type || "")
            .toLowerCase()
            .includes(searchTerm) ||
          (channel.other_data?.channel_specs || "")
            .toLowerCase()
            .includes(searchTerm)
        );
      }

      return true;
    },
    [selectedChannelTypes, selectedChannelSpecs, debouncedGlobalSearch]
  );

  // Helper function to check if any filters are active
  const hasActiveFilters = useCallback(
    (
      searchFilter: string,
      networksFilter: string[],
      typesFilter: string[],
      specsFilter: string[]
    ) =>
      !(
        !searchFilter &&
        networksFilter.length === 0 &&
        typesFilter.length === 0 &&
        specsFilter.length === 0
      ),
    []
  );

  // Helper function to filter channels by network
  const filterByNetwork = useCallback(
    (network: string, networksFilter: string[]) =>
      networksFilter.length === 0 || networksFilter.includes(network),
    []
  );

  // Helper function to filter channels by matching criteria
  const filterChannelsByCriteria = useCallback(
    (
      locationChannels: Record<string, ChannelData>,
      matchesFilters: (channel: ChannelData) => boolean
    ) => Object.values(locationChannels).some(matchesFilters),
    []
  );

  // Helper function to apply filters to the channel map
  const applyFiltersToChannelMap = useCallback(
    ({
      channelMap,
      networksFilter,
      typesFilter,
      specsFilter,
      searchFilter,
      matchesFilters,
    }: {
      channelMap: Record<string, Record<string, Record<string, ChannelData>>>;
      networksFilter: string[];
      typesFilter: string[];
      specsFilter: string[];
      searchFilter: string;
      matchesFilters: (channel: ChannelData) => boolean;
    }) => {
      if (
        !hasActiveFilters(
          searchFilter,
          networksFilter,
          typesFilter,
          specsFilter
        )
      ) {
        return channelMap;
      }

      const filteredMap: Record<
        string,
        Record<string, Record<string, ChannelData>>
      > = {};

      for (const [network, channels] of Object.entries(channelMap)) {
        if (!filterByNetwork(network, networksFilter)) {
          continue;
        }

        filteredMap[network] = {};

        for (const [channelNumber, locationChannels] of Object.entries(
          channels
        )) {
          if (filterChannelsByCriteria(locationChannels, matchesFilters)) {
            filteredMap[network][channelNumber] = locationChannels;
          }
        }

        if (Object.keys(filteredMap[network]).length === 0) {
          delete filteredMap[network];
        }
      }

      return filteredMap;
    },
    [hasActiveFilters, filterByNetwork, filterChannelsByCriteria]
  );

  // Apply filters to the channel map
  const filteredChannelMap = useMemo(() => {
    const channelMap = getChannelMap();
    return applyFiltersToChannelMap({
      channelMap,
      matchesFilters: channelMatchesFilters,
      networksFilter: selectedNetworks,
      searchFilter: debouncedGlobalSearch,
      specsFilter: selectedChannelSpecs,
      typesFilter: selectedChannelTypes,
    });
  }, [
    getChannelMap,
    applyFiltersToChannelMap,
    selectedNetworks,
    selectedChannelTypes,
    selectedChannelSpecs,
    debouncedGlobalSearch,
    channelMatchesFilters,
  ]);

  // Calculate counts for filter options
  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const channelMap = getChannelMap();

    for (const [network, channels] of Object.entries(channelMap)) {
      counts[network] = Object.keys(channels).length;
    }

    return counts;
  }, [getChannelMap]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const type of channelTypes) {
      // Count channels that match this type
      let count = 0;

      for (const channels of Object.values(channelData)) {
        for (const channel of channels) {
          if (channel.other_data?.channel_type === type) {
            count++;
          }
        }
      }

      counts[type] = count;
    }

    return counts;
  }, [channelData, channelTypes]);

  const specsCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const spec of channelSpecs) {
      // Count channels that match this spec
      let count = 0;

      for (const channels of Object.values(channelData)) {
        for (const channel of channels) {
          if (channel.other_data?.channel_specs === spec) {
            count++;
          }
        }
      }

      counts[spec] = count;
    }

    return counts;
  }, [channelData, channelSpecs]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setGlobalFilter("");
    setSelectedNetworks([]);
    setSelectedChannelTypes([]);
    setSelectedChannelSpecs([]);
    setNetworkSearch("");
    setTypeSearch("");
    setSpecsSearch("");
  }, []);

  // Count total channels and filtered channels
  const totalChannels = useMemo(() => {
    let count = 0;
    for (const network of Object.values(getChannelMap())) {
      count += Object.keys(network).length;
    }
    return count;
  }, [getChannelMap]);

  const filteredChannels = useMemo(() => {
    let count = 0;
    for (const network of Object.values(filteredChannelMap)) {
      count += Object.keys(network).length;
    }
    return count;
  }, [filteredChannelMap]);

  // Get unique subgroups for the select dropdown
  const subgroups = useMemo(
    () => getUniqueSubgroups(sources),
    [sources, getUniqueSubgroups]
  );

  return {
    abbreviateStateName,
    abbreviateText,
    channelSpecs,
    channelTypes,
    clearFilters,
    collapsedNetworks,
    error,
    expandedChannels,
    fetchSources,
    filteredChannelMap,
    filteredChannels,
    getChannelColor,
    globalFilter,
    isLegendOpen,
    isMobile,
    // State
    loading,
    locationsForSubgroup,
    networkCounts,
    networkGroups,
    networkSearch,
    renderChannelRow,
    selectedChannelSpecs,
    selectedChannelTypes,
    selectedNetworks,
    selectedSubgroup,

    // Actions
    setGlobalFilter,
    setIsLegendOpen,
    setNetworkSearch,
    setSelectedChannelSpecs,
    setSelectedChannelTypes,
    setSelectedNetworks,
    setSelectedSubgroup: setSelectedSubgroupWithUrl,
    setSpecsSearch,
    setTypeSearch,
    setViewMode: setViewModeWithUrl,
    setVisibleLocations,
    specsCounts,
    specsSearch,
    subgroups,
    toggleAllNetworks,
    toggleChannelExpansion,
    toggleNetworkCollapse,
    totalChannels,
    typeCounts,
    typeSearch,
    viewMode,
    visibleLocations,
  };
}

// Helper function to calculate colspan for consecutive same channels
const calculateColspan = (
  locationIndex: number,
  flatViewFilteredLocations: string[],
  mergedLocationChannels: Record<string, ChannelData>
): number => {
  let colspan = 1;
  let j = locationIndex + 1;
  while (j < flatViewFilteredLocations.length) {
    const nextLocation = flatViewFilteredLocations[j];
    const nextChannel = mergedLocationChannels[nextLocation];

    // Check if next location has the same channel
    if (
      nextChannel &&
      nextChannel.channel_names.location ===
        mergedLocationChannels[flatViewFilteredLocations[locationIndex]]
          .channel_names.location
    ) {
      colspan++;
      j++;
    } else {
      break;
    }
  }
  return colspan;
};

// Helper function to check if cell should be skipped due to colspan
const shouldSkipCell = (
  locationIndex: number,
  flatViewFilteredLocations: string[],
  mergedLocationChannels: Record<string, ChannelData>
): boolean => {
  if (locationIndex === 0) {
    return false;
  }

  const prevLocation = flatViewFilteredLocations[locationIndex - 1];
  const prevChannel = mergedLocationChannels[prevLocation];
  const currentLocation = flatViewFilteredLocations[locationIndex];
  const currentChannel = mergedLocationChannels[currentLocation];

  return (
    prevChannel &&
    currentChannel &&
    prevChannel.channel_names.location === currentChannel.channel_names.location
  );
};

// Helper function to render a single location cell in flat view
const renderFlatViewLocationCell = ({
  location,
  locationIndex,
  flatViewFilteredLocations,
  mergedLocationChannels,
  abbreviateText,
  getChannelColor,
}: {
  location: string;
  locationIndex: number;
  flatViewFilteredLocations: string[];
  mergedLocationChannels: Record<string, ChannelData>;
  abbreviateText: (
    channelName: string,
    abbreviations: Record<string, string>
  ) => string;
  getChannelColor: (channelSpecs?: string) => string;
}): React.ReactElement | null => {
  const channel = mergedLocationChannels[location];

  if (!channel) {
    return (
      <td
        className="h-10 border border-border px-3 text-center text-muted-foreground text-sm"
        key={`location-${location}`}
      >
        <span className="text-muted-foreground text-xs">Not available</span>
      </td>
    );
  }

  // Skip cells that are part of a colspan
  if (
    shouldSkipCell(
      locationIndex,
      flatViewFilteredLocations,
      mergedLocationChannels
    )
  ) {
    return null;
  }

  const colspan = calculateColspan(
    locationIndex,
    flatViewFilteredLocations,
    mergedLocationChannels
  );

  // Get the channel name and apply abbreviation
  const channelName = channel.channel_names.location || channel.channel_name;
  const abbreviatedChannelName = abbreviateText(channelName, {});

  // Get background color based on channel specs
  const backgroundColor = getChannelColor(channel.other_data?.channel_specs);

  return (
    <td
      className={`h-10 border border-border px-3 text-center ${backgroundColor}`}
      colSpan={colspan}
      key={`location-${location}`}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        {channel.channel_logo?.light && (
          <div className="flex size-8 items-center justify-center rounded-md bg-muted/50">
            <img
              alt=""
              className="max-h-full max-w-full object-contain p-1"
              height={24}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=24&width=24";
              }}
              src={channel.channel_logo.light || "/placeholder.svg"}
              width={24}
            />
          </div>
        )}
        <div className="font-medium text-xs">{abbreviatedChannelName}</div>
        {channel.channel_network && (
          <div className="text-muted-foreground text-xs">
            {channel.channel_network}
          </div>
        )}
      </div>
    </td>
  );
};

// Helper function to create merged location channels for flat view
const createMergedLocationChannels = (
  channelsWithSameNumber: Array<{
    network: string;
    channelNumber: string;
    locationChannels: Record<string, ChannelData>;
  }>,
  flatViewFilteredLocations: string[]
): Record<string, ChannelData> => {
  const mergedLocationChannels: Record<string, ChannelData> = {};

  // For each location, find any channel with this number
  for (const location of flatViewFilteredLocations) {
    // Check all networks for this channel number in this location
    for (const { network, locationChannels } of channelsWithSameNumber) {
      if (locationChannels[location]) {
        // If we find a channel, add it to our merged view
        mergedLocationChannels[location] = locationChannels[location];
        // Add network info to the channel for display
        mergedLocationChannels[location].channel_network = network;
        break;
      }
    }
  }

  return mergedLocationChannels;
};

// Helper function to render a single flat view row
const renderFlatViewRow = ({
  channelNumber,
  channelsWithSameNumber,
  flatViewFilteredLocations,
  abbreviateText,
  getChannelColor,
}: {
  channelNumber: string;
  channelsWithSameNumber: Array<{
    network: string;
    channelNumber: string;
    locationChannels: Record<string, ChannelData>;
  }>;
  flatViewFilteredLocations: string[];
  abbreviateText: (
    channelName: string,
    abbreviations: Record<string, string>
  ) => string;
  getChannelColor: (channelSpecs?: string) => string;
}): React.ReactElement => {
  const mergedLocationChannels = createMergedLocationChannels(
    channelsWithSameNumber,
    flatViewFilteredLocations
  );

  return (
    <tr className="border-b hover:bg-muted/50" key={`channel-${channelNumber}`}>
      <td className="sticky left-0 z-20 h-10 w-[100px] min-w-[100px] border border-border bg-background px-3 text-center font-medium shadow-sm">
        Ch {channelNumber}
      </td>

      {/* Render each location column */}
      {flatViewFilteredLocations.map((location, locationIndex) =>
        renderFlatViewLocationCell({
          abbreviateText,
          flatViewFilteredLocations,
          getChannelColor,
          location,
          locationIndex,
          mergedLocationChannels,
        })
      )}
    </tr>
  );
};

// Helper function to render mobile flat view
const renderMobileFlatView = ({
  filteredChannelMap,
  locationsForSubgroup,
  visibleLocations,
  abbreviateText,
  getChannelColor,
}: {
  filteredChannelMap: Record<
    string,
    Record<string, Record<string, ChannelData>>
  >;
  locationsForSubgroup: string[];
  visibleLocations: string[];
  abbreviateText: (
    channelName: string,
    abbreviations: Record<string, string>
  ) => string;
  getChannelColor: (channelSpecs?: string) => string;
}) => {
  // Flatten all channels from all networks into a single array
  const allChannels = Object.entries(filteredChannelMap).flatMap(
    ([network, channels]) =>
      Object.entries(channels).map(([channelNumber, locationChannels]) => ({
        channelNumber,
        locationChannels,
        network,
      }))
  );

  // Group channels by channel number only
  const channelsByNumber: Record<
    string,
    Array<{
      network: string;
      channelNumber: string;
      locationChannels: Record<string, ChannelData>;
    }>
  > = {};

  for (const channel of allChannels) {
    if (!channelsByNumber[channel.channelNumber]) {
      channelsByNumber[channel.channelNumber] = [];
    }
    channelsByNumber[channel.channelNumber].push(channel);
  }

  // Sort channel numbers numerically
  const sortedChannelNumbers = Object.keys(channelsByNumber).sort((a, b) => {
    const numA = Number.parseInt(a, 10) || 0;
    const numB = Number.parseInt(b, 10) || 0;
    return numA - numB;
  });

  return (
    <div className="relative">
      <table className="w-full border-collapse border border-border">
        <thead className="sticky top-0 z-10">
          <tr className="border-b bg-muted/50">
            <th className="h-10 w-[100px] min-w-[100px] border border-border bg-muted/50 px-3 text-center font-medium text-muted-foreground text-xs">
              Channel
            </th>
            {visibleLocations.map((location) => (
              <th
                className="h-10 border border-border px-3 text-center font-medium text-muted-foreground text-xs"
                key={location}
              >
                {location}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedChannelNumbers.map((channelNumber) =>
            renderFlatViewRow({
              abbreviateText,
              channelNumber,
              channelsWithSameNumber: channelsByNumber[channelNumber],
              flatViewFilteredLocations: locationsForSubgroup,
              getChannelColor,
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// Helper function to render mobile networks view
const renderMobileNetworksView = ({
  filteredChannelMap,
  collapsedNetworks,
  toggleNetworkCollapse,
  expandedChannels,
  toggleChannelExpansion,
  locationsForSubgroup,
  visibleLocations,
  abbreviateStateName,
}: {
  filteredChannelMap: Record<
    string,
    Record<string, Record<string, ChannelData>>
  >;
  collapsedNetworks: Record<string, boolean>;
  toggleNetworkCollapse: (network: string) => void;
  expandedChannels: Record<string, boolean>;
  toggleChannelExpansion: (channelKey: string) => void;
  locationsForSubgroup: string[];
  visibleLocations: string[];
  abbreviateStateName: (channelName: string) => string;
}) => (
  <div className="space-y-4">
    {Object.entries(filteredChannelMap).map(([network, channels]) => {
      const sortedChannels = Object.entries(channels).sort(
        ([numA, _], [numB, __]) =>
          Number.parseInt(numA, 10) - Number.parseInt(numB, 10)
      );

      const isCollapsed = collapsedNetworks[network];

      return (
        <div className="mb-6" key={network}>
          <div
            className="mb-3 flex cursor-pointer items-center justify-between rounded-md bg-muted/50 p-3"
            onClick={() => toggleNetworkCollapse(network)}
          >
            <h3 className="font-bold">{network}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{Object.keys(channels).length}</Badge>
              <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="space-y-2">
              {sortedChannels.map(([channelNumber, locationChannels]) => {
                const channelKey = `${network}-${channelNumber}`;

                return (
                  <ChannelCard
                    abbreviateStateName={abbreviateStateName}
                    channelNumber={channelNumber}
                    channelsWithSameNumber={[
                      { channelNumber, locationChannels, network },
                    ]}
                    expandedChannels={expandedChannels}
                    key={channelKey}
                    locationsForSubgroup={locationsForSubgroup}
                    toggleChannelExpansion={toggleChannelExpansion}
                    visibleLocations={visibleLocations}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// Helper function to render desktop networks view
const renderDesktopNetworksView = ({
  filteredChannelMap,
  collapsedNetworks,
  toggleNetworkCollapse,
  visibleLocations,
  renderChannelRow,
}: {
  filteredChannelMap: Record<
    string,
    Record<string, Record<string, ChannelData>>
  >;
  collapsedNetworks: Record<string, boolean>;
  toggleNetworkCollapse: (network: string) => void;
  visibleLocations: string[];
  renderChannelRow: (
    network: string,
    channelNumber: string,
    locationChannels: Record<string, ChannelData>
  ) => React.ReactElement;
}) => (
  <div className="w-full overflow-x-auto">
    <Table className="w-full table-fixed">
      <TableBody>
        {Object.entries(filteredChannelMap).map(([network, channels]) => {
          const sortedChannels = Object.entries(channels).sort(
            ([numA, _], [numB, __]) =>
              Number.parseInt(numA, 10) - Number.parseInt(numB, 10)
          );

          const isCollapsed = collapsedNetworks[network];

          return (
            <React.Fragment key={network}>
              <TableRow
                className="cursor-pointer bg-muted/50 hover:bg-muted/70"
                onClick={() => toggleNetworkCollapse(network)}
              >
                <TableCell
                  className="sticky left-0 z-10 border bg-muted/50 font-bold"
                  colSpan={1 + visibleLocations.length}
                >
                  <div className="flex items-center justify-between">
                    <span>{network}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Object.keys(channels).length}
                      </Badge>
                      <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {!isCollapsed && (
                <>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 w-[100px] min-w-[100px] border bg-muted py-2">
                      Channel
                    </TableHead>
                    {visibleLocations.map((location) => (
                      <TableHead
                        className="w-auto whitespace-normal border py-2 text-center"
                        key={location}
                      >
                        {location}
                      </TableHead>
                    ))}
                  </TableRow>
                  {sortedChannels.map(([channelNumber, locationChannels]) =>
                    renderChannelRow(network, channelNumber, locationChannels)
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

// Helper function to render desktop flat view
const renderDesktopFlatView = ({
  filteredChannelMap,
  locationsForSubgroup,
  visibleLocations,
  abbreviateText,
  getChannelColor,
}: {
  filteredChannelMap: Record<
    string,
    Record<string, Record<string, ChannelData>>
  >;
  locationsForSubgroup: string[];
  visibleLocations: string[];
  abbreviateText: (
    channelName: string,
    abbreviations: Record<string, string>
  ) => string;
  getChannelColor: (channelSpecs?: string) => string;
}) => {
  const flatViewFilteredLocations = locationsForSubgroup.filter((loc) =>
    visibleLocations.includes(loc)
  );

  // Flatten all channels from all networks into a single array
  const allChannels = Object.entries(filteredChannelMap).flatMap(
    ([network, channels]) =>
      Object.entries(channels).map(([channelNumber, locationChannels]) => ({
        channelNumber,
        locationChannels,
        network,
      }))
  );

  // Group channels by channel number only
  const channelsByNumber: Record<
    string,
    Array<{
      network: string;
      channelNumber: string;
      locationChannels: Record<string, ChannelData>;
    }>
  > = {};

  for (const channel of allChannels) {
    if (!channelsByNumber[channel.channelNumber]) {
      channelsByNumber[channel.channelNumber] = [];
    }
    channelsByNumber[channel.channelNumber].push(channel);
  }

  // Sort channel numbers numerically
  const sortedChannelNumbers = Object.keys(channelsByNumber).sort((a, b) => {
    const numA = Number.parseInt(a, 10) || 0;
    const numB = Number.parseInt(b, 10) || 0;
    return numA - numB;
  });

  return (
    <div className="w-full" style={{ height: "calc(100vh - 200px)" }}>
      <table className="w-full table-fixed border-collapse border border-border">
        <thead>
          <tr className="sticky top-0 z-20 bg-background shadow-sm">
            <th className="w-[100px] min-w-[100px] border border-border bg-background py-2 text-center text-xs shadow-sm">
              Channel
            </th>
            {visibleLocations.map((location) => (
              <th
                className="border border-border bg-background py-2 text-center text-xs"
                key={location}
              >
                {location}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedChannelNumbers.map((channelNumber) =>
            renderFlatViewRow({
              abbreviateText,
              channelNumber,
              channelsWithSameNumber: channelsByNumber[channelNumber],
              flatViewFilteredLocations,
              getChannelColor,
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// Component for the main content area
const ChannelMapContent = ({
  loading,
  selectedSubgroup,
  visibleLocations,
  locationsForSubgroup,
  filteredChannelMap,
  isMobile,
  viewMode,
  collapsedNetworks,
  toggleNetworkCollapse,
  expandedChannels,
  toggleChannelExpansion,
  renderChannelRow,
  abbreviateText,
  abbreviateStateName,
  getChannelColor,
}: {
  loading: boolean;
  selectedSubgroup: string;
  visibleLocations: string[];
  locationsForSubgroup: string[];
  filteredChannelMap: Record<
    string,
    Record<string, Record<string, ChannelData>>
  >;
  isMobile: boolean;
  viewMode: "networks" | "flat";
  collapsedNetworks: Record<string, boolean>;
  toggleNetworkCollapse: (network: string) => void;
  expandedChannels: Record<string, boolean>;
  toggleChannelExpansion: (channelKey: string) => void;
  renderChannelRow: (
    network: string,
    channelNumber: string,
    locationChannels: Record<string, ChannelData>
  ) => React.ReactElement;
  abbreviateText: (
    channelName: string,
    abbreviations: Record<string, string>
  ) => string;
  abbreviateStateName: (channelName: string) => string;
  getChannelColor: (channelSpecs?: string) => string;
}) => {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-lg">Loading channel data...</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      {visibleLocations.length > 0 &&
        (isMobile ? (
          // Mobile card view
          <div className="space-y-4">
            {viewMode === "networks"
              ? // Networks view - grouped by network
                renderMobileNetworksView({
                  abbreviateStateName,
                  collapsedNetworks,
                  expandedChannels,
                  filteredChannelMap,
                  locationsForSubgroup,
                  toggleChannelExpansion,
                  toggleNetworkCollapse,
                  visibleLocations,
                })
              : // Flat view - all channels in a single list
                renderMobileFlatView({
                  abbreviateText,
                  filteredChannelMap,
                  getChannelColor,
                  locationsForSubgroup,
                  visibleLocations,
                })}

            {Object.keys(filteredChannelMap).length === 0 && (
              <div className="rounded-md bg-muted/20 p-8 text-center">
                {selectedSubgroup
                  ? "No results found. Try adjusting your filters."
                  : "Please select a region to view channels."}
              </div>
            )}
          </div>
        ) : (
          // Desktop table view
          <div className="w-full overflow-x-auto">
            {viewMode === "networks"
              ? // Networks view - grouped by network
                renderDesktopNetworksView({
                  collapsedNetworks,
                  filteredChannelMap,
                  renderChannelRow,
                  toggleNetworkCollapse,
                  visibleLocations,
                })
              : // Flat view - all channels in a single table
                renderDesktopFlatView({
                  abbreviateText,
                  filteredChannelMap,
                  getChannelColor,
                  locationsForSubgroup,
                  visibleLocations,
                })}
            {Object.keys(filteredChannelMap).length === 0 && (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={1 + visibleLocations.length}
                >
                  {selectedSubgroup
                    ? "No results found. Try adjusting your filters."
                    : "Please select a region to view channels."}
                </TableCell>
              </TableRow>
            )}
          </div>
        ))}
      {/* <div aria-hidden="true" className="h-24" /> Spacer element */}
    </div>
  );
};

export default function ChannelMapSourcesPage() {
  const {
    // State
    loading,
    error,
    networkGroups,
    globalFilter,
    selectedNetworks,
    selectedChannelTypes,
    selectedChannelSpecs,
    networkSearch,
    typeSearch,
    specsSearch,
    collapsedNetworks,
    selectedSubgroup,
    visibleLocations,
    expandedChannels,
    viewMode,
    isMobile,
    isLegendOpen,
    locationsForSubgroup,
    channelTypes,
    channelSpecs,
    filteredChannelMap,
    networkCounts,
    typeCounts,
    specsCounts,
    totalChannels,
    filteredChannels,
    subgroups,

    // Actions
    setGlobalFilter,
    setIsLegendOpen,
    setSelectedNetworks,
    setSelectedChannelTypes,
    setSelectedChannelSpecs,
    setNetworkSearch,
    setTypeSearch,
    setSpecsSearch,
    setSelectedSubgroup: setSelectedSubgroupWithUrl,
    setVisibleLocations,
    setViewMode: setViewModeWithUrl,
    toggleNetworkCollapse,
    toggleChannelExpansion,
    toggleAllNetworks,
    clearFilters,
    fetchSources,
    renderChannelRow,
    abbreviateText,
    abbreviateStateName,
    getChannelColor,
  } = useChannelMapData();

  // Restore headerActions and sidebar definitions above the return statement
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        className="gap-1"
        disabled={loading}
        onClick={fetchSources}
        size="sm"
        variant="outline"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      {!isMobile && (
        <>
          <LocationSelector
            locations={locationsForSubgroup}
            setVisibleLocations={setVisibleLocations}
            visibleLocations={visibleLocations}
          />
          <ViewModeToggle
            setViewMode={setViewModeWithUrl}
            viewMode={viewMode}
          />
        </>
      )}
      {!isMobile && (
        <div className="flex gap-1">
          <Button
            disabled={loading || Object.keys(filteredChannelMap).length === 0}
            onClick={() => toggleAllNetworks(true)}
            size="sm"
            variant="outline"
          >
            Collapse All
          </Button>
          <Button
            disabled={loading || Object.keys(filteredChannelMap).length === 0}
            onClick={() => toggleAllNetworks(false)}
            size="sm"
            variant="outline"
          >
            Expand All
          </Button>
        </div>
      )}
    </div>
  );

  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <div className="space-y-2">
          <Select
            onValueChange={setSelectedSubgroupWithUrl}
            value={selectedSubgroup}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {subgroups.map((subgroup) => (
                <SelectItem key={subgroup} value={subgroup}>
                  {subgroup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SidebarSearch
            onValueChange={setGlobalFilter}
            placeholder="Search channels..."
            searchValue={globalFilter}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          counts={networkCounts}
          filters={selectedNetworks}
          onFilterChange={(value) => {
            setSelectedNetworks((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            );
          }}
          onSearchChange={setNetworkSearch}
          options={networkGroups}
          searchValue={networkSearch}
          showSearch={networkGroups.length > 10}
          title="Network"
        />
        <FilterSection
          counts={typeCounts}
          filters={selectedChannelTypes}
          onFilterChange={(value) => {
            setSelectedChannelTypes((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            );
          }}
          onSearchChange={setTypeSearch}
          options={channelTypes}
          searchValue={typeSearch}
          showSearch={channelTypes.length > 10}
          title="Channel Type"
        />
        <FilterSection
          counts={specsCounts}
          filters={selectedChannelSpecs}
          onFilterChange={(value) => {
            setSelectedChannelSpecs((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
            );
          }}
          onSearchChange={setSpecsSearch}
          options={channelSpecs}
          searchValue={specsSearch}
          showSearch={channelSpecs.length > 10}
          title="Channel Specs"
        />
      </SidebarContent>
      <SidebarFooter>
        <div className="space-y-3">
          {/* Channel Specs Legend */}
          <Collapsible onOpenChange={setIsLegendOpen} open={isLegendOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
              <h4 className="font-semibold text-xs">Legend: Channel Specs</h4>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isLegendOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-2 gap-1.5">
                <div
                  className={`rounded-md border px-2 py-1 text-center ${channelSpecColors.hdMpeg4}`}
                >
                  <span className="text-xs">HD MPEG-4</span>
                </div>
                <div
                  className={`rounded-md border px-2 py-1 text-center ${channelSpecColors.hdMpeg2}`}
                >
                  <span className="text-xs">HD MPEG-2</span>
                </div>
                <div
                  className={`rounded-md border px-2 py-1 text-center ${channelSpecColors.sdMpeg4}`}
                >
                  <span className="text-xs">SD MPEG-4</span>
                </div>
                <div
                  className={`rounded-md border px-2 py-1 text-center ${channelSpecColors.sdMpeg2}`}
                >
                  <span className="text-xs">SD MPEG-2</span>
                </div>
                <div
                  className={`rounded-md border px-2 py-1 text-center ${channelSpecColors.radio}`}
                >
                  <span className="text-xs">Radio</span>
                </div>
                <div className="rounded-md border bg-muted/50 px-2 py-1 text-center">
                  <span className="text-xs">Not Available</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Button
            className="w-full text-xs"
            onClick={clearFilters}
            size="sm"
            variant="outline"
          >
            Clear All Filters
          </Button>
          <div className="text-center text-muted-foreground text-xs">
            Showing {filteredChannels} of {totalChannels} channels
          </div>
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-destructive text-xl">Error</h2>
          <p>{error}</p>
          <Button className="mt-4" onClick={fetchSources}>
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      sidebar={sidebar}
      title="Channel Map by Region"
    >
      <ChannelMapContent
        abbreviateStateName={abbreviateStateName}
        abbreviateText={abbreviateText}
        collapsedNetworks={collapsedNetworks}
        expandedChannels={expandedChannels}
        filteredChannelMap={filteredChannelMap}
        getChannelColor={getChannelColor}
        isMobile={isMobile}
        loading={loading}
        locationsForSubgroup={locationsForSubgroup}
        renderChannelRow={renderChannelRow}
        selectedSubgroup={selectedSubgroup}
        toggleChannelExpansion={toggleChannelExpansion}
        toggleNetworkCollapse={toggleNetworkCollapse}
        viewMode={viewMode}
        visibleLocations={visibleLocations}
      />
    </SidebarLayout>
  );
}
