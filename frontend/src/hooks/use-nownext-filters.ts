import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { ChannelData } from "@/lib/nownext-types";
import { isChannelGreyedOut } from "@/utils/nownext";

interface UseNowNextFiltersReturn {
  // State
  searchTerm: string;
  selectedGroups: string[];
  hideNoProgramData: boolean;
  groupFilterSearch: string;

  // Setters
  setSearchTerm: (term: string) => void;
  setSelectedGroups: (groups: string[]) => void;
  setHideNoProgramData: (hide: boolean) => void;
  setGroupFilterSearch: (search: string) => void;

  // Computed values
  filteredChannels: ChannelData[];
  uniqueGroups: string[];
  groupCounts: Record<string, number>;

  // Actions
  handleGroupFilter: (group: string) => void;
  clearFilters: () => void;
}

export function useNowNextFilters(
  channels: ChannelData[]
): UseNowNextFiltersReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hideNoProgramData, setHideNoProgramData] = useState(false);
  const [groupFilterSearch, setGroupFilterSearch] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get unique groups
  const uniqueGroups = useMemo(
    () =>
      [
        ...new Set(channels.map((channelData) => channelData.channel.group)),
      ].sort(),
    [channels]
  );

  // Filter channels based on all criteria
  const filteredChannels = useMemo(
    () =>
      channels.filter(
        (channelData) =>
          (channelData.channel.name.real
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
            channelData.channel.lcn.includes(debouncedSearchTerm)) &&
          (selectedGroups.length === 0 ||
            selectedGroups.includes(channelData.channel.group)) &&
          !(hideNoProgramData && isChannelGreyedOut(channelData))
      ),
    [channels, debouncedSearchTerm, selectedGroups, hideNoProgramData]
  );

  // Calculate counts for filter options
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of uniqueGroups) {
      counts[group] = channels.filter(
        (channelData) =>
          channelData.channel.group === group &&
          (channelData.channel.name.real
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
            channelData.channel.lcn.includes(debouncedSearchTerm)) &&
          !(hideNoProgramData && isChannelGreyedOut(channelData))
      ).length;
    }
    return counts;
  }, [channels, uniqueGroups, debouncedSearchTerm, hideNoProgramData]);

  const handleGroupFilter = (group: string) => {
    setSelectedGroups((previous) =>
      previous.includes(group)
        ? previous.filter((g) => g !== group)
        : [...previous, group]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGroups([]);
    setHideNoProgramData(false);
    setGroupFilterSearch("");
  };

  return {
    clearFilters,

    // Computed values
    filteredChannels,
    groupCounts,
    groupFilterSearch,

    // Actions
    handleGroupFilter,
    hideNoProgramData,
    // State
    searchTerm,
    selectedGroups,
    setGroupFilterSearch,
    setHideNoProgramData,

    // Setters
    setSearchTerm,
    setSelectedGroups,
    uniqueGroups,
  };
}
