'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, FilterIcon, RefreshCw, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <PopoverContent className="w-[300px] p-0" align="end">
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
          <div className="border-t p-2">
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
      <div className="flex h-screen items-center justify-center">
        <div className="size-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
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
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold">XMLTV Sources</h1>
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
          <Tabs defaultValue={groups[0]} className="w-full space-y-6">
            <div className="border-b">
              <TabsList className="relative mb-3 h-auto gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
                {groups.map(group => (
                  <TabsTrigger
                    key={group}
                    value={group}
                    className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                  >
                    {group}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {groups.map(group => (
              <TabsContent key={group} value={group} className="space-y-6">
                <div className="xs:grid-cols-2 xs:gap-3 xs:p-3 grid grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-4 sm:p-4 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
                  {filteredSources
                    .filter(source => source.group === group)
                    .map(source => (
                      <Card
                        key={source.id}
                        className={`h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg ${
                          selectedSourceId === source.id
                            ? 'bg-muted'
                            : 'bg-card'
                        }`}
                      >
                        <CardContent className="flex h-full flex-col items-center justify-center p-2">
                          {source.logo && (
                            <div className="mb-2 flex h-20 items-center justify-center">
                              <img
                                className="block size-auto max-h-full object-contain dark:hidden"
                                src={source.logo.light}
                                alt={source.location}
                              />
                              <img
                                className="hidden size-auto max-h-full object-contain dark:block"
                                src={source.logo.dark}
                                alt={source.location}
                              />
                            </div>
                          )}
                          <h3 className="text-center text-lg font-bold">
                            {source.location}
                          </h3>
                          <div className="flex items-center">
                            <Badge variant="secondary" className="mr-2">
                              {source.group}
                            </Badge>{' '}
                            <Badge variant="secondary" className="mr-2">
                              {source.subgroup}
                            </Badge>
                          </div>
                          {/* <div className="flex items-center pt-1">
                            <Badge variant="secondary" className="mr-2">
                              ID: {source.id}
                            </Badge>
                          </div> */}
                          <div className="mt-2">
                            <Button
                              variant={
                                selectedSourceId === source.id
                                  ? 'default'
                                  : 'outline'
                              }
                              className="w-full"
                              onClick={() => handleSourceSelect(source.id)}
                            >
                              {selectedSourceId === source.id
                                ? 'Current Source'
                                : 'Select Source'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
