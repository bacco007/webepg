import { useCallback, useEffect, useState } from "react";
import {
  createChannel,
  deleteChannel,
  getAllChannels,
  updateChannel,
} from "@/lib/additional-channels-api";
import type {
  AdditionalChannel,
  CreateChannelRequest,
  UpdateChannelRequest,
} from "@/types/additional-channels";

interface UseAdditionalChannelsReturn {
  channels: AdditionalChannel[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createChannel: (data: CreateChannelRequest) => Promise<void>;
  updateChannel: (id: string, data: UpdateChannelRequest) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
}

export function useAdditionalChannels(): UseAdditionalChannelsReturn {
  const [channels, setChannels] = useState<AdditionalChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllChannels();
      setChannels(data.channels);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch channels";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateChannel = useCallback(
    async (channelData: CreateChannelRequest) => {
      setError(null);
      try {
        await createChannel(channelData);
        await fetchChannels();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create channel";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchChannels]
  );

  const handleUpdateChannel = useCallback(
    async (id: string, channelData: UpdateChannelRequest) => {
      setError(null);
      try {
        await updateChannel(id, channelData);
        await fetchChannels();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update channel";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchChannels]
  );

  const handleDeleteChannel = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteChannel(id);
        await fetchChannels();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete channel";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchChannels]
  );

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    createChannel: handleCreateChannel,
    deleteChannel: handleDeleteChannel,
    error,
    loading,
    refetch: fetchChannels,
    updateChannel: handleUpdateChannel,
  };
}
