"use client";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
// Use your existing hook
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate, isDateToday, parseISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ChannelRow } from "./channel-row";
import { CurrentTimeIndicator } from "./current-time-indicator";
import { DebugPanel } from "./debug-panel";
import { ListView } from "./list-view";
import { ProgramDetails } from "./program-details";
import { TimeHeader } from "./time-header";
import type {
  Channel,
  ChannelData,
  ChannelsResponse,
  DateData,
  Program,
  TVGuideData,
} from "./types";
import {
  getChannelName,
  sortChannelsByNetwork,
  sortChannelsByNumber,
  sortChannelsWithinNetwork,
} from "./utils";

// Mobile navigation component
const MobileNavigation = ({
  availableDates,
  selectedDate,
  setSelectedDate,
  formatDateLabelFn,
}: {
  availableDates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  formatDateLabelFn: (date: string, isLong?: boolean) => string;
}) => {
  const currentIndex = availableDates.indexOf(selectedDate);
  const prevDate = currentIndex > 0 ? availableDates[currentIndex - 1] : null;
  const nextDate =
    currentIndex < availableDates.length - 1
      ? availableDates[currentIndex + 1]
      : null;

  return (
    <div className="mb-2 flex items-center justify-between px-2">
      <Button
        className="w-[80px] justify-start"
        disabled={!prevDate}
        onClick={() => prevDate && setSelectedDate(prevDate)}
        size="sm"
        variant="outline"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {prevDate ? formatDateLabelFn(prevDate) : "Prev"}
      </Button>

      <div className="text-center font-medium text-sm">
        {formatDateLabelFn(selectedDate, true)}
      </div>

      <Button
        className="w-[80px] justify-end"
        disabled={!nextDate}
        onClick={() => nextDate && setSelectedDate(nextDate)}
        size="sm"
        variant="outline"
      >
        {nextDate ? formatDateLabelFn(nextDate) : "Next"}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

// Mobile time navigation component
const MobileTimeNav = ({
  jumpToTime,
}: {
  jumpToTime: (hour: number) => void;
}) => (
  <div className="no-scrollbar mb-1 flex gap-1 overflow-x-auto px-2 py-1">
    {[6, 9, 12, 15, 18, 21, 0].map((hour) => (
      <Button
        className="h-8 shrink-0 px-2 py-1 text-xs"
        key={hour}
        onClick={() => jumpToTime(hour)}
        size="sm"
        variant="outline"
      >
        {hour === 0 ? "00:00" : `${hour}:00`}
      </Button>
    ))}
  </div>
);

// Grid view component
const GridView = ({
  data,
  processedChannels,
  hourWidth,
  actualRowHeight,
  currentTime,
  date,
  rowHeight,
  handleProgramSelect,
  timelineRef,
  scrollContainerRef,
  dataSource,
  displayNameType,
}: {
  data: TVGuideData;
  processedChannels: Channel[];
  hourWidth: number;
  actualRowHeight: number;
  currentTime: Date;
  date: string;
  rowHeight: number;
  handleProgramSelect: (program: Program) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  dataSource?: string;
  displayNameType: "clean" | "real" | "location";
}) => {
  // Collect sticky overlays for all channels
  const stickyOverlays: Array<{
    key: string;
    top: number;
    width: number;
    height: number;
    title: string;
  }> = [];
  for (let rowIndex = 0; rowIndex < processedChannels.length; rowIndex += 1) {
    const channel = processedChannels[rowIndex];
    // Calculate program positions as in ChannelRow
    const uniquePrograms = new Map<string, Program>();
    for (const program of channel.programs) {
      const programId =
        program.guideid || `${program.start_time}-${program.title}`;
      if (!uniquePrograms.has(programId)) {
        uniquePrograms.set(programId, program);
      }
    }
    const programs = Array.from(uniquePrograms.values())
      .sort(
        (a, b) =>
          parseISODate(a.start_time).getTime() -
          parseISODate(b.start_time).getTime()
      )
      .map((program) => {
        const startTime = parseISODate(program.start_time);
        const endTime = parseISODate(program.end_time);
        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
        const endHour = endTime.getHours() + endTime.getMinutes() / 60;
        const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;
        const left = startHour * hourWidth;
        const width = Math.max((adjustedEndHour - startHour) * hourWidth, 10);
        return { ...program, left, width };
      });
    for (const program of programs) {
      if (program.left < 0 && program.width + program.left > 0) {
        const visibleWidth = Math.max(
          0,
          Math.min(program.width + program.left, program.width)
        );
        stickyOverlays.push({
          height: actualRowHeight,
          key: `sticky-${program.guideid || `${channel.channel.id}-${program.start_time}`}-${channel.channel.lcn}`,
          title: program.title,
          top: rowIndex * actualRowHeight,
          width: visibleWidth,
        });
      }
    }
  }

  return (
    <ScrollArea className="h-full" ref={timelineRef}>
      {/* Horizontal scrollbar at the top */}
      <ScrollBar orientation="horizontal" />
      <div className="grid grid-cols-[180px_1fr]" ref={scrollContainerRef}>
        {/* Channel sidebar - fixed position */}
        <div className="sticky left-0 z-10 border-r bg-card">
          <div className="flex h-12 items-center border-b px-4 font-medium">
            Channels{" "}
            {processedChannels.length !== data.channels.length &&
              `(${processedChannels.length})`}
          </div>
          <div className="flex flex-col">
            {processedChannels.map((channel, index) => (
              <div
                className={
                  index < processedChannels.length - 1 ? "border-b" : ""
                }
                key={`${channel.channel.id}-${channel.channel.lcn}`}
                style={{ height: `${actualRowHeight}px` }}
              >
                <div className="flex h-full items-center px-4 py-1">
                  <div className="flex items-center gap-3">
                    <div className="flex w-10 flex-col items-center">
                      <img
                        alt={channel.channel.name.clean}
                        className="h-8 w-8 object-contain"
                        src={channel.channel.icon.light || "/placeholder.svg"}
                      />
                    </div>
                    <div className="flex max-w-[120px] flex-col">
                      <div className="line-clamp-2 font-medium">
                        <Link
                          className={cn(
                            "wrap-break-word block font-medium text-xs hover:underline"
                          )}
                          href={`/channel/${channel.channel.slug}?source=${dataSource}`}
                        >
                          {channel.channel.name[displayNameType] ||
                            channel.channel.name.clean}
                        </Link>
                      </div>
                      {channel.channel.lcn && channel.channel.lcn !== "N/A" && (
                        <Badge
                          className="mt-1 w-fit px-1 py-0 text-[10px]"
                          variant="outline"
                        >
                          {channel.channel.lcn}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline and programs */}
        <div className="relative">
          <TimeHeader hourWidth={hourWidth} />
          <div className="relative" style={{ width: `${hourWidth * 24}px` }}>
            {/* Sticky overlays for all rows */}
            {stickyOverlays.map((overlay) => (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 z-30 flex items-center bg-transparent"
                key={overlay.key}
                style={{
                  height: `${overlay.height}px`,
                  top: `${overlay.top}px`,
                  width: `${overlay.width}px`,
                }}
              >
                <div
                  className="truncate bg-background/80 px-2 py-1 font-semibold text-xs shadow"
                  style={{ width: "100%" }}
                >
                  {overlay.title}
                </div>
              </div>
            ))}
            <CurrentTimeIndicator hourWidth={hourWidth} />
            {processedChannels.map((channel) => (
              <ChannelRow
                channel={channel}
                currentTime={currentTime}
                date={date}
                hourWidth={hourWidth}
                key={`${channel.channel.id}-${channel.channel.lcn}`}
                onProgramSelect={handleProgramSelect}
                rowHeight={rowHeight}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

// No channels found component
const NoChannelsFound = () => (
  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
    <div className="mb-2 text-muted-foreground">
      <Search className="mx-auto mb-4 size-12 opacity-20" />
      <h3 className="font-medium text-lg">No channels found</h3>
      <p className="text-sm">Try adjusting your search or filter criteria</p>
    </div>
  </div>
);

// Program details sheet component
const ProgramDetailsSheet = ({
  isProgramDetailsOpen,
  setIsProgramDetailsOpen,
  selectedProgram,
}: {
  isProgramDetailsOpen: boolean;
  setIsProgramDetailsOpen: (open: boolean) => void;
  selectedProgram: Program | null;
}) => (
  <Sheet onOpenChange={setIsProgramDetailsOpen} open={isProgramDetailsOpen}>
    <SheetContent className="h-[80vh] overflow-hidden p-0" side="bottom">
      <SheetHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-left">
            {selectedProgram?.title}
          </SheetTitle>
          <SheetClose className="flex h-8 w-8 items-center justify-center rounded-full">
            <X className="h-4 w-4" />
          </SheetClose>
        </div>
      </SheetHeader>
      <div className="h-full overflow-auto pb-safe">
        {selectedProgram && <ProgramDetails program={selectedProgram} />}
      </div>
    </SheetContent>
  </Sheet>
);

// Format date for mobile display
const formatDateLabel = (dateStr: string, isLong = false) => {
  if (!dateStr) {
    return "";
  }

  const dateObj = parseISODate(
    `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
  );

  if (isDateToday(dateObj)) {
    return isLong ? "Today" : "Today";
  }

  return isLong
    ? formatDate(dateObj, "EEE, MMM d")
    : formatDate(dateObj, "EEE");
};

interface TVGuideProps {
  initialDate?: string;
  initialViewMode?: "grid" | "list";
  channelFilters?: string[];
  categoryFilters?: string[];
  networkFilters?: string[];
  searchTerm?: string;
  className?: string;
  hideDateHeader?: boolean;
  dataSource?: string;
  timezone?: string;
  rowHeight?: number;
  channelNetworkMap?: Record<string, string>;
  displayNameType?: "clean" | "real" | "location";
  sortBy?: string;
  groupBy?: string;
  debug?: boolean;
}

// Main TV Guide Component
export function TVGuide({
  initialDate = "",
  initialViewMode = "grid",
  channelFilters = [],
  categoryFilters = [],
  networkFilters = [],
  searchTerm = "",
  className = "",
  hideDateHeader = false,
  dataSource, // Remove default value to prevent automatic fetching
  timezone = "Australia/Sydney",
  rowHeight = 70,
  channelNetworkMap = {},
  displayNameType = "clean",
  sortBy = "channelNumber",
  groupBy = "none",
  debug = false, // Disable debug by default, enable only when needed
}: TVGuideProps) {
  const [data, setData] = useState<TVGuideData | null>(null);
  const [channelList, setChannelList] = useState<ChannelData[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState(searchTerm);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [currentTime] = useState(new Date());
  const isMobile = useIsMobile();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [deduplicationStrategy, setDeduplicationStrategy] =
    useState<string>("none");

  // Hour width in pixels - smaller on mobile
  const hourWidth = isMobile ? 150 : 200;

  // Update state when props change
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate, selectedDate]);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => {
    setChannelFilter(searchTerm);
  }, [searchTerm]);

  // Fetch available dates if not provided
  useEffect(() => {
    // Only fetch if we have a dataSource and it's not the initial render
    if (availableDates.length === 0 && dataSource && timezone) {
      fetchAvailableDates(
        dataSource,
        timezone,
        setAvailableDates,
        setSelectedDate,
        selectedDate,
        setLoading
      );
    }
  }, [availableDates.length, selectedDate, dataSource, timezone]);

  // Fetch channel list first
  useEffect(() => {
    if (!dataSource) {
      return;
    }

    fetchChannelList(dataSource, setChannelList, setError, setLoading, debug);
  }, [dataSource, debug]);

  // Fetch guide data when selected date changes
  useEffect(() => {
    if (!(selectedDate && dataSource && timezone) || channelList.length === 0) {
      return;
    }

    fetchGuideData(
      selectedDate,
      dataSource,
      timezone,
      channelList,
      setData,
      setError,
      setLoading,
      debug
    );
  }, [selectedDate, dataSource, timezone, channelList, debug]);

  // Scroll to current time on initial load
  useEffect(() => {
    if (timelineRef.current && !loading && viewMode === "grid") {
      const scrollableElement = timelineRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;
      if (scrollableElement) {
        const now = new Date();
        const currentHour = now.getHours();
        const scrollPosition = currentHour * hourWidth - (isMobile ? 50 : 200); // Scroll to current hour minus some offset

        // Use smooth scrolling for initial load
        scrollableElement.scrollTo({
          behavior: "smooth",
          left: Math.max(0, scrollPosition),
        });
      }
    }
  }, [loading, hourWidth, viewMode, isMobile]);

  // Set first channel as selected when data loads or when changing view mode to list
  useEffect(() => {
    if (
      data?.channels &&
      data.channels.length > 0 &&
      viewMode === "list" &&
      !selectedChannelId
    ) {
      setSelectedChannelId(data.channels[0].channel.id);
    }
  }, [data, viewMode, selectedChannelId]);

  // Handle program selection
  const handleProgramSelect = useCallback((program: Program) => {
    setSelectedProgram(program);
    setIsProgramDetailsOpen(true);
  }, []);

  // Jump to time function
  const jumpToTime = (hour: number) => {
    if (timelineRef.current && viewMode === "grid") {
      // Get the scrollable element inside the ScrollArea
      const scrollableElement = timelineRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;
      if (scrollableElement) {
        const scrollPosition = hour * hourWidth;

        // Use smooth scrolling for a nice transition
        scrollableElement.scrollTo({
          behavior: "smooth",
          left: scrollPosition,
        });
      }
    }
  };

  // Handle touch events for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsScrolling(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) {
      return;
    }

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    // Calculate distance moved
    const deltaX = touchStartX - touchX;
    const deltaY = touchStartY - touchY;

    // If vertical scrolling is dominant, mark as scrolling
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || isScrolling) {
      setTouchStartX(null);
      setTouchStartY(null);
      setIsScrolling(false);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;

    // If horizontal swipe is significant
    if (Math.abs(deltaX) > 50) {
      // Swipe left (next date)
      if (deltaX > 0) {
        const currentIndex = availableDates.indexOf(selectedDate);
        if (currentIndex < availableDates.length - 1) {
          setSelectedDate(availableDates[currentIndex + 1]);
        }
      }
      // Swipe right (previous date)
      else {
        const currentIndex = availableDates.indexOf(selectedDate);
        if (currentIndex > 0) {
          setSelectedDate(availableDates[currentIndex - 1]);
        }
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Handle deduplication strategy change
  const handleDeduplicationStrategyChange = (strategy: string) => {
    setDeduplicationStrategy(strategy);
    if (debug) {
      //
    }
  };

  // Sort and group channels based on settings
  const processedChannels = useMemo(() => {
    if (!data?.channels) {
      return [];
    }

    // First filter channels
    let channels = data.channels.filter((channel) => {
      // First apply search filter
      const searchMatch =
        !channelFilter ||
        channel.channel.name.clean
          .toLowerCase()
          .includes(channelFilter.toLowerCase()) ||
        channel.channel.lcn.includes(channelFilter);

      // Then apply channel name filters - check if any filter matches the channel name
      const channelNameMatch =
        channelFilters.length === 0 ||
        channelFilters.some((filter) => {
          // Split the filter to check if it contains both ID and LCN
          const parts = filter.split("|");
          if (parts.length === 2) {
            // If filter has ID|LCN format, match both ID and LCN exactly
            return (
              channel.channel.id === parts[0] &&
              channel.channel.lcn === parts[1]
            );
          }
          // Otherwise just check the name
          return channel.channel.name.clean === filter;
        });

      // Apply category filters if any
      const categoryMatch =
        categoryFilters.length === 0 ||
        channel.programs.some((program) =>
          program.categories?.some((category) =>
            categoryFilters.includes(category)
          )
        );

      // Apply network filters if any
      // Use the channelNetworkMap to determine the network for this channel
      const channelNetwork = channelNetworkMap[channel.channel.id];
      const networkMatch =
        networkFilters.length === 0 ||
        (channelNetwork && networkFilters.includes(channelNetwork));

      return searchMatch && channelNameMatch && categoryMatch && networkMatch;
    });

    // Apply deduplication strategy
    if (deduplicationStrategy !== "none") {
      // Create a map to track unique channels based on the selected strategy
      const uniqueChannelMap = new Map<string, boolean>();

      // Filter out duplicate channels based on the selected strategy
      channels = channels.filter((channel) => {
        let key: string;

        if (deduplicationStrategy === "id-only") {
          // Deduplicate by ID only
          key = channel.channel.id;
        } else {
          // Deduplicate by ID + LCN (default)
          key = `${channel.channel.id}-${channel.channel.lcn}`;
        }

        if (uniqueChannelMap.has(key)) {
          return false;
        }
        uniqueChannelMap.set(key, true);
        return true;
      });
    }

    // Then sort channels
    channels = [...channels].sort((a, b) => {
      if (sortBy === "channelNumber") {
        return sortChannelsByNumber(a, b, displayNameType);
      }
      if (sortBy === "channelName") {
        return getChannelName(a, displayNameType).localeCompare(
          getChannelName(b, displayNameType)
        );
      }
      if (sortBy === "networkName") {
        return sortChannelsByNetwork(a, b, channelNetworkMap, displayNameType);
      }
      return 0;
    });

    // Group channels if needed
    if (groupBy === "network") {
      // Create a map of networks to channels
      const networkGroups: Record<string, Channel[]> = {};

      for (const channel of channels) {
        const network = channelNetworkMap[channel.channel.id] || "Unknown";
        if (!networkGroups[network]) {
          networkGroups[network] = [];
        }
        networkGroups[network].push(channel);
      }

      // Flatten the grouped channels
      const groupedChannels: Channel[] = [];
      for (const network of Object.keys(networkGroups).sort()) {
        // Sort channels within each network group
        const sortedNetworkChannels = [...networkGroups[network]].sort((a, b) =>
          sortChannelsWithinNetwork(a, b, displayNameType)
        );

        groupedChannels.push(...sortedNetworkChannels);
      }

      return groupedChannels;
    }

    return channels;
  }, [
    data,
    channelFilter,
    channelFilters,
    categoryFilters,
    networkFilters,
    channelNetworkMap,
    sortBy,
    groupBy,
    deduplicationStrategy,
    displayNameType,
  ]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading TV guide data...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const date = data.date;
  const formattedDate = date
    ? formatDate(parseISODate(date), "EEEE, do MMMM yyyy")
    : "";

  // Calculate the actual row height with padding
  const actualRowHeight = rowHeight + 2; // Match the +2 in ChannelRow

  return (
    <div
      className={`flex h-full flex-col ${className}`}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      style={{ width: "100%" }}
    >
      {!(hideDateHeader || isMobile) && (
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-2xl">Daily EPG - {formattedDate}</h1>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  disabled={viewMode !== "grid"}
                  onClick={() => jumpToTime(6)}
                  size="sm"
                  variant="outline"
                >
                  06:00
                </Button>
                <Button
                  disabled={viewMode !== "grid"}
                  onClick={() => jumpToTime(12)}
                  size="sm"
                  variant="outline"
                >
                  12:00
                </Button>
                <Button
                  disabled={viewMode !== "grid"}
                  onClick={() => jumpToTime(18)}
                  size="sm"
                  variant="outline"
                >
                  18:00
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation */}
      {isMobile && (
        <MobileNavigation
          availableDates={availableDates}
          formatDateLabelFn={formatDateLabel}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
      {isMobile && <MobileTimeNav jumpToTime={jumpToTime} />}

      <div
        className={`relative min-h-0 flex-1 overflow-hidden rounded-md border bg-background ${hideDateHeader ? "" : ""}`}
        style={{ width: isMobile ? "100%" : "calc(100%)" }}
      >
        {processedChannels.length === 0 && <NoChannelsFound />}
        {processedChannels.length > 0 && viewMode === "grid" && (
          <GridView
            actualRowHeight={actualRowHeight}
            currentTime={currentTime}
            data={data}
            dataSource={dataSource}
            date={date}
            displayNameType={displayNameType}
            handleProgramSelect={handleProgramSelect}
            hourWidth={hourWidth}
            isMobile={isMobile}
            processedChannels={processedChannels}
            rowHeight={rowHeight}
            scrollContainerRef={scrollContainerRef}
            timelineRef={timelineRef}
          />
        )}
        {processedChannels.length > 0 && viewMode !== "grid" && (
          <ListView
            channels={processedChannels}
            className={hideDateHeader ? "h-full" : "h-[calc(100vh-230px)]"}
            currentTime={currentTime}
            dataSource={dataSource}
            displayNameType={displayNameType}
            onProgramSelect={handleProgramSelect}
          />
        )}
      </div>

      {/* Program details sheet for mobile */}
      {isMobile && (
        <ProgramDetailsSheet
          isProgramDetailsOpen={isProgramDetailsOpen}
          selectedProgram={selectedProgram}
          setIsProgramDetailsOpen={setIsProgramDetailsOpen}
        />
      )}

      {/* Debug Panel */}
      {debug && data && (
        <DebugPanel
          currentStrategy={deduplicationStrategy}
          onToggleDeduplication={handleDeduplicationStrategyChange}
          processedChannels={processedChannels}
          rawChannels={data.channels}
        />
      )}
    </div>
  );
}

// Helper function to fetch available dates
const fetchAvailableDates = async (
  dataSource: string,
  timezone: string,
  setAvailableDates: (dates: string[]) => void,
  setSelectedDate: (date: string) => void,
  selectedDate: string,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    const response = await fetch(
      `/api/py/dates/${dataSource}?timezone=${encodeURIComponent(timezone)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch dates: ${response.status}`);
    }
    const result: DateData = await response.json();
    setAvailableDates(result.data);

    // Set the default selected date to the first available date if not already set
    if (result.data.length > 0 && !selectedDate) {
      setSelectedDate(result.data[0]);
    }
  } catch (_err) {
    //
  } finally {
    setLoading(false);
  }
};

// Helper function to fetch channel list
const fetchChannelList = async (
  dataSource: string,
  setChannelList: (channels: ChannelData[]) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  debug: boolean
) => {
  try {
    setLoading(true);
    const response = await fetch(`/api/py/channels/${dataSource}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.status}`);
    }
    const result: ChannelsResponse = await response.json();

    // Log the channel data for debugging
    if (debug) {
      //
    }

    // Store the channel list
    setChannelList(result.data.channels);
  } catch (err) {
    setError(err instanceof Error ? err.message : "An unknown error occurred");
  } finally {
    setLoading(false);
  }
};

// Helper function to fetch guide data
const fetchGuideData = async (
  selectedDate: string,
  dataSource: string,
  timezone: string,
  channelList: ChannelData[],
  setData: (data: TVGuideData | null) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  debug: boolean
) => {
  try {
    setLoading(true);
    const response = await fetch(
      `/api/py/epg/date/${selectedDate}/${dataSource}?timezone=${encodeURIComponent(timezone)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    const result: TVGuideData = await response.json();

    // Log the raw data for debugging
    if (debug) {
      //
    }

    // Create a map of channel ID to programs
    const programsByChannelId: Record<string, Program[]> = {};

    // Process the programs from the result
    if (result.channels) {
      for (const channel of result.channels) {
        // Use only channel ID as the key
        const channelId = channel.channel.id;
        programsByChannelId[channelId] = channel.programs || [];
      }
    }

    // Convert the channel list to the Channel format and associate programs
    const channels: Channel[] = channelList.map((channelData) => {
      // Create a channel object from the channel data
      const channel: Channel = {
        channel: {
          icon: channelData.channel_logo,
          id: channelData.channel_id,
          lcn: channelData.channel_number,
          name: channelData.channel_names,
          slug: channelData.channel_slug,
        },
        channel_group: channelData.channel_group,
        programs: [],
      };

      // Find programs for this channel by ID only
      const channelId = channel.channel.id;
      channel.programs = programsByChannelId[channelId] || [];

      return channel;
    });

    // Create a new data object using the channel list and associating programs
    const mergedData: TVGuideData = {
      ...result,
      channels,
    };

    setData(mergedData);
  } catch (err) {
    setError(err instanceof Error ? err.message : "An unknown error occurred");
  } finally {
    setLoading(false);
  }
};
