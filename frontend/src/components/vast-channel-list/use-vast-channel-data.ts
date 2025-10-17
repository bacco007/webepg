import { useCallback, useEffect, useState } from "react";
import { type ApiResponse, type ChannelData, ZONES } from "./types";

export function useVastChannelData() {
  const [channelData, setChannelData] = useState<Record<string, ChannelData[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkGroups, setNetworkGroups] = useState<string[]>([]);

  const fetchAllChannelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stateData: Record<string, ChannelData[]> = {};
      const allNetworks = new Set<string>();

      // Fetch data for each state in parallel
      const fetchPromises = ZONES.flatMap((zone) =>
        zone.states.map(async (state) => {
          const response = await fetch(
            `/api/py/channels/xmlepg_VAST${state.code}`
          );
          if (!response.ok) {
            throw new Error(
              `Failed to fetch data for ${state.code}: ${response.status}`
            );
          }
          const data: ApiResponse = await response.json();
          return { channels: data.data.channels, stateCode: state.code };
        })
      );

      const results = await Promise.all(fetchPromises);

      // Process results
      for (const { stateCode, channels } of results) {
        stateData[stateCode] = channels;

        // Collect all network groups
        for (const channel of channels) {
          if (channel.channel_group) {
            allNetworks.add(channel.channel_group);
          }
        }
      }

      setChannelData(stateData);
      setNetworkGroups(Array.from(allNetworks).sort());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllChannelData();
  }, [fetchAllChannelData]);

  return {
    channelData,
    error,
    fetchAllChannelData,
    loading,
    networkGroups,
  };
}
