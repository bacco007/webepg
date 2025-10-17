"use client";

import { ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

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

// Types for the data structures
type ChannelName = {
  clean?: string;
  real?: string;
  location?: string;
};

type Channel = {
  id: string;
  lcn: string | number | null;
  name: ChannelName;
};

type Program = {
  categories?: string[];
};

type ChannelData = {
  channel: Channel;
  programs: Program[];
};

type TVGuideDatePageProps = {
  params: Promise<{
    date: string;
  }>;
};

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

// Helper function to extract categories from programs
const extractCategoriesFromPrograms = (
  channelData: ChannelData[]
): string[] => {
  const allCategoriesSet = new Set<string>();

  for (const channel of channelData) {
    for (const program of channel.programs) {
      if (program.categories && Array.isArray(program.categories)) {
        for (const category of program.categories) {
          allCategoriesSet.add(category);
        }
      }
    }
  }

  return Array.from(allCategoriesSet).sort();
};

// Helper function to create category counts
const createCategoryCounts = (
  channelData: ChannelData[],
  categoryList: string[]
): Record<string, number> =>
  Object.fromEntries(
    categoryList.map((cat) => [
      cat,
      channelData.filter((c: ChannelData) =>
        c.programs.some((p: Program) => p.categories?.includes(cat))
      ).length,
    ])
  );

export default function EPGDateClient({ params }: TVGuideDatePageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { date } = unwrappedParams;

  // State for sidebar filters
  const [channelSearch, setChannelSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(date);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formattedDate, setFormattedDate] = useState<string>("");
  const tvGuideRef = useRef<HTMLDivElement>(null);

  // Display settings
  const [sortBy, setSortBy] = useState<string>("channelNumber");
  const [groupBy, setGroupBy] = useState<string>("none");
  const [displayName, setDisplayName] = useState<string>("clean");

  // Data source and timezone from cookies
  const [xmltvDataSource, setXmltvDataSource] = useState<string>("");
  const [clientTimezone, setClientTimezone] =
    useState<string>("Australia/Sydney");
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  // Filter states
  const [channelFilters, setChannelFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [networkFilters, setNetworkFilters] = useState<string[]>([]);

  // State for categories and networks
  const [categories, setCategories] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
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
      const storedGroupBy = await getCookie("groupBy");
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

      if (storedGroupBy) {
        setGroupBy(storedGroupBy);
      } else {
        await setCookie("groupBy", "none", 30);
        setGroupBy("none");
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

  // Handle settings changes
  const handleSortByChange = async (value: string) => {
    setSortBy(value);
    await setCookie("sortBy", value, 30);
  };

  const handleGroupByChange = async (value: string) => {
    setGroupBy(value);
    await setCookie("groupBy", value, 30);
  };

  const handleDisplayNameChange = async (value: string) => {
    setDisplayName(value);
    await setCookie("displayName", value, 30);
  };

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

        // Extract networks from channel data
        const networkSet = new Set<string>();
        const networkMap: Record<string, string> = {};

        for (const channel of result.data?.channels || []) {
          if (channel.channel_group) {
            networkSet.add(channel.channel_group);
            // Map channel ID to network
            networkMap[channel.channel_id] = channel.channel_group;
          }
        }

        const extractedNetworks = Array.from(networkSet).sort();
        setNetworks(extractedNetworks);
        setChannelNetworkMap(networkMap);

        // Create network counts
        const netCounts: Record<string, number> = {};
        for (const network of extractedNetworks) {
          netCounts[network] =
            result.data?.channels.filter(
              (c: { channel_group: string }) => c.channel_group === network
            ).length || 0;
        }
        setNetworkCounts(netCounts);
      } catch {
        // Error handling without console.log
      }
    };

    fetchChannelData();
  }, [xmltvDataSource, clientTimezone, cookiesLoaded]);

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
        const channelData = result.channels.map((c: ChannelData) => ({
          id: c.channel.id,
          lcn: c.channel.lcn,
          name: c.channel.name.clean,
        }));

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

        // Extract categories and create counts
        const extractedCategories = extractCategoriesFromPrograms(
          result.channels
        );
        setCategories(extractedCategories);

        const catCountsObj = createCategoryCounts(
          result.channels,
          extractedCategories
        );
        setCategoryCounts(catCountsObj);
      } catch {
        // Error handling without console.log
      }
    };

    fetchGuideData();
  }, [selectedDate, xmltvDataSource, clientTimezone, cookiesLoaded]);

  // Update the handleFilterChange function to handle network filters
  const handleFilterChange = (
    filterType: "channel" | "category" | "network",
    value: string
  ) => {
    switch (filterType) {
      case "channel":
        setChannelFilters((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        );
        break;
      case "category":
        setCategoryFilters((prev) =>
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
  };

  // Update clearAllFilters to include network filters
  const clearAllFilters = () => {
    setChannelFilters([]);
    setCategoryFilters([]);
    setNetworkFilters([]);
    setChannelSearch("");
    setCategorySearch("");
  };

  const handleDateChange = (newDate: string) => {
    // Navigate to the new date URL
    router.push(`/epg/${newDate}`);
  };

  const handlePrevDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      const newDate = availableDates[currentIndex - 1];
      handleDateChange(newDate);
    }
  };

  const handleNextDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      const newDate = availableDates[currentIndex + 1];
      handleDateChange(newDate);
    }
  };

  // Format date for display in dropdown
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) {
      return "";
    }

    // Parse the YYYYMMDD format
    const dateObj = parseISODate(
      `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
    );

    return isDateToday(dateObj) ? "Today" : formatDate(dateObj, "EEE, do MMM");
  };

  // View mode toggle actions
  const toggleViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  // Jump to time function
  const jumpToTime = (hour: number) => {
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
  };

  // Header actions for the sidebar layout
  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          disabled={availableDates.indexOf(selectedDate) === 0}
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
          <SelectContent>
            {availableDates.map((dateItem) => (
              <SelectItem key={dateItem} value={dateItem}>
                {getFormattedDate(dateItem)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          disabled={
            availableDates.indexOf(selectedDate) === availableDates.length - 1
          }
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
  );

  // Add network filter to the sidebar content
  const sidebar = (
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
          onFilterChange={(value) => handleFilterChange("channel", value)}
          onSearchChange={setChannelSearch}
          options={channels}
          searchValue={channelSearch}
          showSearch={true}
          title="Channels"
        />
        <FilterSection
          counts={networkCounts}
          filters={networkFilters}
          onFilterChange={(value) => handleFilterChange("network", value)}
          onSearchChange={() => {
            // No-op function for compatibility
          }}
          options={networks}
          searchValue=""
          showSearch={false}
          title="Networks"
        />
        <FilterSection
          counts={categoryCounts}
          filters={categoryFilters}
          onFilterChange={(value) => handleFilterChange("category", value)}
          onSearchChange={setCategorySearch}
          options={categories}
          searchValue={categorySearch}
          showSearch={false}
          title="Categories"
        />

        {/* Add Settings Section */}
        <SidebarSettings
          displayName={displayName}
          groupBy={groupBy}
          onDisplayNameChange={handleDisplayNameChange}
          onGroupByChange={handleGroupByChange}
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
          categoryFilters={categoryFilters}
          channelFilters={channelFilters}
          channelNetworkMap={channelNetworkMap}
          className="h-full"
          dataSource={xmltvDataSource}
          displayNameType={displayName as "clean" | "real" | "location"}
          groupBy={groupBy}
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
