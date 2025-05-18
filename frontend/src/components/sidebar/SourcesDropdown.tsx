'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Search, Tv, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getCookie, setCookie } from '@/lib/cookies';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

export function SourcesDropdown({ onSourceSelect }: SourcesDropdownProps = {}) {
  const [sources, setSources] = useState<GroupedSources[]>([]);
  const [filteredSources, setFilteredSources] = useState<GroupedSources[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const debouncedFilterText = useDebounce(inputValue, 300);

  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const data: Source[] = await response.json();
        const groupedSources = groupSources(data);
        setSources(groupedSources);
        setFilteredSources(groupedSources);

        const savedSourceId = await getCookie('xmltvdatasource');
        const savedSource = data.find(source => source.id === savedSourceId);
        if (savedSource) {
          setSelectedSource(savedSource);
        } else if (data.length > 0) {
          setSelectedSource(data[0]);
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
        setError('Failed to load sources. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, []);

  useEffect(() => {
    setFilterText(debouncedFilterText);
  }, [debouncedFilterText]);

  useEffect(() => {
    const filtered = sources
      .map(group => ({
        ...group,
        subgroups: group.subgroups
          .map(subgroup => ({
            ...subgroup,
            sources: subgroup.sources.filter(source =>
              source.location.toLowerCase().includes(filterText.toLowerCase()),
            ),
          }))
          .filter(subgroup => subgroup.sources.length > 0),
      }))
      .filter(group => group.subgroups.length > 0);

    setFilteredSources(filtered);
  }, [filterText, sources]);

  const groupSources = React.useCallback((data: Source[]): GroupedSources[] => {
    const groupMap = new Map<string, Map<string, Source[]>>();

    data.forEach(source => {
      if (!groupMap.has(source.group)) {
        groupMap.set(source.group, new Map());
      }
      const subgroupMap = groupMap.get(source.group)!;
      if (!subgroupMap.has(source.subgroup)) {
        subgroupMap.set(source.subgroup, []);
      }
      subgroupMap.get(source.subgroup)!.push(source);
    });

    return [...groupMap.entries()]
      .map(([group, subgroupMap]) => ({
        group,
        subgroups: [...subgroupMap.entries()]
          .map(([name, sources]) => ({
            name,
            sources: sources.sort((a, b) =>
              a.location.localeCompare(b.location),
            ),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.group.localeCompare(b.group));
  }, []);

  const handleSourceSelect = async (source: Source) => {
    setSelectedSource(source);
    try {
      await setCookie('xmltvdatasource', source.id);
      if (onSourceSelect) {
        onSourceSelect(source);
      } else {
        globalThis.location.reload();
      }
    } catch (error) {
      console.error('Error saving source selection:', error);
      // Consider adding user-facing error notification here
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Tv
            size={16}
            strokeWidth={2}
            className="hidden sm:inline-block mr-2"
            aria-hidden="true"
          />
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block truncate">
                    {selectedSource?.location
                      ? isMobile
                        ? selectedSource.location.slice(0, 30) +
                          (selectedSource.location.length > 30 ? '...' : '')
                        : selectedSource.location
                      : 'Select Guide'}
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
            className="ml-auto sm:ml-2"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] sm:w-[320px]"
        onKeyDown={e => {
          if (e.key === 'ArrowDown') {
            // Focus the first menu item
            const firstItem =
              e.currentTarget.querySelector('[role="menuitem"]');
            if (firstItem) {
              (firstItem as HTMLElement).focus();
            }
          }
        }}
        onCloseAutoFocus={e => {
          // Prevent the default behavior which can cause focus issues
          e.preventDefault();
        }}
      >
        <div className="p-2">
          <div className="flex items-center space-x-2">
            <Search className="opacity-50 size-4" />
            <div className="relative w-full">
              <Input
                placeholder="Filter sources..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="pr-8 w-full h-8"
                // Add these props to help maintain focus
                onFocus={e => e.currentTarget.select()}
                autoComplete="off"
                onKeyDown={e => {
                  // Prevent dropdown from closing when pressing Enter in search
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="top-1/2 right-2 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="mr-2 size-4 animate-spin" />
              <span>Loading sources...</span>
            </div>
          ) : error ? (
            <DropdownMenuItem disabled>{error}</DropdownMenuItem>
          ) : sources.length === 0 ? (
            <DropdownMenuItem disabled>No sources available</DropdownMenuItem>
          ) : filteredSources.length === 0 ? (
            <DropdownMenuItem disabled>
              No matching sources found
            </DropdownMenuItem>
          ) : (
            filteredSources.map(group => (
              <DropdownMenuGroup key={group.group}>
                <DropdownMenuLabel>{group.group}</DropdownMenuLabel>
                {group.subgroups.map(subgroup => (
                  <React.Fragment key={subgroup.name}>
                    <DropdownMenuLabel className="px-2 py-1 font-normal text-muted-foreground text-xs">
                      {subgroup.name}
                    </DropdownMenuLabel>
                    {subgroup.sources.map(source => (
                      <DropdownMenuItem
                        key={source.id}
                        onSelect={() => handleSourceSelect(source)}
                        className={
                          selectedSource?.id === source.id ? 'bg-muted' : ''
                        }
                      >
                        {selectedSource?.id === source.id && (
                          <Check className="mr-2 w-4 h-4" />
                        )}
                        {source.location}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
