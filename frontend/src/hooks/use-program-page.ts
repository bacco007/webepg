"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getCookie } from "@/lib/cookies";
import {
  collectCategories,
  getUniqueGroups,
  sortChannels,
} from "@/lib/program-page-utils";
import type { ProgramPageData } from "@/types/program-pages";

interface UseProgramPageOptions {
  endpoint: string;
  pageName: string;
}

export function useProgramPage({ endpoint, pageName }: UseProgramPageOptions) {
  const [data, setData] = useState<ProgramPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const searchParameters = useSearchParams();
  const days = searchParameters.get("days") || "7";

  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      const storedDataSource = await getCookie("xmltvdatasource");
      setDataSource(storedDataSource || "xmlepg_FTASYD");
    };

    fetchInitialData();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNoData(false);
    try {
      const storedDataSource = await getCookie("xmltvdatasource");
      if (!storedDataSource) {
        throw new Error("No data source selected");
      }
      setDataSource(storedDataSource);

      const response = await fetch(
        `/api/py/epg/${endpoint}/${storedDataSource}?days=${days}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ${pageName} data`);
      }

      const responseData: ProgramPageData = await response.json();
      if (!responseData.channels || responseData.channels.length === 0) {
        setNoData(true);
      } else {
        setData(responseData);
      }
    } catch (_error) {
      setError(
        _error instanceof Error
          ? _error.message
          : `Failed to fetch ${pageName} data`
      );
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, days, pageName]);

  useEffect(() => {
    if (dataSource) {
      fetchData();
    }
  }, [dataSource, fetchData]);

  const navigateToNext24Hours = useCallback(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0].replaceAll("-", "");
    router.push(`/epg/${formattedDate}`);
  }, [router]);

  const navigateToFullWeek = useCallback(
    (channelSlug: string) => {
      router.push(`/channel/${channelSlug}`);
    },
    [router]
  );

  const filteredAndSortedChannels = useMemo(() => {
    if (!data) {
      return [];
    }
    const filtered = data.channels.filter(
      (ch) =>
        ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(ch.channel.group)) &&
        (selectedCategories.length === 0 ||
          Object.values(ch.programs).some((programsArray) =>
            programsArray.some((program) =>
              program.categories.some((category) =>
                selectedCategories.includes(category)
              )
            )
          ))
    );
    return sortChannels(filtered);
  }, [data, filterText, selectedGroups, selectedCategories]);

  const uniqueGroups = useMemo(() => {
    if (!data) {
      return [];
    }
    return getUniqueGroups(data.channels);
  }, [data]);

  const uniqueCategories = useMemo(() => {
    if (!data) {
      return [];
    }
    return collectCategories(data.channels);
  }, [data]);

  // Calculate counts for filter options
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (!data) {
      return counts;
    }

    for (const group of uniqueGroups) {
      counts[group] = data.channels.filter(
        (ch) =>
          ch.channel.group === group &&
          ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedCategories.length === 0 ||
            Object.values(ch.programs).some((programsArray) =>
              programsArray.some((program) =>
                program.categories.some((category) =>
                  selectedCategories.includes(category)
                )
              )
            ))
      ).length;
    }

    return counts;
  }, [data, uniqueGroups, filterText, selectedCategories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (!data) {
      return counts;
    }

    for (const category of uniqueCategories) {
      counts[category] = data.channels.filter(
        (ch) =>
          ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedGroups.length === 0 ||
            selectedGroups.includes(ch.channel.group)) &&
          Object.values(ch.programs).some((programsArray) =>
            programsArray.some((program) =>
              program.categories.includes(category)
            )
          )
      ).length;
    }

    return counts;
  }, [data, uniqueCategories, filterText, selectedGroups]);

  const handleGroupFilter = useCallback((group: string) => {
    setSelectedGroups((previous) =>
      previous.includes(group)
        ? previous.filter((g) => g !== group)
        : [...previous, group]
    );
  }, []);

  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategories((previous) =>
      previous.includes(category)
        ? previous.filter((c) => c !== category)
        : [...previous, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilterText("");
    setSelectedGroups([]);
    setSelectedCategories([]);
  }, []);

  return {
    categoryCounts,
    clearFilters,
    // State
    data,
    days,
    error,
    fetchData,

    // Computed values
    filteredAndSortedChannels,
    filterText,
    groupCounts,
    handleCategoryFilter,
    handleGroupFilter,
    isFilterMenuOpen,
    isLoading,
    navigateToFullWeek,
    navigateToNext24Hours,
    noData,
    selectedCategories,
    selectedGroups,

    // Actions
    setFilterText,
    setIsFilterMenuOpen,
    uniqueCategories,
    uniqueGroups,
  };
}
