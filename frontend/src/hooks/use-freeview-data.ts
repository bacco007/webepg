import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createInitialOpenGroups,
  filterFreeviewSources,
  groupAndSortSources,
  groupChannelsByNetwork,
  processChannels,
  sortNetworks,
} from "@/lib/freeview-utils";

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo: {
    light: string;
    dark: string;
  };
}

interface Channel {
  guidelink: string;
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_url: string;
  channel_number: string;
  channel_group: string;
  chlogo: string;
  program_count: number;
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  other_data: {
    channel_type: string;
    channel_specs: string;
  };
}

type UniqueChannel = Omit<Channel, "channel_number"> & {
  channel_numbers: string[];
  isGrouped: boolean;
};

interface APIResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
}

export function useFreeviewData() {
  const [channels, setChannels] = useState<UniqueChannel[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [filteredSources, setFilteredSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("source") ?? undefined;

  // Fetch sources on mount
  useEffect(() => {
    fetch("/api/py/sources")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch sources");
        }
        return response.json();
      })
      .then((data: Source[]) => {
        const filtered = filterFreeviewSources(data);
        setAllSources(filtered);
        setFilteredSources(filtered);

        const grouped = groupAndSortSources(filtered);
        const initialOpenGroups = createInitialOpenGroups(
          grouped,
          sourceId,
          filtered
        );

        setOpenGroups(initialOpenGroups);

        if (sourceId) {
          setSelectedSource(sourceId);
        } else if (filtered.length > 0) {
          setSelectedSource(filtered[0].id);
          setOpenGroups({
            ...initialOpenGroups,
            [filtered[0].subgroup]: true,
          });
          router.push(`?source=${filtered[0].id}`);
        }
      })
      .catch((error_) => {
        setError(`Error fetching sources: ${error_.message}`);
        setLoading(false);
      });
  }, [sourceId, router]);

  // Filter sources based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = allSources.filter(
        (source) =>
          source.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          source.subgroup.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSources(filtered);
    } else {
      setFilteredSources(allSources);
    }
  }, [searchTerm, allSources]);

  // Fetch channels when source changes
  useEffect(() => {
    if (selectedSource) {
      setLoading(true);
      fetch(`/api/py/channels/${selectedSource}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch channel data");
          }
          return response.json();
        })
        .then((data: APIResponse) => {
          const processedChannels = processChannels(data.data.channels);
          setChannels(processedChannels);
          setLoading(false);
        })
        .catch((error_) => {
          setError(`Error fetching channels: ${error_.message}`);
          setLoading(false);
        });
    }
  }, [selectedSource]);

  // Group channels by network
  const channelGroups = groupChannelsByNetwork(channels);
  const sortedNetworks = sortNetworks(Object.keys(channelGroups));

  const toggleGroup = (group: string) => {
    setOpenGroups((previous) => ({ ...previous, [group]: !previous[group] }));
  };

  const selectSource = (source: Source) => {
    setSelectedSource(source.id);

    // When selecting a source, only keep its group open
    const updatedGroups = Object.keys(openGroups).reduce(
      (acc, key) => {
        acc[key] = key === source.subgroup;
        return acc;
      },
      {} as { [key: string]: boolean }
    );

    setOpenGroups(updatedGroups);
    router.push(`?source=${source.id}`);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const selectedSourceDetails = allSources.find(
    (source) => source.id === selectedSource
  );

  return {
    allSources,
    channelGroups,
    channels,
    clearSearch,
    error,
    filteredSources,
    loading,
    openGroups,
    searchTerm,
    selectedSource,
    selectedSourceDetails,
    selectSource,
    setSearchTerm,
    sortedNetworks,
    toggleGroup,
  };
}
