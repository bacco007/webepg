import { useCallback, useEffect, useState } from "react";
import {
  createAdditionalData,
  deleteAdditionalData,
  getAdditionalData,
  getAllAdditionalDataFiles,
  updateAdditionalData,
} from "@/lib/additional-data-api";
import type {
  AdditionalDataChannel,
  AdditionalDataFile,
  CreateAdditionalDataRequest,
  UpdateAdditionalDataRequest,
} from "@/types/additional-data";

interface NormalizedAdditionalDataResponse {
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  channels: AdditionalDataChannel[];
  channel_count: number;
}

interface UseAdditionalDataReturn {
  files: AdditionalDataFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getSourceData: (
    sourceId: string
  ) => Promise<NormalizedAdditionalDataResponse>;
  createSourceData: (
    sourceId: string,
    data: CreateAdditionalDataRequest,
    isXmlepg?: boolean
  ) => Promise<void>;
  updateSourceData: (
    sourceId: string,
    data: UpdateAdditionalDataRequest,
    isXmlepg?: boolean
  ) => Promise<void>;
  deleteSourceData: (sourceId: string) => Promise<void>;
}

export function useAdditionalData(): UseAdditionalDataReturn {
  const [files, setFiles] = useState<AdditionalDataFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllAdditionalDataFiles();
      setFiles(data.files);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch additional data files";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetSourceData = useCallback(
    async (sourceId: string): Promise<NormalizedAdditionalDataResponse> => {
      setError(null);
      try {
        return await getAdditionalData(sourceId);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch additional data for source";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const handleCreateSourceData = useCallback(
    async (
      sourceId: string,
      data: CreateAdditionalDataRequest,
      isXmlepg = false
    ) => {
      setError(null);
      try {
        await createAdditionalData(sourceId, data, isXmlepg);
        await fetchFiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create additional data";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchFiles]
  );

  const handleUpdateSourceData = useCallback(
    async (
      sourceId: string,
      data: UpdateAdditionalDataRequest,
      isXmlepg?: boolean
    ) => {
      setError(null);
      try {
        await updateAdditionalData(sourceId, data, isXmlepg);
        await fetchFiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update additional data";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchFiles]
  );

  const handleDeleteSourceData = useCallback(
    async (sourceId: string) => {
      setError(null);
      try {
        await deleteAdditionalData(sourceId);
        await fetchFiles();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete additional data";
        setError(errorMessage);
        throw err;
      }
    },
    [fetchFiles]
  );

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    createSourceData: handleCreateSourceData,
    deleteSourceData: handleDeleteSourceData,
    error,
    files,
    getSourceData: handleGetSourceData,
    loading,
    refetch: fetchFiles,
    updateSourceData: handleUpdateSourceData,
  };
}
