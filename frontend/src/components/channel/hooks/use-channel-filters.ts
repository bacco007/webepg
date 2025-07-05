import { useCallback, useMemo, useState } from "react";
import type { Channel } from "../types";
import { getChannelDisplayName, getChannelNumber } from "../utils";

export function useChannelFilters(channels: Channel[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedNameGroups, setSelectedNameGroups] = useState<string[]>([]);
  const [hideNoPrograms, setHideNoPrograms] = useState(false);

  const uniqueGroups = useMemo(
    () => [...new Set(channels.map((channel) => channel.channel_group))].sort(),
    [channels]
  );

  const uniqueTypes = useMemo(
    () =>
      [
        ...new Set(channels.map((channel) => channel.other_data.channel_type)),
      ].sort(),
    [channels]
  );

  const uniqueSpecs = useMemo(
    () =>
      [
        ...new Set(channels.map((channel) => channel.other_data.channel_specs)),
      ].sort(),
    [channels]
  );

  const uniqueNameGroups = useMemo(
    () =>
      [
        ...new Set(
          channels
            .map((channel) => channel.other_data.channel_name_group)
            .filter((group): group is string => group !== undefined)
        ),
      ].sort(),
    [channels]
  );

  const hasNameGroups = uniqueNameGroups.length > 0;

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGroups([]);
    setSelectedTypes([]);
    setSelectedSpecs([]);
    setSelectedNameGroups([]);
    setHideNoPrograms(false);
  }, []);

  const handleGroupFilter = useCallback((group: string) => {
    setSelectedGroups((previous) =>
      previous.includes(group)
        ? previous.filter((g) => g !== group)
        : [...previous, group]
    );
  }, []);

  const handleTypeFilter = useCallback((type: string) => {
    setSelectedTypes((previous) =>
      previous.includes(type)
        ? previous.filter((t) => t !== type)
        : [...previous, type]
    );
  }, []);

  const handleSpecsFilter = useCallback((specs: string) => {
    setSelectedSpecs((previous) =>
      previous.includes(specs)
        ? previous.filter((s) => s !== specs)
        : [...previous, specs]
    );
  }, []);

  const handleNameGroupFilter = useCallback((nameGroup: string) => {
    setSelectedNameGroups((previous) =>
      previous.includes(nameGroup)
        ? previous.filter((ng) => ng !== nameGroup)
        : [...previous, nameGroup]
    );
  }, []);

  // Calculate counts for each filter option
  const { groupCounts, typeCounts, specsCounts, nameGroupCounts } =
    useMemo(() => {
      const groupCountsResult: Record<string, number> = {};
      const typeCountsResult: Record<string, number> = {};
      const specsCountsResult: Record<string, number> = {};
      const nameGroupCountsResult: Record<string, number> = {};

      // Create base filter function
      const baseFilter = (channel: Channel) =>
        (!hideNoPrograms || channel.program_count > 0) &&
        (searchTerm === "" ||
          getChannelDisplayName(channel)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (typeof channel.channel_number === "string" &&
            getChannelNumber(channel).includes(searchTerm)));

      // Create filter functions for each category
      const filterWithoutGroup = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group
            )));

      const filterWithoutType = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group
            )));

      const filterWithoutSpecs = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group
            )));

      const filterWithoutNameGroup = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs));

      // Count channels for each group
      for (const group of uniqueGroups) {
        groupCountsResult[group] = channels.filter(
          (c) => c.channel_group === group && filterWithoutGroup(c)
        ).length;
      }

      for (const type of uniqueTypes) {
        typeCountsResult[type] = channels.filter(
          (c) => c.other_data.channel_type === type && filterWithoutType(c)
        ).length;
      }

      for (const spec of uniqueSpecs) {
        specsCountsResult[spec] = channels.filter(
          (c) => c.other_data.channel_specs === spec && filterWithoutSpecs(c)
        ).length;
      }

      for (const nameGroup of uniqueNameGroups) {
        nameGroupCountsResult[nameGroup] = channels.filter(
          (c) =>
            c.other_data.channel_name_group === nameGroup &&
            filterWithoutNameGroup(c)
        ).length;
      }

      return {
        groupCounts: groupCountsResult,
        typeCounts: typeCountsResult,
        specsCounts: specsCountsResult,
        nameGroupCounts: nameGroupCountsResult,
      };
    }, [
      channels,
      uniqueGroups,
      uniqueTypes,
      uniqueSpecs,
      uniqueNameGroups,
      selectedGroups,
      selectedTypes,
      selectedSpecs,
      selectedNameGroups,
      hideNoPrograms,
      searchTerm,
    ]);

  return {
    searchTerm,
    setSearchTerm,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    setHideNoPrograms,
    uniqueGroups,
    uniqueTypes,
    uniqueSpecs,
    uniqueNameGroups,
    hasNameGroups,
    clearFilters,
    handleGroupFilter,
    handleTypeFilter,
    handleSpecsFilter,
    handleNameGroupFilter,
    groupCounts,
    typeCounts,
    specsCounts,
    nameGroupCounts,
  };
}
