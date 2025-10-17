import { useCallback, useState } from "react";
import { ZONES } from "@/components/vast-channel-list/types";
import type { ChannelData } from "@/types/channel";

type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: ChannelData[];
  };
};

type UseVastChannelDataReturn = {
  channelData: Record<string, ChannelData[]>;
  networkGroups: string[];
  loading: boolean;
  error: string | null;
  fetchAllChannelData: () => Promise<void>;
};

const processChannels = (channels: ChannelData[]) => {
  const allNetworks = new Set<string>();

  for (const channel of channels) {
    if (channel.channel.group) {
      allNetworks.add(channel.channel.group);
    }
  }

  return allNetworks;
};

const fetchStateData = async (stateCode: string) => {
  const response = await fetch(`/api/py/channels/xmlepg_VAST${stateCode}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch data for ${stateCode}: ${response.status}`
    );
  }
  const data: ApiResponse = await response.json();
  return { channels: data.data.channels, stateCode };
};

export function useVastChannelData(): UseVastChannelDataReturn {
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
        zone.states.map((state) => fetchStateData(state.code))
      );

      const results = await Promise.all(fetchPromises);

      // Process results
      for (const { stateCode, channels } of results) {
        stateData[stateCode] = channels;
        const networks = processChannels(channels);
        for (const network of networks) {
          allNetworks.add(network);
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

  return {
    channelData,
    error,
    fetchAllChannelData,
    loading,
    networkGroups,
  };
}
