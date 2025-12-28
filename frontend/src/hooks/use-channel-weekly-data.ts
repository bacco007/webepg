import { differenceInMinutes, isAfter, isBefore } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Channel, ChannelData, Program } from "@/components/epg/types";
import { useDebounce } from "@/hooks/use-debounce";
import { parseISODate } from "@/lib/date-utils";

type DensityOption = "compact" | "normal" | "detailed";

interface UseChannelWeeklyDataProps {
  channelSlug: string;
  dataSource?: string;
}

interface UseChannelWeeklyDataReturn {
  // Data
  allPrograms: Program[];
  channelData: Channel | null;
  days: Date[];
  daysLength: number;
  totalDays: number;
  startDate: Date | null;

  // State
  isLoading: boolean;
  error: string | null;
  now: Date;
  clientTimezone: string;
  visibleDays: number;
  startDayIndex: number;
  useCategories: boolean;
  viewMode: "grid" | "list";
  selectedDay: number;
  filteredCategory: string | null;
  showPastPrograms: boolean;
  searchTerm: string;
  debouncedSearchTerm: string;
  density: DensityOption;
  showTimeBlocks: boolean;

  // Computed data
  filteredPrograms: Program[];
  groupedPrograms: Record<string, Program[]>;
  uniqueCategories: string[];

  // Actions
  setStartDayIndex: (index: number) => void;
  setUseCategories: (use: boolean) => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSelectedDay: (day: number) => void;
  setFilteredCategory: (category: string | null) => void;
  setShowPastPrograms: (show: boolean) => void;
  setSearchTerm: (term: string) => void;
  setDensity: (density: DensityOption) => void;
  setShowTimeBlocks: (show: boolean) => void;
  fetchData: () => Promise<void>;

  // Utility functions
  getProgramStatus: (program: Program) => {
    isLive: boolean;
    hasEnded: boolean;
    isUpNext: boolean;
  };
  calculateProgress: (start: string, end: string) => number;
  handlePreviousDay: () => void;
  handleNextDay: () => void;
}

// API response types
interface ApiProgram {
  start_time: string;
  end_time: string;
  title: string;
  subtitle?: string;
  description?: string;
  categories?: string[];
  rating?: string;
}

interface ApiChannel {
  channel_id: string;
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_slug: string;
  channel_number: string;
  channel_name: string;
}

interface ApiResponse {
  channel: ApiChannel;
  programs: Record<string, ApiProgram[]>;
}

