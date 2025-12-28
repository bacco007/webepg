"use client";

import {
  Check,
  ChevronDown,
  Globe,
  Loader2,
  Search,
  Tv,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getCookie, setCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
}

interface GroupedSources {
  group: string;
  subgroups: {
    name: string;
    sources: Source[];
  }[];
}

interface SourcesDropdownProps {
  onSourceSelect?: (source: Source) => void;
}

const getDisplayText = (
  selectedSource: Source | null,
  isMobile: boolean
): string => {
  if (!selectedSource?.location) {
    return "Select Guide";
  }

  if (isMobile && selectedSource.location.length > 30) {
    return `${selectedSource.location.slice(0, 30)}...`;
  }

  return selectedSource.location;
};

const getLoadingContent = (
  isLoading: boolean,
  error: string | null,
  sources: GroupedSources[],
  filteredSources: GroupedSources[]
) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 size-4 animate-spin" />
        <span>Loading sources...</span>
      </div>
    );
  }

  if (error) {
    return <DropdownMenuItem disabled>{error}</DropdownMenuItem>;
  }

  if (sources.length === 0) {
    return <DropdownMenuItem disabled>No sources available</DropdownMenuItem>;
  }

  if (filteredSources.length === 0) {
    return (
      <DropdownMenuItem disabled>No matching sources found</DropdownMenuItem>
    );
  }

  return null;
};

const groupSources = (data: Source[]): GroupedSources[] => {
  const groupMap = new Map<string, Map<string, Source[]>>();

  for (const source of data) {
    if (!groupMap.has(source.group)) {
      groupMap.set(source.group, new Map());
    }
    const subgroupMap = groupMap.get(source.group);
    if (subgroupMap) {
      if (!subgroupMap.has(source.subgroup)) {
        subgroupMap.set(source.subgroup, []);
      }
      const sourcesList = subgroupMap.get(source.subgroup);
      if (sourcesList) {
        sourcesList.push(source);
      }
    }
  }

  return [...groupMap.entries()]
    .map(([group, subgroupMap]) => ({
      group,
      subgroups: [...subgroupMap.entries()]
        .map(([name, sourceList]) => ({
          name,
          sources: sourceList.sort((a, b) =>
            a.location.localeCompare(b.location)
          ),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
};

export function SourcesDropdown({ onSourceSelect }: SourcesDropdownProps = {}) {
  const [sources, setSources] = useState<GroupedSources[]>([]);
  const [filteredSources, setFilteredSources] = useState<GroupedSources[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedFilterText = useDebounce(inputValue, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMobile = useMediaQuery("(max-width: 640px)");

  const fetchSources = useCallback(async () => {
    try {
      const response = await fetch("/api/py/sources");
      if (!response.ok) {
        throw new Error("Failed to fetch sources");
      }
      const data: Source[] = await response.json();
      const groupedSources = groupSources(data);
      setSources(groupedSources);
      setFilteredSources(groupedSources);

      const savedSourceId = await getCookie("xmltvdatasource");
      const savedSource = data.find((source) => source.id === savedSourceId);
      if (savedSource) {
        setSelectedSource(savedSource);
      } else if (data.length > 0) {
        setSelectedSource(data[0]);
      }
    } catch (_error) {
      setError("Failed to load sources. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    setFilterText(debouncedFilterText);
  }, [debouncedFilterText]);

  useEffect(() => {
    const filtered = sources
      .map((group) => ({
        ...group,
        subgroups: group.subgroups
          .map((subgroup) => ({
            ...subgroup,
            sources: subgroup.sources.filter(
              (source) =>
                source.location
                  .toLowerCase()
                  .includes(filterText.toLowerCase()) ||
                source.group.toLowerCase().includes(filterText.toLowerCase()) ||
                source.subgroup.toLowerCase().includes(filterText.toLowerCase())
            ),
          }))
          .filter((subgroup) => subgroup.sources.length > 0),
      }))
      .filter((group) => group.subgroups.length > 0);

    setFilteredSources(filtered);
  }, [filterText, sources]);

  const handleSourceSelect = async (source: Source) => {
    setSelectedSource(source);
    try {
      await setCookie("xmltvdatasource", source.id);
      if (onSourceSelect) {
        onSourceSelect(source);
      } else {
        globalThis.location.reload();
      }
    } catch (_error) {
      // Consider adding user-facing error notification here
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      // Clear search when dropdown closes
      setInputValue("");
    }
  };

  const loadingContent = getLoadingContent(
    isLoading,
    error,
    sources,
    filteredSources
  );

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full hover:bg-muted/50 sm:w-auto"
          variant="outline"
        >
          <Tv
            aria-hidden="true"
            className="mr-2 hidden sm:inline-block"
            size={16}
            strokeWidth={2}
          />
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block truncate">
                    {getDisplayText(selectedSource, isMobile)}
                  </span>
                </TooltipTrigger>
                {selectedSource?.location &&
                  selectedSource.location.length > 30 && (
                    <TooltipContent>
                      <p>{selectedSource.location}</p>
                    </TooltipContent>
                  )}
              </Tooltip>
            </TooltipProvider>
          )}
          <ChevronDown
            aria-hidden="true"
            className="ml-auto sm:ml-2"
            size={16}
            strokeWidth={2}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] sm:w-[320px]"
        onCloseAutoFocus={(e) => {
          // Prevent the default behavior which can cause focus issues
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          // Only handle keyboard navigation if we're not in the search input
          if (e.target === searchInputRef.current) {
            return;
          }
          if (e.key === "ArrowDown") {
            // Focus the first menu item
            const firstItem =
              e.currentTarget.querySelector('[role="menuitem"]');
            if (firstItem) {
              (firstItem as HTMLElement).focus();
            }
          }
        }}
      >
        <div className="p-2">
          <div className="flex items-center space-x-2">
            <Search className="size-4 opacity-50" />
            <div className="relative w-full">
              <Input
                autoComplete="off"
                className="h-8 w-full pr-8"
                onChange={(e) => {
                  e.stopPropagation();
                  setInputValue(e.target.value);
                }}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                placeholder="Filter sources..."
                ref={searchInputRef}
                value={inputValue}
              />
              {inputValue && (
                <button
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setInputValue("")}
                  type="button"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {loadingContent ||
            filteredSources.map((group) => (
              <DropdownMenuGroup key={group.group}>
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Globe className="size-4" />
                  {group.group}
                </DropdownMenuLabel>
                {group.subgroups.map((subgroup) => (
                  <React.Fragment key={subgroup.name}>
                    <DropdownMenuLabel className="px-2 py-1 font-normal text-muted-foreground text-xs">
                      {subgroup.name}
                    </DropdownMenuLabel>
                    {subgroup.sources.map((source) => (
                      <DropdownMenuItem
                        className={cn(
                          "flex items-start gap-2 px-2 py-1.5 hover:bg-muted/50",
                          selectedSource?.id === source.id && "bg-muted/50"
                        )}
                        key={source.id}
                        onSelect={() => handleSourceSelect(source)}
                      >
                        {selectedSource?.id === source.id && (
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span className="min-w-0 flex-1 break-words">
                          {source.location}
                        </span>
                        {source.id === selectedSource?.id && (
                          <Badge
                            className="ml-2 shrink-0 bg-primary/10 text-primary"
                            variant="secondary"
                          >
                            Active
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
