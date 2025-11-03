"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Tv,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryStates } from "nuqs";
import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
} from "@/components/layouts/sidebar-layout";
import LoadingState from "@/components/loading-state";
import { GENRE_COLORS } from "@/components/timeline/constants";
import { calculatePxPerYear } from "@/components/timeline/spacing-utils";
import {
  type TimelineSpacingMode,
  TimelineSpacingSelector,
} from "@/components/timeline/TimelineSpacingSelector";
import { TimelineUnified } from "@/components/timeline/TimelineUnified";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getAllProviderIds,
  getProvidersByCategory,
  timelineProviders,
} from "@/lib/timeline-data";
import { cn } from "@/lib/utils";

// Helper: extract indicators from channel name
const extractIndicators = (name: string): string[] => {
  const found: string[] = [];
  if (
    name.includes("4K") ||
    name.includes("UHD") ||
    name.includes("Ultra HD")
  ) {
    found.push("4K");
  }
  if (name.includes(" HD")) {
    found.push("HD");
  }
  if (name.includes("+2")) {
    found.push("+2");
  }
  if (name.includes("Interactive") || name.includes("interactive")) {
    found.push("Interactive");
  }
  if (name.includes("Virtual Playlist") || name.includes("virtual playlist")) {
    found.push("Virtual Playlist");
  }
  return found;
};

// Helper function to process channel items
const processChannelItems = (
  items: Array<{
    channel_name: string;
    channel_genre?: string;
    channel_network?: string;
    channel_notes?: string;
    from: number | string;
    to?: number | string;
  }>,
  indicators: Set<string>,
  colorValues: Set<string>,
  colorBy: string
) => {
  for (const item of items) {
    // Extract indicators from channel name
    for (const indicator of extractIndicators(item.channel_name)) {
      indicators.add(indicator);
    }
    // Also check if channel_genre is "Interactive"
    if (item.channel_genre === "Interactive") {
      indicators.add("Interactive");
    }
    // Collect color values based on configured colorBy
    const colorValue =
      colorBy === "channel_network" ? item.channel_network : item.channel_genre;
    if (colorValue) {
      colorValues.add(colorValue);
    }
  }
};

// Indicator legend component
function IndicatorLegend({
  activeIndicators,
}: {
  activeIndicators: Set<string>;
}) {
  const indicators = [
    { color: "#a855f7", key: "4K", label: "4K / UHD / Ultra HD" },
    { color: "#3b82f6", key: "HD", label: "HD Channels" },
    { color: "#f97316", key: "+2", label: "+2 Channels" },
    { color: "#10b981", key: "Interactive", label: "Interactive Channels" },
    {
      color: "#8b5cf6",
      key: "Virtual Playlist",
      label: "Virtual Playlist Channels",
    },
  ];

  return (
    <div className="space-y-1.5">
      {indicators
        .filter(({ key }) => activeIndicators.has(key))
        .map(({ key, label, color }) => (
          <div
            className="flex items-center gap-2 rounded-md border-2 bg-muted px-2 py-1.5"
            key={key}
            style={{ borderColor: color }}
          >
            <div
              className="h-3 w-3 rounded border-2"
              style={{ borderColor: color }}
            />
            <span className="text-xs">{label}</span>
          </div>
        ))}
    </div>
  );
}

type ChannelHistorySidebarProps = {
  activeColorValues: Set<string>;
  activeIndicators: Set<string>;
  availableNetworks: Set<string>;
  colorBy: string;
  colorMap?: Record<string, string>;
  isGenresOpen: boolean;
  isIndicatorsOpen: boolean;
  isNetworksOpen: boolean;
  isYearRangeOpen: boolean;
  onGenresOpenChange: (open: boolean) => void;
  onIndicatorsOpenChange: (open: boolean) => void;
  onNetworksOpenChange: (open: boolean) => void;
  onYearRangeOpenChange: (open: boolean) => void;
  onNetworksReset: () => void;
  onNetworkToggle: (network: string, checked: boolean) => void;
  onYearRangeReset: () => void;
  onYearRangeChange: (value: number[]) => void;
  selectedNetworks: Set<string>;
  selectedProvider: {
    name: string;
    description: string;
    country: string;
    colorBy?: string;
    colorMap?: Record<string, string>;
    data: {
      axis: {
        start: number;
        end: number;
      };
      channels: Record<
        string,
        Array<{
          channel_name: string;
          channel_genre?: string;
          channel_network?: string;
          channel_notes?: string;
          from: number | string;
          to?: number | string;
        }>
      >;
      events?: Array<{
        when: string | number;
        label: string;
        type: string;
        note?: string;
        href?: string;
      }>;
    };
  } | null;
  yearRange: [number, number];
};