export function useChannelWeeklyData({
  channelSlug,
  dataSource = "xmlepg_FTASYD",
}: UseChannelWeeklyDataProps): UseChannelWeeklyDataReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [daysLength, setDaysLength] = useState<number>(7);
  const [channelData, setChannelData] = useState<Channel | null>(null);
  const [totalDays, setTotalDays] = useState<number>(0);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientTimezone, setClientTimezone] =
    useState<string>("Australia/Sydney");
  const [visibleDays] = useState<number>(7);
  const [startDayIndex, setStartDayIndex] = useState(0);
  const [useCategories, setUseCategories] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [showPastPrograms, setShowPastPrograms] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [density, setDensity] = useState<DensityOption>("normal");
  const [showTimeBlocks, setShowTimeBlocks] = useState(true);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Set client timezone
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setClientTimezone(detectedTimezone);
  }, []);

  // Fetch data source from cookies or URL
  useEffect(() => {
    const fetchDataSource = () => {
      const urlSource = searchParams.get("source");
      if (urlSource && urlSource !== dataSource) {
        router.replace(`/channel/${channelSlug}?source=${urlSource}`);
      }
    };

    fetchDataSource();
  }, [searchParams, channelSlug, dataSource, router]);

  // Process API data
  const processApiData = useCallback((data: ApiResponse) => {
    if (!data?.programs) {
      setError("Invalid data received from API");
      return;
    }

    const dates = Object.keys(data.programs);
    if (dates.length === 0) {
      setError("No program data available");
      return;
    }

    const startDay = parseISODate(dates[0]);

    setStartDate(startDay);
    setDaysLength(dates.length);
    setTotalDays(dates.length);
    setChannelData({
      channel: {
        icon: {
          dark: data.channel.channel_logo.dark,
          light: data.channel.channel_logo.light,
        },
        id: data.channel.channel_id,
        lcn: data.channel.channel_number,
        name: {
          clean: data.channel.channel_names.clean,
          location: data.channel.channel_names.location,
          real: data.channel.channel_names.real,
        },
        slug: data.channel.channel_slug,
      },
      channel_group: "",
      programs: [],
    });

    const programs = dates.flatMap((date, dayIndex) =>
      data.programs[date].map((program: ApiProgram, programIndex: number) => ({
        categories: program.categories,
        channel: data.channel.channel_name,
        description: program.description,
        end: program.end_time,
        end_time: program.end_time,
        guideid: `${dayIndex}-${programIndex}`,
        new: false,
        premiere: false,
        rating: program.rating,
        start: program.start_time,
        start_time: program.start_time,
        subtitle: program.subtitle,
        title: program.title,
      }))
    );

    setAllPrograms(programs);
    setError(null);
  }, []);

  // Try to fetch EPG data for a specific channel slug
  const tryFetchEPGData = useCallback(
    (slug: string): Promise<Response> => {
      const url = `/api/py/epg/channels/${dataSource}/${slug}?timezone=${encodeURIComponent(clientTimezone)}`;
      return fetch(url);
    },
    [dataSource, clientTimezone]
  );

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!(channelSlug && dataSource)) {
      setError("No channel or data source selected");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get the channel list to find alternative channels
      const channelsResponse = await fetch(`/api/py/channels/${dataSource}`);
      if (!channelsResponse.ok) {
        throw new Error(
          `Failed to fetch channel list: ${channelsResponse.status}`
        );
      }

      const channelsData = await channelsResponse.json();
      const targetChannel = channelsData.data.channels.find(
        (ch: ChannelData) => ch.channel_slug === channelSlug
      );

      if (!targetChannel) {
        throw new Error(
          `Channel ${channelSlug} not found in data source ${dataSource}`
        );
      }

      // Get all channels with the same guidelink
      const channelsWithSameGuidelink = channelsData.data.channels.filter(
        (ch: ChannelData) => ch.guidelink === targetChannel.guidelink
      );

      // Try all channels with the same guidelink
      const responses = await Promise.all(
        channelsWithSameGuidelink.map((ch: ChannelData) =>
          tryFetchEPGData(ch.channel_slug)
        )
      );

      // Find the first successful response
      const successfulResponse = responses.find((response) => response.ok);

      if (!successfulResponse) {
        throw new Error(
          `No programming data available for any channel with guidelink ${targetChannel.guidelink}`
        );
      }

      const data: ApiResponse = await successfulResponse.json();
      processApiData(data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelSlug, dataSource, processApiData, tryFetchEPGData]);

  // Initial data fetch and timer setup
  useEffect(() => {
    if (dataSource && channelSlug) {
      fetchData();
    }

    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, [fetchData, dataSource, channelSlug]);

  // Generate days array
  const days = useMemo(() => {
    if (!startDate) {
      return [];
    }
    return Array.from({ length: daysLength }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      return date;
    });
  }, [startDate, daysLength]);

  // Navigation handlers
  const handlePreviousDay = useCallback(() => {
    setStartDayIndex((previous) => Math.max(0, previous - 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setStartDayIndex((previous) =>
      Math.min(daysLength - visibleDays, previous + 1)
    );
  }, [daysLength, visibleDays]);

  // Get unique categories from programs
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const program of allPrograms) {
      for (const category of program.categories ?? []) {
        categories.add(category);
      }
    }
    return Array.from(categories).sort();
  }, [allPrograms]);

  // Filter programs for list view
  const filteredPrograms = useMemo(() => {
    if (!days[selectedDay]) {
      return [];
    }

    const selectedDayStart = new Date(days[selectedDay]);
    selectedDayStart.setHours(0, 0, 0, 0);

    const selectedDayEnd = new Date(days[selectedDay]);
    selectedDayEnd.setHours(23, 59, 59, 999);

    return allPrograms
      .filter((program) => {
        const programStart = parseISODate(program.start_time);
        const programEnd = parseISODate(program.end_time);

        // Check if program is on the selected day
        const isOnSelectedDay =
          (isAfter(programStart, selectedDayStart) ||
            programStart.getTime() === selectedDayStart.getTime()) &&
          (isBefore(programStart, selectedDayEnd) ||
            programStart.getTime() === selectedDayEnd.getTime());

        // Check category filter
        const matchesCategory =
          !filteredCategory || program.categories?.includes(filteredCategory);

        // Check past programs filter
        const isPast = isAfter(now, programEnd);
        const showBasedOnPastSetting = showPastPrograms || !isPast;

        // Check search term
        const matchesSearch =
          !debouncedSearchTerm ||
          program.title
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          program.subtitle
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          program.description
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());

        return (
          isOnSelectedDay &&
          matchesCategory &&
          showBasedOnPastSetting &&
          matchesSearch
        );
      })
      .sort(
        (a, b) =>
          parseISODate(a.start_time).getTime() -
          parseISODate(b.start_time).getTime()
      );
  }, [
    allPrograms,
    days,
    selectedDay,
    filteredCategory,
    showPastPrograms,
    now,
    debouncedSearchTerm,
  ]);

  // Time block definitions for grouping programs
  const timeBlocks = [
    { end: 6, name: "Early Morning", start: 0 },
    { end: 12, name: "Morning", start: 6 },
    { end: 17, name: "Afternoon", start: 12 },
    { end: 20, name: "Evening", start: 17 },
    { end: 23, name: "Prime Time", start: 20 },
    { end: 24, name: "Late Night", start: 23 },
  ];

  // Group programs by time blocks
  const groupedPrograms = useMemo(() => {
    if (!showTimeBlocks) {
      return { "All Programs": filteredPrograms };
    }

    const grouped: Record<string, Program[]> = {};

    for (const block of timeBlocks) {
      grouped[block.name] = filteredPrograms.filter((program) => {
        const hour = parseISODate(program.start_time).getHours();
        return hour >= block.start && hour < block.end;
      });
    }

    // Filter out empty blocks
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, programs]) => programs.length > 0)
    );
  }, [filteredPrograms, showTimeBlocks]);

  // Get program status (live, upcoming, past)
  const getProgramStatus = useCallback(
    (program: Program) => {
      const programStart = parseISODate(program.start_time);
      const programEnd = parseISODate(program.end_time);
      const isLive = isAfter(now, programStart) && isBefore(now, programEnd);
      const hasEnded = isAfter(now, programEnd);
      const isUpNext =
        !(isLive || hasEnded) && differenceInMinutes(programStart, now) <= 30;

      return { hasEnded, isLive, isUpNext };
    },
    [now]
  );

  // Calculate progress percentage for live programs
  const calculateProgress = useCallback(
    (start: string, end: string) => {
      const startTime = parseISODate(start);
      const endTime = parseISODate(end);
      const currentTime = now;

      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsedDuration = currentTime.getTime() - startTime.getTime();

      return Math.min(
        Math.max((elapsedDuration / totalDuration) * 100, 0),
        100
      );
    },
    [now]
  );

  return {
    // Data
    allPrograms,
    calculateProgress,
    channelData,
    clientTimezone,
    days,
    daysLength,
    debouncedSearchTerm,
    density,
    error,
    fetchData,
    filteredCategory,

    // Computed data
    filteredPrograms,

    // Utility functions
    getProgramStatus,
    groupedPrograms,
    handleNextDay,
    handlePreviousDay,

    // State
    isLoading,
    now,
    searchTerm,
    selectedDay,
    setDensity,
    setFilteredCategory,
    setSearchTerm,
    setSelectedDay,
    setShowPastPrograms,
    setShowTimeBlocks,

    // Actions
    setStartDayIndex,
    setUseCategories,
    setViewMode,
    showPastPrograms,
    showTimeBlocks,
    startDate,
    startDayIndex,
    totalDays,
    uniqueCategories,
    useCategories,
    viewMode,
    visibleDays,
  };
}
