import { useCallback, useEffect, useState } from "react";
import { getCookie } from "@/lib/cookies";
import type { ChannelData } from "@/lib/nownext-types";
import { sortChannelsByLCN } from "@/utils/nownext";

interface UseNowNextDataReturn {
  channels: ChannelData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNowNextData(): UseNowNextDataReturn {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const storedDataSource = getCookie("xmltvdatasource") || "xmlepg_FTASYD";
      const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch channel data: ${response.status}`);
      }

      const data = await response.json();
      const sortedChannels = sortChannelsByLCN(data.data);
      setChannels(sortedChannels);
    } catch (_error) {
      setError(
        _error instanceof Error
          ? _error.message
          : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    isLoading,
    error,
    refresh: fetchChannels,
  };
}
