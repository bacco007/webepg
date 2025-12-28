"use client";

import { AlertCircle, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import NestedFilterSection from "@/components/nested-filter-section";
import { Status, StatusIndicator, StatusLabel } from "@/components/status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCookie, setCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo?: {
    light: string;
    dark: string;
  };
}

interface SourceStatus {
  source_file: { status: string; date: string };
  channels: { status: string; date: string };
  programs: { status: string; date: string };
  group: string | null;
  subgroup: string | null;
  location: string | null;
}

const STALE_THRESHOLD_HOURS = 24;

function getStatusType(fileStatus: {
  status: string;
  date: string;
}): "online" | "offline" | "degraded" | "maintenance" {
  if (!fileStatus.status || fileStatus.status === "not_downloaded") {
    return "offline";
  }
  if (fileStatus.date) {
    const fileDate = new Date(fileStatus.date);
    const now = new Date();
    const hoursDiff = (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > STALE_THRESHOLD_HOURS) {
      return "degraded";
    }
  }
  switch (fileStatus.status) {
    case "downloaded":
      return "online";
    case "error":
      return "degraded";
    default:
      return "maintenance";
  }
}

function buildNestedFilterData(
  groups: string[],
  sources: Source[],
  filterText: string,
  selectedSubgroups: string[]
): Record<string, { count: number; subgroups: Record<string, number> }> {
  const data: Record<
    string,
    { count: number; subgroups: Record<string, number> }
  > = {};
  for (const group of groups) {
    const subgroups: Record<string, number> = {};
    for (const source of sources) {
      if (
        source.group === group &&
        source.location.toLowerCase().includes(filterText.toLowerCase())
      ) {
        subgroups[source.subgroup] = (subgroups[source.subgroup] || 0) + 1;
      }
    }
    // Only include subgroups with count > 0 or selected
    for (const sub of selectedSubgroups) {
      if (!(sub in subgroups)) {
        const count = sources.filter(
          (s) => s.group === group && s.subgroup === sub
        ).length;
        if (count > 0) {
          subgroups[sub] = count;
        }
      }
    }
    const groupCount = Object.values(subgroups).reduce((a, b) => a + b, 0);
    data[group] = { count: groupCount, subgroups };
  }
  return data;
}