function ChannelHistorySidebar({
  activeColorValues,
  activeIndicators,
  availableNetworks,
  colorBy,
  colorMap,
  isGenresOpen,
  isIndicatorsOpen,
  isNetworksOpen,
  isYearRangeOpen,
  onGenresOpenChange,
  onIndicatorsOpenChange,
  onNetworksOpenChange,
  onYearRangeOpenChange,
  onNetworksReset,
  onNetworkToggle,
  onYearRangeReset,
  onYearRangeChange,
  selectedNetworks,
  selectedProvider,
  yearRange,
}: ChannelHistorySidebarProps) {
  return (
    <div className="space-y-3">
      {/* <Separator /> */}

      {/* Year Range Filter */}
      {selectedProvider && (
        <Collapsible
          onOpenChange={onYearRangeOpenChange}
          open={isYearRangeOpen}
        >
          <div className="flex w-full items-center gap-1">
            <CollapsibleTrigger className="flex flex-1 items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
              <h4 className="font-semibold text-xs">Filter by Year Range</h4>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isYearRangeOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <button
              className={cn(
                buttonVariants({ size: "sm", variant: "ghost" }),
                "inline-flex h-6 cursor-pointer items-center justify-center rounded-md px-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onYearRangeReset();
              }}
              type="button"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <CollapsibleContent className="pt-2">
            <div className="flex w-full max-w-md flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="year-slider">Year Range</Label>
                <span className="text-muted-foreground text-xs">
                  {Math.floor(yearRange[0] ?? 0)} -{" "}
                  {Math.floor(yearRange[1] ?? 0)}
                </span>
              </div>
              <Slider
                id="year-slider"
                max={selectedProvider.data.axis.end}
                min={selectedProvider.data.axis.start}
                onValueChange={onYearRangeChange}
                step={1}
                value={yearRange}
              />
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>{selectedProvider.data.axis.start}</span>
                <span>{selectedProvider.data.axis.end}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Separator />

      {/* Network Filter */}
      {availableNetworks.size > 0 && (
        <Collapsible onOpenChange={onNetworksOpenChange} open={isNetworksOpen}>
          <div className="flex w-full items-center gap-1">
            <CollapsibleTrigger className="flex flex-1 items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
              <h4 className="text-left font-semibold text-xs">
                Filter by Network
                <br />
                {selectedNetworks.size > 0 && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({selectedNetworks.size} selected)
                  </span>
                )}
              </h4>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isNetworksOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            {selectedNetworks.size > 0 && (
              <button
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "inline-flex h-6 cursor-pointer items-center justify-center rounded-md px-2 transition-colors hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onNetworksReset();
                }}
                type="button"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              {Array.from(availableNetworks)
                .sort()
                .map((network) => (
                  <div className="flex items-center space-x-2" key={network}>
                    <Checkbox
                      checked={selectedNetworks.has(network)}
                      id={`network-${network}`}
                      onCheckedChange={(checked) =>
                        onNetworkToggle(network, !!checked)
                      }
                    />
                    <Label
                      className="cursor-pointer font-normal text-xs"
                      htmlFor={`network-${network}`}
                    >
                      {network}
                    </Label>
                  </div>
                ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {availableNetworks.size > 0 && <Separator />}

      {/* Channel Type Indicators */}
      {activeIndicators.size > 0 && (
        <Collapsible
          onOpenChange={onIndicatorsOpenChange}
          open={isIndicatorsOpen}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
            <h4 className="font-semibold text-xs">
              Legend: Channel Indicators
            </h4>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isIndicatorsOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <IndicatorLegend activeIndicators={activeIndicators} />
          </CollapsibleContent>
        </Collapsible>
      )}

      {activeIndicators.size > 0 && <Separator />}

      {/* Color Legend */}
      {activeColorValues.size > 0 && (
        <Collapsible onOpenChange={onGenresOpenChange} open={isGenresOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
            <h4 className="font-semibold text-xs">
              Legend: Channel{" "}
              {colorBy === "channel_network" ? "Networks" : "Genres"}
            </h4>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isGenresOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(colorMap || GENRE_COLORS)
                .filter(
                  ([value]) =>
                    value !== "Default" && activeColorValues.has(value)
                )
                .map(([value, colorClass]) => (
                  <div
                    className={`rounded-md border px-2 py-1 text-center ${colorClass}`}
                    key={value}
                  >
                    <span className="text-xs">{value}</span>
                  </div>
                ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

type ChannelHistoryClientProps = {
  params: Promise<{
    provider: string;
  }>;
};

export default function ChannelHistoryClient({
  params,
}: ChannelHistoryClientProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { provider: providerId } = unwrappedParams;
  const isMobile = useIsMobile();

  const providersByCategory = useMemo(() => getProvidersByCategory(), []);
  const validProviderIds = useMemo(() => getAllProviderIds(), []);
  const selectedProvider = timelineProviders[providerId];

  // Spacing state
  const [spacingMode, setSpacingMode] = useState<TimelineSpacingMode>("fill");
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Scroll position preservation
  const scrollPositionRef = useRef<{
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  // Legend collapse state
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [isNetworksOpen, setIsNetworksOpen] = useState(false);
  const [isYearRangeOpen, setIsYearRangeOpen] = useState(false);

  // Network filter state
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(
    new Set()
  );

  // Year range filter state - tracked in URL
  const [{ yearStart, yearEnd }, setYearParams] = useQueryStates(
    {
      yearEnd: parseAsInteger.withDefault(
        selectedProvider?.data.axis.end ?? 2025
      ),
      yearStart: parseAsInteger.withDefault(
        selectedProvider?.data.axis.start ?? 1990
      ),
    },
    {
      history: "push",
      shallow: true,
    }
  );

  // Derive yearRange from URL params
  const yearRange: [number, number] = [yearStart, yearEnd];

  // Debounce year range changes to improve performance (300ms delay)
  const debouncedYearRange = useDebounce(yearRange, 300);

  // Reset year range and network filter when provider changes
  useEffect(() => {
    if (selectedProvider) {
      const newStart = selectedProvider.data.axis.start;
      const newEnd = selectedProvider.data.axis.end;

      // Only update if the current values are outside the new provider's range
      if (
        yearStart < newStart ||
        yearStart > newEnd ||
        yearEnd < newStart ||
        yearEnd > newEnd
      ) {
        setYearParams({
          yearEnd: newEnd,
          yearStart: newStart,
        });
      }

      // Reset network filter when provider changes
      setSelectedNetworks(new Set());
    }
  }, [selectedProvider, yearStart, yearEnd, setYearParams]);

  // Track container width for fill-space mode
  useEffect(() => {
    const container = document.querySelector("[data-timeline-container]");

    if (!container) {
      // Fallback if container not found yet
      const timeoutId = setTimeout(() => {
        setContainerWidth(window.innerWidth - 300);
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    // Use ResizeObserver for accurate container size tracking
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0 && Math.abs(width - containerWidth) > 10) {
          // Only update if significant change
          setContainerWidth(width);
        }
      }
    });

    resizeObserver.observe(container);

    // Also set initial width immediately
    setContainerWidth(container.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerWidth]);

  // Validate provider and redirect if invalid
  useEffect(() => {
    if (!validProviderIds.includes(providerId)) {
      // Redirect to the first available provider
      const firstProviderId = validProviderIds[0];
      if (firstProviderId) {
        router.replace(`/channellist/history/${firstProviderId}`);
      }
    }
  }, [providerId, validProviderIds, router]);

  // Handle provider change
  const handleProviderChange = (newProviderId: string) => {
    router.push(`/channellist/history/${newProviderId}`);
  };

  // Navigation functions
  const handlePrevProvider = () => {
    const currentIndex = validProviderIds.indexOf(providerId);
    if (currentIndex > 0) {
      const prevProviderId = validProviderIds[currentIndex - 1];
      handleProviderChange(prevProviderId);
    }
  };

  const handleNextProvider = () => {
    const currentIndex = validProviderIds.indexOf(providerId);
    if (currentIndex < validProviderIds.length - 1) {
      const nextProviderId = validProviderIds[currentIndex + 1];
      handleProviderChange(nextProviderId);
    }
  };

  // Filter timeline data based on year range and network
  const filteredTimelineData = useMemo(() => {
    if (!selectedProvider) {
      return null;
    }

    type ChannelItem = {
      channel_name: string;
      channel_genre?: string;
      channel_network?: string;
      channel_notes?: string;
      from: number | string;
      to?: number | string;
    };

    type EventItem = {
      when: number;
      label: string;
      type: string;
      note?: string;
      href?: string;
    };

    // Check if no filters are applied
    const isFullRange =
      debouncedYearRange[0] === selectedProvider.data.axis.start &&
      debouncedYearRange[1] === selectedProvider.data.axis.end;
    const hasNetworkFilter = selectedNetworks.size > 0;

    // If no filters applied, return original data
    if (isFullRange && !hasNetworkFilter) {
      return selectedProvider.data;
    }

    // Helper: check if channel item overlaps with year range
    const itemOverlapsRange = (item: ChannelItem): boolean => {
      const itemStart = Number(item.from);
      const itemEnd = item.to
        ? Number(item.to)
        : selectedProvider.data.axis.end;
      return (
        itemEnd >= debouncedYearRange[0] && itemStart <= debouncedYearRange[1]
      );
    };

    // Helper: check if channel item matches network filter
    const itemMatchesNetwork = (item: ChannelItem): boolean => {
      if (!hasNetworkFilter) {
        return true;
      }
      return item.channel_network
        ? selectedNetworks.has(item.channel_network)
        : false;
    };

    // Helper: check if event is within year range
    const eventInRange = (event: EventItem): boolean => {
      const eventYear = Number(event.when);
      return (
        eventYear >= debouncedYearRange[0] && eventYear <= debouncedYearRange[1]
      );
    };

    // Filter channels
    const filteredChannels: Record<string, ChannelItem[]> = {};
    for (const [channelId, items] of Object.entries(
      selectedProvider.data.channels
    )) {
      const filtered = (items as ChannelItem[]).filter(
        (item) => itemOverlapsRange(item) && itemMatchesNetwork(item)
      );
      if (filtered.length > 0) {
        filteredChannels[channelId] = filtered;
      }
    }

    // Filter events
    const filteredEvents = (
      selectedProvider.data.events as EventItem[] | undefined
    )?.filter(eventInRange);

    return {
      ...selectedProvider.data,
      axis: {
        ...selectedProvider.data.axis,
        end: debouncedYearRange[1],
        start: debouncedYearRange[0],
      },
      channels: filteredChannels,
      events: filteredEvents,
    };
  }, [selectedProvider, debouncedYearRange, selectedNetworks]);

  // Get color configuration from provider
  const colorBy = selectedProvider?.colorBy || "channel_genre";
  const colorMap = selectedProvider?.colorMap;

  // Get all available networks from the original provider data (not filtered)
  const availableNetworks = useMemo(() => {
    if (!selectedProvider) {
      return new Set<string>();
    }

    type ChannelItem = {
      channel_name: string;
      channel_genre?: string;
      channel_network?: string;
      channel_notes?: string;
      from: number | string;
      to?: number | string;
    };

    const networks = new Set<string>();

    // Check all channels in the original provider data
    for (const items of Object.values(selectedProvider.data.channels)) {
      for (const item of items as ChannelItem[]) {
        if (item.channel_network) {
          networks.add(item.channel_network);
        }
      }
    }

    return networks;
  }, [selectedProvider]);

  // Extract indicators and color values from the filtered data
  const { activeIndicators, activeColorValues } = useMemo(() => {
    if (!filteredTimelineData) {
      return {
        activeColorValues: new Set<string>(),
        activeIndicators: new Set<string>(),
      };
    }

    const indicators = new Set<string>();
    const colorValues = new Set<string>();

    // Check all channels for indicators and color values
    for (const items of Object.values(filteredTimelineData.channels)) {
      processChannelItems(items, indicators, colorValues, colorBy);
    }

    return {
      activeColorValues: colorValues,
      activeIndicators: indicators,
    };
  }, [filteredTimelineData, colorBy]);

  // Set all networks as selected by default when availableNetworks changes
  useEffect(() => {
    if (availableNetworks.size > 0 && selectedNetworks.size === 0) {
      setSelectedNetworks(new Set(availableNetworks));
    }
  }, [availableNetworks, selectedNetworks.size]);

  // Calculate pixels per year based on spacing mode
  const pxPerYear = useMemo(() => {
    if (!filteredTimelineData) {
      return;
    }

    return calculatePxPerYear({
      isMobile,
      mode: spacingMode,
      timelineEnd: filteredTimelineData.axis.end,
      timelineStart: filteredTimelineData.axis.start,
      viewportWidth: containerWidth,
    });
  }, [spacingMode, isMobile, containerWidth, filteredTimelineData]);

  // Preserve scroll position during re-renders
  useEffect(() => {
    const container = document.querySelector("[data-timeline-container]");
    if (!container) {
      return;
    }

    const handleScroll = () => {
      scrollPositionRef.current = {
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
    };

    const restoreScroll = () => {
      if (scrollPositionRef.current) {
        container.scrollLeft = scrollPositionRef.current.scrollLeft;
        container.scrollTop = scrollPositionRef.current.scrollTop;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    // Restore scroll position after a brief delay to allow for layout
    const timeoutId = setTimeout(restoreScroll, 0);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Create the sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        {" "}
        {selectedProvider && (
          <div className="rounded-md bg-muted p-3">
            <div className="mb-1 flex items-center gap-2">
              <Tv className="h-3 w-3" />
              <span className="font-medium text-xs">
                {selectedProvider.name}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              {selectedProvider.description}
            </p>
            <div className="mt-2 flex gap-1">
              <Badge className="text-xs" variant="outline">
                {selectedProvider.country}
              </Badge>
              <Badge className="text-xs" variant="outline">
                {selectedProvider.data.axis.start}-
                {selectedProvider.data.axis.end}
              </Badge>
            </div>
          </div>
        )}
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          <div className="pt-2">
            {Object.entries(providersByCategory).map(
              ([category, providers]) => (
                <div className="mb-4" key={category}>
                  <h4 className="mb-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {providers.map((provider) => (
                      <Button
                        className="w-full justify-start"
                        key={provider.id}
                        onClick={() => handleProviderChange(provider.id)}
                        variant={
                          providerId === provider.id ? "secondary" : "ghost"
                        }
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tv className="h-4 w-4" />
                            <span className="text-sm">{provider.name}</span>
                          </div>
                          {providerId === provider.id && (
                            <Badge className="ml-2 text-xs" variant="default">
                              Active
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter>
        <ChannelHistorySidebar
          activeColorValues={activeColorValues}
          activeIndicators={activeIndicators}
          availableNetworks={availableNetworks}
          colorBy={colorBy}
          colorMap={colorMap}
          isGenresOpen={isGenresOpen}
          isIndicatorsOpen={isIndicatorsOpen}
          isNetworksOpen={isNetworksOpen}
          isYearRangeOpen={isYearRangeOpen}
          onGenresOpenChange={setIsGenresOpen}
          onIndicatorsOpenChange={setIsIndicatorsOpen}
          onNetworksOpenChange={setIsNetworksOpen}
          onNetworksReset={() => setSelectedNetworks(new Set())}
          onNetworkToggle={(network, checked) => {
            const newNetworks = new Set(selectedNetworks);
            if (checked) {
              newNetworks.add(network);
            } else {
              newNetworks.delete(network);
            }
            setSelectedNetworks(newNetworks);
          }}
          onYearRangeChange={(value) =>
            setYearParams({
              yearEnd: value[1],
              yearStart: value[0],
            })
          }
          onYearRangeOpenChange={setIsYearRangeOpen}
          onYearRangeReset={() =>
            setYearParams({
              yearEnd: selectedProvider.data.axis.end,
              yearStart: selectedProvider.data.axis.start,
            })
          }
          selectedNetworks={selectedNetworks}
          selectedProvider={selectedProvider}
          yearRange={yearRange}
        />
      </SidebarFooter>
    </SidebarContainer>
  );

  // Header actions for the sidebar layout (similar to EPG)
  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          disabled={validProviderIds.indexOf(providerId) === 0}
          onClick={handlePrevProvider}
          size="icon"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Select onValueChange={handleProviderChange} value={providerId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(providersByCategory).map(
              ([category, providers]) => (
                <div key={category}>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({provider.data.axis.start}-{provider.data.axis.end})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              )
            )}
          </SelectContent>
        </Select>

        <Button
          disabled={
            validProviderIds.indexOf(providerId) === validProviderIds.length - 1
          }
          onClick={handleNextProvider}
          size="icon"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Spacing selector */}
      <TimelineSpacingSelector onChange={setSpacingMode} value={spacingMode} />
    </div>
  );

  // Show loading state while validating/redirecting
  if (!selectedProvider) {
    return <LoadingState text="Loading channel history..." />;
  }

  // Create the page title
  const pageTitle = `${selectedProvider.name} Channel History`;

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="overflow-hidden p-0"
      sidebar={sidebar}
      title={pageTitle}
    >
      <div
        className="flex h-full flex-col"
        data-timeline-container
        style={{
          contain: "layout style paint",
          willChange: "scroll-position",
        }}
      >
        {filteredTimelineData && (
          <TimelineUnified
            colorBy={colorBy}
            colorMap={colorMap}
            doc={filteredTimelineData}
            onEventClick={() => {
              // Handle event click
            }}
            onSpanClick={() => {
              // Handle span click
            }}
            pxPerYear={pxPerYear}
          />
        )}
      </div>
    </SidebarLayout>
  );
}
