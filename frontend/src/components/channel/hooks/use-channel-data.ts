import { useCallback, useEffect, useState } from "react";
import { getCookie } from "@/lib/cookies";
import type { ApiResponse, Channel } from "../types";

export function useChannelData() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>("xmlepg_FTASYD");

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource =
        (await getCookie("xmltvdatasource")) || "xmlepg_FTASYD";
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/channels/${storedDataSource}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      // Assign a uuid to each channel if not already present
      const channelsWithUuid = data.data.channels.map((channel) => ({
        ...channel,
        uuid:
          channel.uuid ||
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)),
      }));
      setChannels(channelsWithUuid);
      setFilteredChannels(channelsWithUuid);
    } catch {
      setError("Failed to fetch channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    error,
    fetchChannels,
    filteredChannels,
    loading,
    setFilteredChannels,
    xmltvDataSource,
  };
}
