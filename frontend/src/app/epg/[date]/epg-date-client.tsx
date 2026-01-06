"use client";

import { ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TVGuide } from "@/components/epg";
import { SidebarSettings } from "@/components/epg/sidebar-settings";
import { SidebarTimeNavigation } from "@/components/epg/sidebar-time-navigation";
import { FilterSection } from "@/components/filter-section";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import LoadingState from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import {
  formatDate,
  formatDateFromYYYYMMDD,
  isDateToday,
  parseISODate,
} from "@/lib/date-utils";
import { getCookie, setCookie } from "../../../lib/cookies";

// Validate date format (YYYYMMDD)
const isValidDateFormat = (dateStr: string): boolean => {
  if (!dateStr || dateStr.length !== 8) {
    return false;
  }

  // Check if it's a valid number
  const dateNum = Number.parseInt(dateStr, 10);
  if (Number.isNaN(dateNum)) {
    return false;
  }

  // Basic date validation
  const year = Number.parseInt(dateStr.substring(0, 4), 10);
  const month = Number.parseInt(dateStr.substring(4, 6), 10);
  const day = Number.parseInt(dateStr.substring(6, 8), 10);

  if (year < 2000 || year > 2100) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }

  return true;
};

export default function EPGDateClient({
  params,
}: {
  params: Promise<{
    date: string;
  }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { date } = unwrappedParams;

  // State for sidebar filters
  const [channelSearch, setChannelSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(date);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formattedDate, setFormattedDate] = useState<string>("");
  const tvGuideRef = useRef<HTMLDivElement>(null);

  // Display settings
  const [sortBy, setSortBy] = useState<string>("channelNumber");
  const [displayName, setDisplayName] = useState<string>("clean");

  // Data source and timezone from cookies
  const [xmltvDataSource, setXmltvDataSource] = useState<string>("");
  const [clientTimezone, setClientTimezone] =
    useState<string>("Australia/Sydney");
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  // Filter states
  const [channelFilters, setChannelFilters] = useState<string[]>([]);
  const [networkFilters, setNetworkFilters] = useState<string[]>([]);

  // State for networks
  const [networks, setNetworks] = useState<string[]>([]);
  const [networkCounts, setNetworkCounts] = useState<Record<string, number>>(
    {}
  );

  // Channel names and counts
  const [channels, setChannels] = useState<string[]>([]);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>(
    {}
  );

  // Channel to network mapping
  const [channelNetworkMap, setChannelNetworkMap] = useState<
    Record<string, string>
  >({});

  const debouncedChannelSearch = useDebounce(channelSearch, 300);

  // Load cookies on initial render
  useEffect(() => {
    async function loadCookies() {
      const storedDataSource = await getCookie("xmltvdatasource");
      const storedTimezone = await getCookie("userTimezone");
      const storedSortBy = await getCookie("sortBy");
      const storedDisplayName = await getCookie("displayName");

      if (storedDataSource) {
        setXmltvDataSource(storedDataSource);
      } else {
        await setCookie("xmltvdatasource", "xmlepg_FTASYD", 30);
        setXmltvDataSource("xmlepg_FTASYD");
      }

      if (storedTimezone) {
        setClientTimezone(storedTimezone);
      } else {
        await setCookie("userTimezone", "Australia/Sydney", 30);
        setClientTimezone("Australia/Sydney");
      }

      if (storedSortBy) {
        setSortBy(storedSortBy);
      } else {
        await setCookie("sortBy", "channelNumber", 30);
        setSortBy("channelNumber");
      }

      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
      } else {
        await setCookie("displayName", "clean", 30);
        setDisplayName("clean");
      }

      setCookiesLoaded(true);
    }

    loadCookies();
  }, []);

  // Handle settings changes - memoized with useCallback
  const handleSortByChange = useCallback(async (value: string) => {
    setSortBy(value);
    await setCookie("sortBy", value, 30);
  }, []);

  const handleDisplayNameChange = useCallback(async (value: string) => {
    setDisplayName(value);
    await setCookie("displayName", value, 30);
  }, []);

  // Extract network processing logic to reduce complexity
  const processNetworkData = useCallback(
    (channelData: Array<{ channel_id: string; channel_group?: string }>) => {
      const networkSet = new Set<string>();
      const networkMap: Record<string, string> = {};
      const netCounts: Record<string, number> = {};

      // Single pass to extract networks, create map, and count
      for (const channelItem of channelData) {
        if (channelItem.channel_group) {
          networkSet.add(channelItem.channel_group);
          networkMap[channelItem.channel_id] = channelItem.channel_group;
          netCounts[channelItem.channel_group] =
            (netCounts[channelItem.channel_group] || 0) + 1;
        }
      }

      const extractedNetworks = Array.from(networkSet).sort();
      setNetworks(extractedNetworks);
      setChannelNetworkMap(networkMap);
      setNetworkCounts(netCounts);
    },
    []
  );

  // Fetch channel data
  useEffect(() => {
    if (!(xmltvDataSource && clientTimezone && cookiesLoaded)) {
      return;
    }

    const fetchChannelData = async () => {
      try {
        const response = await fetch(`/api/py/channels/${xmltvDataSource}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch channel data: ${response.status}`);
        }
        const result = await response.json();
        processNetworkData(result.data?.channels || []);
      } catch {
        // Error handling without console.log
      }
    };

    fetchChannelData();
  }, [xmltvDataSource, clientTimezone, cookiesLoaded, processNetworkData]);

  // Fetch available dates
  useEffect(() => {
    if (!(xmltvDataSource && clientTimezone && cookiesLoaded)) {
      return;
    }

    const fetchDates = async () => {
      try {
        const response = await fetch(
          `/api/py/dates/${xmltvDataSource}?timezone=${encodeURIComponent(clientTimezone)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch dates: ${response.status}`);
        }
        const result = await response.json();
        setAvailableDates(result.data || []);

        // Check if the URL date is valid
        if (isValidDateFormat(date) && result.data.includes(date)) {
          setSelectedDate(date);
          const formattedDateStr = formatDateFromYYYYMMDD(
            date,
            "EEEE, do MMMM yyyy"
          );
          setFormattedDate(formattedDateStr);
        }
        // If date is invalid or not available, redirect to the first available date
        else if (result.data && result.data.length > 0) {
          const firstDate = result.data[0];
          router.replace(`/epg/${firstDate}`);
        }
      } catch {
        //
      }
    };

    fetchDates();
  }, [xmltvDataSource, clientTimezone, date, router, cookiesLoaded]);

  // Update formatted date when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const formattedDateStr = formatDateFromYYYYMMDD(
        selectedDate,
        "EEEE, do MMMM yyyy"
      );
      setFormattedDate(formattedDateStr);
    }
  }, [selectedDate]);

  // Fetch channel data when date changes
  useEffect(() => {
    if (!(selectedDate && xmltvDataSource && clientTimezone && cookiesLoaded)) {
      return;
    }

    const fetchGuideData = async () => {
      try {
        const response = await fetch(
          `/api/py/epg/date/${selectedDate}/${xmltvDataSource}?timezone=${encodeURIComponent(clientTimezone)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const result = await response.json();

        // Extract channel names and create counts
        const channelData = result.channels.map(
          (c: {
            channel: {
              id: string;
              lcn: string | number | null;
              name: {
                clean?: string;
                real?: string;
                location?: string;
              };
            };
            programs: Array<{
              categories?: string[];
            }>;
          }) => ({
            id: c.channel.id,
            lcn: c.channel.lcn,
            name: c.channel.name.clean,
          })
        );

        // Store channel names with ID and LCN for filtering
        const channelIdentifiers = channelData.map(
          (c: { id: string; lcn: string | number | null }) => `${c.id}|${c.lcn}`
        );
        setChannels(channelIdentifiers);

        // Create channel counts (all channels have at least 1 count)
        const counts = Object.fromEntries(
          channelIdentifiers.map((id: string) => [id, 1])
        );
        setChannelCounts(counts);
      } catch {
        // Error handling without console.log
      }
    };

    fetchGuideData();
  }, [selectedDate, xmltvDataSource, clientTimezone, cookiesLoaded]);

  // Update the handleFilterChange function to handle network filters - memoized
  const handleFilterChange = useCallback(
    (filterType: "channel" | "network", value: string) => {
      switch (filterType) {
        case "channel":
          setChannelFilters((prev) =>
            prev.includes(value)
              ? prev.filter((v) => v !== value)
              : [...prev, value]
          );
          break;
        case "network":
          setNetworkFilters((prev) =>
            prev.includes(value)
              ? prev.filter((v) => v !== value)
              : [...prev, value]
          );
          break;
        default:
          break;
      }
    },
    []
  );

  // Update clearAllFilters to include network filters - memoized
  const clearAllFilters = useCallback(() => {
    setChannelFilters([]);
    setNetworkFilters([]);
    setChannelSearch("");
  }, []);

  const handleDateChange = useCallback(
    (newDate: string) => {
      // Navigate to the new date URL
      router.push(`/epg/${newDate}`);
    },
    [router]
  );

  // Memoize current date index to avoid recalculating
  const currentDateIndex = useMemo(
    () => availableDates.indexOf(selectedDate),
    [availableDates, selectedDate]
  );

  const handlePrevDate = useCallback(() => {
    if (currentDateIndex > 0) {
      const newDate = availableDates[currentDateIndex - 1];
      handleDateChange(newDate);
    }
  }, [currentDateIndex, availableDates, handleDateChange]);

  const handleNextDate = useCallback(() => {
    if (currentDateIndex < availableDates.length - 1) {
      const newDate = availableDates[currentDateIndex + 1];
      handleDateChange(newDate);
    }
  }, [currentDateIndex, availableDates, handleDateChange]);

  // Memoize formatted dates for dropdown to avoid recalculating on every render
  const formattedDateMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const dateStr of availableDates) {
      if (!dateStr) {
        map.set(dateStr, "");
        continue;
      }

      // Parse the YYYYMMDD format
      const dateObj = parseISODate(
        `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
      );

      map.set(
        dateStr,
        isDateToday(dateObj) ? "Today" : formatDate(dateObj, "EEE, do MMM")
      );
    }
    return map;
  }, [availableDates]);

  // Format date for display in dropdown - now uses memoized map
  const getFormattedDate = useCallback(
    (dateStr: string) => {
      return formattedDateMap.get(dateStr) || "";
    },
    [formattedDateMap]
  );

  // View mode toggle actions - memoized
  const toggleViewMode = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  // Jump to time function - memoized
  const jumpToTime = useCallback(
    (hour: number) => {
      if (tvGuideRef.current) {
        const hourWidth = 200; // Same as in TVGuide component
        const scrollableElement = tvGuideRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLElement;

        if (scrollableElement && viewMode === "grid") {
          const scrollPosition = hour * hourWidth;
          scrollableElement.scrollTo({
            behavior: "smooth",
            left: scrollPosition,
          });
        }
      }
    },
    [viewMode]
  );

  // Memoize date select items to avoid recreating on every render
  const dateSelectItems = useMemo(
    () =>
      availableDates.map((dateItem) => (
        <SelectItem key={dateItem} value={dateItem}>
          {getFormattedDate(dateItem)}
        </SelectItem>
      )),
    [availableDates, getFormattedDate]
  );

  // Header actions for the sidebar layout - memoized
  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            disabled={currentDateIndex === 0}
            onClick={handlePrevDate}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Select onValueChange={handleDateChange} value={selectedDate}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>{dateSelectItems}</SelectContent>
          </Select>

          <Button
            disabled={currentDateIndex === availableDates.length - 1}
            onClick={handleNextDate}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="ml-2 flex items-center overflow-hidden rounded-md border">
          <Button
            className="rounded-none"
            onClick={() => toggleViewMode("grid")}
            size="sm"
            variant={viewMode === "grid" ? "default" : "ghost"}
          >
            <Grid className="mr-2 size-4" />
            Grid
          </Button>
          <Button
            className="rounded-none"
            onClick={() => toggleViewMode("list")}
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
          >
            <List className="mr-2 size-4" />
            List
          </Button>
        </div>
      </div>
    ),
    [
      currentDateIndex,
      handlePrevDate,
      handleDateChange,
      selectedDate,
      dateSelectItems,
      handleNextDate,
      availableDates.length,
      toggleViewMode,
      viewMode,
    ]
  );

  // Memoize filter change handlers to prevent FilterSection re-renders
  const handleChannelFilterChange = useCallback(
    (value: string) => handleFilterChange("channel", value),
    [handleFilterChange]
  );

  const handleNetworkFilterChange = useCallback(
    (value: string) => handleFilterChange("network", value),
    [handleFilterChange]
  );

  // No-op function for network search - memoized to prevent re-renders
  const networkSearchNoOp = useCallback(() => {
    // No-op function for compatibility
  }, []);

  // Add network filter to the sidebar content - memoized
  const sidebar = useMemo(
    () => (
      <SidebarContainer>
        <SidebarHeader>
          <SidebarSearch
            onValueChange={setChannelSearch}
            placeholder="Search channels..."
            searchValue={channelSearch}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarTimeNavigation onJumpToTime={jumpToTime} />
          <FilterSection
            counts={channelCounts}
            filters={channelFilters}
            onFilterChange={handleChannelFilterChange}
            onSearchChange={setChannelSearch}
            options={channels}
            searchValue={channelSearch}
            showSearch={true}
            title="Channels"
          />
          <FilterSection
            counts={networkCounts}
            filters={networkFilters}
            onFilterChange={handleNetworkFilterChange}
            onSearchChange={networkSearchNoOp}
            options={networks}
            searchValue=""
            showSearch={false}
            title="Networks"
          />

          {/* Add Settings Section */}
          <SidebarSettings
            displayName={displayName}
            onDisplayNameChange={handleDisplayNameChange}
            onSortByChange={handleSortByChange}
            sortBy={sortBy}
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
        </SidebarFooter>
      </SidebarContainer>
    ),
    [
      channelSearch,
      jumpToTime,
      channelCounts,
      channelFilters,
      handleChannelFilterChange,
      channels,
      networkCounts,
      networkFilters,
      handleNetworkFilterChange,
      networks,
      networkSearchNoOp,
      displayName,
      handleDisplayNameChange,
      handleSortByChange,
      sortBy,
      clearAllFilters,
    ]
  );

  const pageTitle = formattedDate ? `Daily EPG - ${formattedDate}` : "TV Guide";

  // Don't render the TVGuide until cookies are loaded and we have a data source
  if (!(cookiesLoaded && xmltvDataSource)) {
    return <LoadingState text="Loading TV Guide..." />;
  }

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="overflow-hidden"
      sidebar={sidebar}
      title={pageTitle}
    >
      <div className="h-full p-0.5" ref={tvGuideRef}>
        {/* Pass settings to the TVGuide component */}
        <TVGuide
          channelFilters={channelFilters}
          channelNetworkMap={channelNetworkMap}
          className="h-full"
          dataSource={xmltvDataSource}
          displayNameType={displayName as "clean" | "real" | "location"}
          hideDateHeader={true}
          initialDate={selectedDate}
          initialViewMode={viewMode}
          networkFilters={networkFilters}
          searchTerm={debouncedChannelSearch}
          sortBy={sortBy}
          timezone={clientTimezone}
        />
      </div>
    </SidebarLayout>
  );
}