function getRelativeTime(dateString: string): string {
  if (!dateString) {
    return "never";
  }
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
  if (diff < 60) {
    return "just now";
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} min ago`;
  }
  if (diff < 86_400) {
    return `${Math.floor(diff / 3600)} hr ago`;
  }
  if (diff < 604_800) {
    return `${Math.floor(diff / 86_400)} days ago`;
  }
  return date.toLocaleDateString();
}

function getProgramsStatus(sourceStatus: SourceStatus) {
  const programs = sourceStatus.programs;
  const programsType =
    programs && typeof programs === "object" && "status" in programs
      ? getStatusType(programs as { status: string; date: string })
      : "offline";
  const programsLabel =
    programs && typeof programs === "object" && "status" in programs
      ? (programs as { status: string }).status || "not_downloaded"
      : "not_downloaded";
  const programsDate =
    programs && typeof programs === "object" && "date" in programs
      ? (programs as { date: string }).date
      : "";
  return { programsDate, programsLabel, programsType };
}

export default function SourcesPageClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);
  const [sourceStatus, setSourceStatus] = useState<Record<
    string,
    SourceStatus
  > | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/py/sources");
        if (!response.ok) {
          throw new Error("Failed to fetch sources");
        }
        const data: Source[] = await response.json();
        const sortedSources = data.sort((a, b) => {
          if (a.group !== b.group) {
            return a.group.localeCompare(b.group);
          }
          if (a.subgroup !== b.subgroup) {
            return a.subgroup.localeCompare(b.subgroup);
          }
          return a.location.localeCompare(b.location);
        });
        setSources(sortedSources);
        const currentSourceId = await getCookie("xmltvdatasource");
        setSelectedSourceId(currentSourceId || null);
      } catch {
        setError(
          "An error occurred while fetching the sources. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      setStatusError(null);
      try {
        const response = await fetch("/api/py/sources/status");
        if (!response.ok) {
          throw new Error("Failed to fetch source status");
        }
        const data = await response.json();
        setSourceStatus(data);
      } catch (_err) {
        setStatusError("Could not load source status");
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSourceSelect = async (sourceId: string) => {
    await setCookie("xmltvdatasource", sourceId);
    setSelectedSourceId(sourceId);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/py/sources");
      if (!response.ok) {
        throw new Error("Failed to fetch sources");
      }
      const data: Source[] = await response.json();
      const sortedSources = data.sort((a, b) => {
        if (a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        if (a.subgroup !== b.subgroup) {
          return a.subgroup.localeCompare(b.subgroup);
        }
        return a.location.localeCompare(b.location);
      });
      setSources(sortedSources);
    } catch {
      setError(
        "An error occurred while fetching the sources. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const groupedSources = useMemo(
    () =>
      sources.reduce(
        (accumulator, source) => {
          if (!accumulator[source.group]) {
            accumulator[source.group] = {};
          }
          if (!accumulator[source.group][source.subgroup]) {
            accumulator[source.group][source.subgroup] = [];
          }
          accumulator[source.group][source.subgroup].push(source);
          return accumulator;
        },
        {} as Record<string, Record<string, Source[]>>
      ),
    [sources]
  );

  const filteredSources = useMemo(
    () =>
      sources.filter(
        (source) =>
          source.location.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedGroups.length === 0 ||
            selectedGroups.includes(source.group)) &&
          (selectedSubgroups.length === 0 ||
            selectedSubgroups.includes(source.subgroup))
      ),
    [sources, filterText, selectedGroups, selectedSubgroups]
  );

  const groups = useMemo(
    () => Object.keys(groupedSources).sort(),
    [groupedSources]
  );

  const handleGroupToggle = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };
  const handleSubgroupToggle = (_group: string, subgroup: string) => {
    setSelectedSubgroups((prev) =>
      prev.includes(subgroup)
        ? prev.filter((s) => s !== subgroup)
        : [...prev, subgroup]
    );
  };

  const nestedFilterData = useMemo(
    () => buildNestedFilterData(groups, sources, filterText, selectedSubgroups),
    [groups, sources, filterText, selectedSubgroups]
  );

  function renderSourceStatus(sourceId: string) {
    if (!sourceStatus?.[sourceId]) {
      return null;
    }
    const { programsType, programsLabel, programsDate } = getProgramsStatus(
      sourceStatus[sourceId]
    );
    return (
      <div className="mb-2 flex items-center justify-center gap-2 text-xs">
        <Status
          status={
            programsType as "online" | "offline" | "degraded" | "maintenance"
          }
        >
          <StatusIndicator />
          <StatusLabel className="capitalize">
            {programsLabel.replace("_", " ")}
          </StatusLabel>
        </Status>
        <span className="text-muted-foreground">
          {getRelativeTime(programsDate)}
        </span>
      </div>
    );
  }

  // Create sidebar component
  const sidebar = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute top-2.5 left-2 size-4 text-muted-foreground" />
          <Input
            aria-label="Search sources"
            className="pl-8 text-sm"
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search sources..."
            value={filterText}
          />
          {filterText && (
            <Button
              aria-label="Clear search"
              className="absolute top-1 right-1 h-7 w-7 p-0"
              onClick={() => setFilterText("")}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <NestedFilterSection
          data={nestedFilterData}
          onGroupToggle={handleGroupToggle}
          onSubgroupToggle={handleSubgroupToggle}
          selectedGroups={selectedGroups}
          selectedSubgroups={selectedSubgroups}
          title="Market type"
        />
      </div>
      <div className="border-t p-3">
        <Button
          className="w-full text-xs"
          onClick={() => {
            setFilterText("");
            setSelectedGroups([]);
            setSelectedSubgroups([]);
          }}
          size="sm"
          variant="outline"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {filteredSources.length} of {sources.length} sources
        </div>
      </div>
    </div>
  );

  // Create header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        disabled={isLoading}
        onClick={handleRefresh}
        size="sm"
        variant="outline"
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Alert className="mb-4 max-w-md" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="p-0"
      sidebar={sidebar}
      sidebarClassName="p-0"
      title="Guide Sources"
    >
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <div
                className="animate-pulse rounded-lg border bg-card p-3"
                key={`loading-skeleton-${index + 1}`}
              >
                <div className="mb-2 h-8 w-24 rounded bg-muted" />
                <div className="mb-2 h-4 w-full rounded bg-muted" />
                <div className="mb-2 flex gap-1">
                  <div className="h-6 w-16 rounded-full bg-muted" />
                  <div className="h-6 w-20 rounded-full bg-muted" />
                </div>
                <div className="h-8 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredSources.map((source) => (
              <div
                className={cn(
                  "group relative flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/60 hover:shadow-lg",
                  selectedSourceId === source.id
                    ? "bg-primary/5 ring-2 ring-primary/80"
                    : ""
                )}
                key={source.id}
              >
                <div className="mb-3 flex min-h-12 flex-col items-center">
                  {source.logo ? (
                    <>
                      <img
                        alt={source.location}
                        className="mx-auto block h-10 w-24 object-contain dark:hidden"
                        src={source.logo.light || "/placeholder.svg"}
                      />
                      <img
                        alt={source.location}
                        className="mx-auto hidden h-10 w-24 object-contain dark:block"
                        src={source.logo.dark || "/placeholder.svg"}
                      />
                    </>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="font-bold text-lg text-primary">
                        {source.location.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="mb-1 line-clamp-1 text-center font-bold text-base text-foreground">
                  {source.location}
                </h3>

                {(() => {
                  if (statusLoading) {
                    return (
                      <div className="mb-2 flex items-center justify-center text-muted-foreground text-xs">
                        Loading status...
                      </div>
                    );
                  }
                  if (statusError) {
                    return (
                      <div className="mb-2 flex items-center justify-center text-destructive text-xs">
                        Status unavailable
                      </div>
                    );
                  }
                  return renderSourceStatus(source.id);
                })()}

                <div className="mb-2 flex flex-wrap items-center justify-center gap-1">
                  <Badge className="px-2 py-0.5 text-xs" variant="secondary">
                    {source.group}
                  </Badge>
                  <Badge className="px-2 py-0.5 text-xs" variant="outline">
                    {source.subgroup}
                  </Badge>
                </div>

                <div className="mt-auto">
                  <Button
                    aria-pressed={selectedSourceId === source.id}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 text-xs transition-all",
                      selectedSourceId === source.id
                        ? "bg-primary text-primary-foreground"
                        : "border"
                    )}
                    onClick={() => handleSourceSelect(source.id)}
                    size="sm"
                    variant={
                      selectedSourceId === source.id ? "default" : "outline"
                    }
                  >
                    {selectedSourceId === source.id && (
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {selectedSourceId === source.id
                      ? "Selected"
                      : "Select Source"}
                  </Button>
                </div>
              </div>
            ))}

            {filteredSources.length === 0 && (
              <div className="col-span-full flex h-40 items-center justify-center">
                <p className="text-center text-muted-foreground">
                  No sources found matching your filters. Try adjusting your
                  search criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
