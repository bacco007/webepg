'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, FilterIcon, RefreshCw, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getCookie, setCookie } from '@/lib/cookies';

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

export default function XmltvSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const data: Source[] = await response.json();
        const sortedSources = data.sort((a, b) => {
          if (a.group !== b.group) return a.group.localeCompare(b.group);
          if (a.subgroup !== b.subgroup)
            return a.subgroup.localeCompare(b.subgroup);
          return a.location.localeCompare(b.location);
        });
        setSources(sortedSources);
        const currentSourceId = await getCookie('xmltvdatasource');
        setSelectedSourceId(currentSourceId || null);
      } catch {
        setError(
          'An error occurred while fetching the sources. Please try again later.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, []);

  const handleSourceSelect = async (sourceId: string) => {
    await setCookie('xmltvdatasource', sourceId);
    setSelectedSourceId(sourceId);
  };

  const groupedSources = useMemo(() => {
    return sources.reduce(
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
      {} as Record<string, Record<string, Source[]>>,
    );
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter(
      source =>
        source.location.toLowerCase().includes(filterText.toLowerCase()) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(source.group)) &&
        (selectedSubgroups.length === 0 ||
          selectedSubgroups.includes(source.subgroup)),
    );
  }, [sources, filterText, selectedGroups, selectedSubgroups]);

  const groups = useMemo(
    () => Object.keys(groupedSources).sort(),
    [groupedSources],
  );

  const uniqueSubgroups = useMemo(() => {
    const subgroups = new Set<string>();
    sources.forEach(source => subgroups.add(source.subgroup));
    return [...subgroups].sort();
  }, [sources]);

  const handleGroupFilter = (group: string) => {
    setSelectedGroups(previous =>
      previous.includes(group)
        ? previous.filter(g => g !== group)
        : [...previous, group],
    );
  };

  const handleSubgroupFilter = (subgroup: string) => {
    setSelectedSubgroups(previous =>
      previous.includes(subgroup)
        ? previous.filter(s => s !== subgroup)
        : [...previous, subgroup],
    );
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedGroups([]);
    setSelectedSubgroups([]);
  };

  const FilterMenu = () => (
    <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <FilterIcon className="mr-2 size-4" />
          Filters
          {(selectedGroups.length > 0 || selectedSubgroups.length > 0) && (
            <Badge variant="secondary" className="ml-2">
              {selectedGroups.length + selectedSubgroups.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="end">
        <Command>
          <CommandInput placeholder="Search filters..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Groups">
              <ScrollArea className="h-[200px]">
                {groups.map(group => (
                  <CommandItem
                    key={group}
                    onSelect={() => handleGroupFilter(group)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group}`}
                        checked={selectedGroups.includes(group)}
                        onCheckedChange={() => handleGroupFilter(group)}
                      />
                      <Label htmlFor={`group-${group}`}>{group}</Label>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Subgroups">
              <ScrollArea className="h-[200px]">
                {uniqueSubgroups.map(subgroup => (
                  <CommandItem
                    key={subgroup}
                    onSelect={() => handleSubgroupFilter(subgroup)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`subgroup-${subgroup}`}
                        checked={selectedSubgroups.includes(subgroup)}
                        onCheckedChange={() => handleSubgroupFilter(subgroup)}
                      />
                      <Label htmlFor={`subgroup-${subgroup}`}>{subgroup}</Label>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
          <div className="p-2 border-t">
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              <X className="mr-2 size-4" />
              Clear Filters
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="border-gray-900 border-b-2 rounded-full size-32 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => globalThis.location.reload()}>
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h1 className="font-bold text-2xl">Guide Sources</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search sources..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-[200px]"
          />
          <FilterMenu />
        </div>
      </div>
      <ScrollArea className="grow">
        <div className="p-4">
          <Tabs defaultValue={groups[0]} className="space-y-6 w-full">
            <div className="border-b">
              <TabsList className="before:bottom-0 before:absolute relative before:inset-x-0 gap-0.5 bg-transparent mb-3 p-0 before:bg-border h-auto before:h-px">
                {groups.map(group => (
                  <TabsTrigger
                    key={group}
                    value={group}
                    className="data-[state=active]:z-10 bg-muted data-[state=active]:shadow-none py-2 border-x border-t border-border rounded-b-none overflow-hidden"
                  >
                    {group}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {groups.map(group => (
              <TabsContent key={group} value={group} className="space-y-6">
                <div className="gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                  {filteredSources
                    .filter(source => source.group === group)
                    .map(source => (
                      <div
                        key={source.id}
                        className={cn(
                          'relative flex flex-col rounded-lg bg-card p-3 transition-all hover:shadow-md',
                          selectedSourceId === source.id
                            ? 'ring-2 ring-primary'
                            : 'border',
                        )}
                      >
                        <div className="flex justify-start items-start mb-2 h-10">
                          {source.logo ? (
                            <>
                              <img
                                className="dark:hidden block w-auto h-8 object-contain"
                                src={source.logo.light || '/placeholder.svg'}
                                alt={source.location}
                              />
                              <img
                                className="hidden dark:block w-auto h-8 object-contain"
                                src={source.logo.dark || '/placeholder.svg'}
                                alt={source.location}
                              />
                            </>
                          ) : (
                            <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 h-8">
                              <span className="font-bold text-primary text-lg">
                                {source.location.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 className="mb-2 font-semibold text-sm text-left line-clamp-1">
                          {source.location}
                        </h3>

                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {source.group}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {source.subgroup}
                          </Badge>
                        </div>

                        <div className="mt-auto">
                          <Button
                            variant={
                              selectedSourceId === source.id
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleSourceSelect(source.id)}
                          >
                            {selectedSourceId === source.id
                              ? 'Selected'
                              : 'Select Source'}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
