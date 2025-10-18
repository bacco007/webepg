"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Tv,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
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

  // Legend collapse state
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isGenresOpen, setIsGenresOpen] = useState(false);

  // Year range filter state
  const [yearRange, setYearRange] = useState<[number, number]>([
    selectedProvider?.data.axis.start ?? 1990,
    selectedProvider?.data.axis.end ?? 2025,
  ]);

  // Debounce year range changes to improve performance (300ms delay)
  const debouncedYearRange = useDebounce(yearRange, 300);

  // Reset year range when provider changes
  useEffect(() => {
    if (selectedProvider) {
      setYearRange([
        selectedProvider.data.axis.start,
        selectedProvider.data.axis.end,
      ]);
    }
  }, [selectedProvider]);

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
        if (width > 0) {
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
  }, []);

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

  // Create the sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Select Provider</h3>
          <p className="text-muted-foreground text-xs">
            Choose a TV provider to view its channel history
          </p>
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          {Object.entries(providersByCategory).map(([category, providers]) => (
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
                    variant={providerId === provider.id ? "secondary" : "ghost"}
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
          ))}
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter>
        <div className="space-y-3">
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

          <Separator />

          {/* Year Range Filter */}
          {selectedProvider && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-xs">
                  Filter by Year Range
                </Label>
                <Button
                  className="h-6 px-2"
                  onClick={() =>
                    setYearRange([
                      selectedProvider.data.axis.start,
                      selectedProvider.data.axis.end,
                    ])
                  }
                  size="sm"
                  variant="ghost"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                <Slider
                  max={selectedProvider.data.axis.end}
                  min={selectedProvider.data.axis.start}
                  onValueChange={(value) => setYearRange([value[0], value[1]])}
                  step={1}
                  value={yearRange}
                />
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>{Math.floor(yearRange[0])}</span>
                  <span>–</span>
                  <span>{Math.floor(yearRange[1])}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Channel Type Indicators */}
          <Collapsible
            onOpenChange={setIsIndicatorsOpen}
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
              <div className="space-y-1.5">
                <div
                  className="flex items-center gap-2 rounded-md border-2 bg-muted px-2 py-1.5"
                  style={{ borderColor: "#a855f7" }}
                >
                  <div
                    className="h-3 w-3 rounded border-2"
                    style={{ borderColor: "#a855f7" }}
                  />
                  <span className="text-xs">4K / UHD / Ultra HD</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-md border-2 bg-muted px-2 py-1.5"
                  style={{ borderColor: "#3b82f6" }}
                >
                  <div
                    className="h-3 w-3 rounded border-2"
                    style={{ borderColor: "#3b82f6" }}
                  />
                  <span className="text-xs">HD Channels</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-md border-2 bg-muted px-2 py-1.5"
                  style={{ borderColor: "#f97316" }}
                >
                  <div
                    className="h-3 w-3 rounded border-2"
                    style={{ borderColor: "#f97316" }}
                  />
                  <span className="text-xs">+2 Channels</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Genre Colors Legend */}
          <Collapsible onOpenChange={setIsGenresOpen} open={isGenresOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
              <h4 className="font-semibold text-xs">Legend: Channel Genres</h4>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isGenresOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(GENRE_COLORS)
                  .filter(([genre]) => genre !== "Default")
                  .map(([genre, colorClass]) => (
                    <div
                      className={`rounded-md border px-2 py-1 text-center ${colorClass}`}
                      key={genre}
                    >
                      <span className="text-xs">{genre}</span>
                    </div>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // Filter timeline data based on year range
  const filteredTimelineData = useMemo(() => {
    try {
      if (!selectedProvider) {
        return null;
      }

      // Check if the year range matches the full range (no filtering needed)
      const isFullRange =
        debouncedYearRange[0] === selectedProvider.data.axis.start &&
        debouncedYearRange[1] === selectedProvider.data.axis.end;

      if (isFullRange) {
        return selectedProvider.data;
      }

      type ChannelItem = {
        channel_name: string;
        channel_genre?: string;
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

      // Filter channels to only include spans that overlap with the year range
      const filteredChannels: Record<string, ChannelItem[]> = {};

      for (const [channelId, items] of Object.entries(
        selectedProvider.data.channels
      )) {
        const filteredItems = (items as ChannelItem[]).filter((item) => {
          try {
            const itemStart = Number(item.from);
            const itemEnd = item.to
              ? Number(item.to)
              : selectedProvider.data.axis.end;

            // Check if the item overlaps with the selected year range
            return (
              itemEnd >= debouncedYearRange[0] &&
              itemStart <= debouncedYearRange[1]
            );
          } catch {
            // Silently skip invalid items
            return false;
          }
        });

        if (filteredItems.length > 0) {
          filteredChannels[channelId] = filteredItems;
        }
      }

      // Filter events to only include those within the year range
      const filteredEvents = (
        selectedProvider.data.events as EventItem[] | undefined
      )?.filter((event) => {
        try {
          const eventYear = Number(event.when);
          return (
            eventYear >= debouncedYearRange[0] &&
            eventYear <= debouncedYearRange[1]
          );
        } catch {
          // Silently skip invalid events
          return false;
        }
      });

      const filtered = {
        ...selectedProvider.data,
        axis: {
          ...selectedProvider.data.axis,
          end: debouncedYearRange[1],
          start: debouncedYearRange[0],
        },
        channels: filteredChannels,
        events: filteredEvents,
      };

      return filtered;
    } catch {
      // Return unfiltered data as fallback on error
      return selectedProvider?.data ?? null;
    }
  }, [selectedProvider, debouncedYearRange]);

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
      <div className="flex h-full flex-col" data-timeline-container>
        {filteredTimelineData && (
          <TimelineUnified
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
