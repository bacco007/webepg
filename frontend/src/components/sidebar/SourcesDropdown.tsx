'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Search, Tv } from 'lucide-react';

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

  const groupSources = (data: Source[]): GroupedSources[] => {
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
  };

  const handleSourceSelect = async (source: Source) => {
    setSelectedSource(source);
    await setCookie('xmltvdatasource', source.id);
    if (onSourceSelect) {
      onSourceSelect(source);
    } else {
      globalThis.location.reload();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Tv
            size={16}
            strokeWidth={2}
            className="mr-2 hidden sm:inline-block"
            aria-hidden="true"
          />
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <span className="block truncate">
              {selectedSource?.location
                ? isMobile
                  ? selectedSource.location.slice(0, 30) +
                    (selectedSource.location.length > 30 ? '...' : '')
                  : selectedSource.location
                : 'Select Guide'}
            </span>
          )}
          <ChevronDown
            className="ml-auto sm:ml-2"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] sm:w-[320px]">
        <div className="p-2">
          <div className="flex items-center space-x-2">
            <Search className="size-4 opacity-50" />
            <Input
              placeholder="Filter sources..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="h-8 w-full"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {error ? (
            <DropdownMenuItem disabled>{error}</DropdownMenuItem>
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
                    <DropdownMenuLabel className="text-muted-foreground px-2 py-1 text-xs font-normal">
                      {subgroup.name}
                    </DropdownMenuLabel>
                    {subgroup.sources.map(source => (
                      <DropdownMenuItem
                        key={source.id}
                        onSelect={() => handleSourceSelect(source)}
                      >
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
