import { useCallback, useEffect, useState } from "react";
import {
  createSource,
  deleteSource,
  getAllSources,
  updateSource,
} from "@/lib/xmltv-sources-api";
import type {
  CreateSourceRequest,
  SourceType,
  UpdateSourceRequest,
  XmltvSource,
} from "@/types/xmltv-sources";

interface UseXmltvSourcesReturn {
  sources: XmltvSource[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSource: (data: CreateSourceRequest) => Promise<void>;
  updateSource: (id: string, data: UpdateSourceRequest) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
}

export function useXmltvSources(sourceType: SourceType): UseXmltvSourcesReturn {
  const [sources, setSources] = useState<XmltvSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSources(sourceType);
      setSources(data.sources);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch sources";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sourceType]);

  const handleCreateSource = useCallback(
    async (sourceData: CreateSourceRequest) => {
      setError(null);
      try {
        await createSource(sourceType, sourceData);
        await fetchSources();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create source";
        setError(errorMessage);
        throw err;
      }
    },
    [sourceType, fetchSources]
  );

  const handleUpdateSource = useCallback(
    async (id: string, sourceData: UpdateSourceRequest) => {
      setError(null);
      try {
        await updateSource(sourceType, id, sourceData);
        await fetchSources();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update source";
        setError(errorMessage);
        throw err;
      }
    },
    [sourceType, fetchSources]
  );

  const handleDeleteSource = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteSource(sourceType, id);
        await fetchSources();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete source";
        setError(errorMessage);
        throw err;
      }
    },
    [sourceType, fetchSources]
  );

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return {
    createSource: handleCreateSource,
    deleteSource: handleDeleteSource,
    error,
    loading,
    refetch: fetchSources,
    sources,
    updateSource: handleUpdateSource,
  };
}
