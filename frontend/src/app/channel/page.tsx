'use client';

import Link from 'next/link';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FilterIcon,
  LayoutGrid,
  List,
  RefreshCw,
  X,
} from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getCookie } from '@/lib/cookies';

type Channel = {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_names?: {
    clean: string;
    location: string;
    real: string;
  };
  channel_number: string | number | null;
  chlogo: string;
  channel_group: string;
  channel_url: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  other_data: {
    channel_type: string;
    channel_specs: string;
    channel_name_group?: string;
  };
  program_count: number;
};

type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
};

type ViewMode = 'card' | 'table';
type SortField = 'name' | 'number' | 'group' | 'program_count';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'channel_group' | 'channel_type' | 'channel_name_group' | 'channel_specs';

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

function ChannelListContent() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmlepg_FTASYD');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedNameGroups, setSelectedNameGroups] = useState<string[]>([]);
  const [hideNoPrograms, setHideNoPrograms] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource = (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/channels/${storedDataSource}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setChannels(data.data.channels);
      setFilteredChannels(data.data.channels);
    } catch (error) {
      setError('Failed to fetch channels');
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    const filtered = channels.filter(
      (channel) =>
        ((channel.channel_names?.real || channel.channel_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          (typeof channel.channel_number === 'string' &&
            channel.channel_number.includes(searchTerm))) &&
        (selectedGroups.length === 0 || selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 || selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 || selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(channel.other_data.channel_name_group))) &&
        (!hideNoPrograms || channel.program_count > 0)
    );
    const sorted = sortChannels(filtered, sortField, sortDirection);
    setFilteredChannels(sorted);
  }, [
    searchTerm,
    channels,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    sortField,
    sortDirection,
  ]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleRefresh = () => {
    fetchChannels();
  };

  const handleGroupFilter = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSpecsFilter = (specs: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(specs) ? prev.filter((s) => s !== specs) : [...prev, specs]
    );
  };

  const handleNameGroupFilter = (nameGroup: string) => {
    setSelectedNameGroups((prev) =>
      prev.includes(nameGroup) ? prev.filter((ng) => ng !== nameGroup) : [...prev, nameGroup]
    );
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortChannels = (channels: Channel[], field: SortField, direction: SortDirection) => {
    return [...channels].sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name': {
          const aName = a.channel_names?.real || a.channel_name || '';
          const bName = b.channel_names?.real || b.channel_name || '';
          comparison = aName.localeCompare(bName);
          break;
        }
        case 'number': {
          const aNumber = parseInt(String(a.channel_number), 10) || Infinity;
          const bNumber = parseInt(String(b.channel_number), 10) || Infinity;
          comparison = aNumber - bNumber;
          break;
        }
        case 'group': {
          const aGroup = a.channel_group || '';
          const bGroup = b.channel_group || '';
          comparison = aGroup.localeCompare(bGroup);
          break;
        }
        case 'program_count': {
          const aCount = a.program_count || 0;
          const bCount = b.program_count || 0;
          comparison = aCount - bCount;
          break;
        }
      }
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const uniqueGroups = useMemo(
    () => Array.from(new Set(channels.map((channel) => channel.channel_group))).sort(),
    [channels]
  );
  const uniqueTypes = useMemo(
    () => Array.from(new Set(channels.map((channel) => channel.other_data.channel_type))).sort(),
    [channels]
  );
  const uniqueSpecs = useMemo(
    () => Array.from(new Set(channels.map((channel) => channel.other_data.channel_specs))).sort(),
    [channels]
  );
  const uniqueNameGroups = useMemo(
    () =>
      Array.from(
        new Set(
          channels
            .map((channel) => channel.other_data.channel_name_group)
            .filter((group): group is string => group !== undefined)
        )
      ).sort(),
    [channels]
  );

  const hasNameGroups = uniqueNameGroups.length > 0;

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedGroups([]);
    setSelectedTypes([]);
    setSelectedSpecs([]);
    setSelectedNameGroups([]);
    setHideNoPrograms(false);
  }, []);

  const FilterMenu = () => (
    <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <FilterIcon className="mr-2 size-4" />
          Filters
          {(selectedGroups.length > 0 ||
            selectedTypes.length > 0 ||
            selectedSpecs.length > 0 ||
            selectedNameGroups.length > 0 ||
            hideNoPrograms) && (
            <Badge variant="secondary" className="ml-2">
              {selectedGroups.length +
                selectedTypes.length +
                selectedSpecs.length +
                selectedNameGroups.length +
                (hideNoPrograms ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search filters..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Options">
              <CommandItem>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-no-programs"
                    checked={hideNoPrograms}
                    onCheckedChange={(checked) => setHideNoPrograms(checked as boolean)}
                  />
                  <Label htmlFor="hide-no-programs">Hide channels with no programs</Label>
                </div>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Channel Groups">
              <ScrollArea className="h-[200px]">
                {uniqueGroups.map((group) => (
                  <CommandItem key={group} onSelect={() => handleGroupFilter(group)}>
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
            <CommandGroup heading="Channel Types">
              <ScrollArea className="h-[200px]">
                {uniqueTypes.map((type) => (
                  <CommandItem key={type} onSelect={() => handleTypeFilter(type)}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => handleTypeFilter(type)}
                      />
                      <Label htmlFor={`type-${type}`}>{type}</Label>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Channel Specs">
              <ScrollArea className="h-[200px]">
                {uniqueSpecs.map((specs) => (
                  <CommandItem key={specs} onSelect={() => handleSpecsFilter(specs)}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`specs-${specs}`}
                        checked={selectedSpecs.includes(specs)}
                        onCheckedChange={() => handleSpecsFilter(specs)}
                      />
                      <Label htmlFor={`specs-${specs}`}>{specs}</Label>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
            {hasNameGroups && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Channel Name Groups">
                  <ScrollArea className="h-[200px]">
                    {uniqueNameGroups.map((nameGroup) => (
                      <CommandItem
                        key={nameGroup}
                        onSelect={() => handleNameGroupFilter(nameGroup)}
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`name-group-${nameGroup}`}
                            checked={selectedNameGroups.includes(nameGroup)}
                            onCheckedChange={() => handleNameGroupFilter(nameGroup)}
                          />
                          <Label htmlFor={`name-group-${nameGroup}`}>{nameGroup}</Label>
                        </div>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </>
            )}
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

  const ChannelCard = ({ channel, index }: { channel: Channel; index: number }) => (
    <Link
      href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
      passHref
      className="focus:ring-primary focus:outline-none focus:ring-2"
    >
      <Card
        className={`h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg ${
          channel.program_count === 0 ? 'bg-muted grayscale' : 'bg-card'
        }`}
      >
        <CardContent className="flex h-full flex-col items-center justify-center p-2">
          {channel.channel_logo.light !== 'N/A' && (
            <div className="mb-2 flex h-20 items-center justify-center">
              <img
                className="block size-auto max-h-full object-contain dark:hidden"
                src={channel.channel_logo.light}
                alt={decodeHtml(channel.channel_names?.real || channel.channel_name || '')}
              />
              <img
                className="hidden size-auto max-h-full object-contain dark:block"
                src={channel.channel_logo.dark}
                alt={decodeHtml(channel.channel_names?.real || channel.channel_name || '')}
              />
            </div>
          )}
          <h3
            className={`text-center text-lg font-bold ${
              channel.program_count === 0 ? 'text-gray-500 dark:text-gray-400' : ''
            }`}
          >
            {decodeHtml(channel.channel_names?.real || channel.channel_name || '')}
          </h3>
          <div className="flex items-center">
            {typeof channel.channel_number === 'string' && channel.channel_number !== 'N/A' && (
              <Badge
                variant="secondary"
                className={`mr-2 ${
                  channel.program_count === 0 ? 'text-gray-500 dark:text-gray-400' : ''
                }`}
              >
                LCN {channel.channel_number}
              </Badge>
            )}
            {channel.other_data.channel_specs !== 'N/A' && (
              <Badge
                variant="secondary"
                className={`mr-2 ${
                  channel.program_count === 0 ? 'text-gray-500 dark:text-gray-400' : ''
                }`}
              >
                {channel.other_data.channel_specs}
              </Badge>
            )}
          </div>
          {channel.other_data.channel_type !== 'N/A' && (
            <div className="flex items-center pt-1">
              <Badge
                variant="secondary"
                className={`mr-2 ${
                  channel.program_count === 0 ? 'text-gray-500 dark:text-gray-400' : ''
                }`}
              >
                {channel.other_data.channel_type}
              </Badge>
            </div>
          )}
          <div className="flex items-center pt-1">
            {channel.channel_group !== 'Unknown' && (
              <Badge
                variant="secondary"
                className={`mr-2 ${
                  channel.program_count === 0 ? 'text-gray-500 dark:text-gray-400' : ''
                }`}
              >
                {channel.channel_group}
              </Badge>
            )}
          </div>
          {channel.program_count === 0 && (
            <div className="flex items-center pt-1">
              <Badge variant="destructive">No Programs in EPG</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  const CardView = () => {
    if (groupBy !== 'none') {
      const groupedChannels: { [key: string]: Channel[] } = {};
      filteredChannels.forEach((channel) => {
        let groupKey;
        switch (groupBy) {
          case 'channel_group':
            groupKey = channel.channel_group;
            break;
          case 'channel_type':
            groupKey = channel.other_data.channel_type;
            break;
          case 'channel_name_group':
            groupKey = channel.other_data.channel_name_group || 'Ungrouped';
            break;
          case 'channel_specs':
            groupKey = channel.other_data.channel_specs;
            break;
          default:
            groupKey = 'Unknown';
        }
        if (groupKey !== 'N/A') {
          if (!groupedChannels[groupKey]) {
            groupedChannels[groupKey] = [];
          }
          groupedChannels[groupKey].push(channel);
        }
      });

      const sortedGroups = Object.keys(groupedChannels).sort();

      return (
        <div className="space-y-8">
          {sortedGroups.map((group) => (
            <div key={group}>
              <h2 className="mb-4 text-2xl font-bold">{group}</h2>
              <div className="xs:grid-cols-2 xs:gap-3 xs:p-3 grid grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-4 sm:p-4 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
                {groupedChannels[group].map((channel, index) => (
                  <ChannelCard
                    key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
                    channel={channel}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="xs:grid-cols-2 xs:gap-3 xs:p-3 grid grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:gap-4 sm:p-4 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
          {filteredChannels.map((channel, index) => (
            <ChannelCard
              key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
              channel={channel}
              index={index}
            />
          ))}
        </div>
      );
    }
  };

  const TableView = () => (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Logo</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('number')}
                className="hover:bg-accent hover:text-accent-foreground flex items-center"
              >
                Number
                {sortField === 'number' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="ml-2 size-4" />
                  ) : (
                    <ChevronDown className="ml-2 size-4" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="min-w-[200px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="hover:bg-accent hover:text-accent-foreground flex items-center"
              >
                Name
                {sortField === 'name' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="ml-2 size-4" />
                  ) : (
                    <ChevronDown className="ml-2 size-4" />
                  ))}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('group')}
                className="hover:bg-accent hover:text-accent-foreground flex items-center"
              >
                Group
                {sortField === 'group' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="ml-2 size-4" />
                  ) : (
                    <ChevronDown className="ml-2 size-4" />
                  ))}
              </Button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Specs</TableHead>
            {hasNameGroups && <TableHead>Name Group</TableHead>}
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('program_count')}
                className="hover:bg-accent hover:text-accent-foreground flex items-center"
              >
                Programs
                {sortField === 'program_count' &&
                  (sortDirection === 'asc' ? (
                    <ChevronUp className="ml-2 size-4" />
                  ) : (
                    <ChevronDown className="ml-2 size-4" />
                  ))}
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChannels.map((channel, index) => (
            <TableRow
              key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
              className="hover:bg-muted/50"
            >
              <TableCell>
                {channel.chlogo !== 'N/A' ? (
                  <div>
                    <img
                      className="block size-12 max-h-full object-contain dark:hidden"
                      src={channel.channel_logo.light}
                      alt={decodeHtml(channel.channel_names?.real || channel.channel_name || '')}
                    />
                    <img
                      className="hidden size-12 max-h-full object-contain dark:block"
                      src={channel.channel_logo.dark}
                      alt={decodeHtml(channel.channel_names?.real || channel.channel_name || '')}
                    />
                  </div>
                ) : (
                  <div className="bg-muted flex size-12 items-center justify-center rounded-md">
                    <span className="text-muted-foreground text-xs">No logo</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {typeof channel.channel_number === 'string' && channel.channel_number !== 'N/A'
                    ? channel.channel_number
                    : '-'}
                </Badge>
              </TableCell>
              <TableCell>
                {decodeHtml(channel.channel_names?.real || channel.channel_name || '')}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="mr-2">
                  {channel.channel_group !== 'N/A' ? channel.channel_group : '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="mr-2">
                  {channel.other_data.channel_type !== 'N/A'
                    ? channel.other_data.channel_type
                    : '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="mr-2">
                  {channel.other_data.channel_specs !== 'N/A'
                    ? channel.other_data.channel_specs
                    : '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="mr-2">
                  {typeof channel.program_count === 'number'
                    ? channel.program_count.toString()
                    : '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
                    className="hover:text-primary inline-flex items-center font-medium"
                  >
                    View
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold">Channel List</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
          />
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
          >
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {viewMode === 'card' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="sm:w-auto">
                  {groupBy === 'none'
                    ? 'Group By'
                    : `By ${
                        groupBy === 'channel_group'
                          ? 'Group'
                          : groupBy === 'channel_type'
                            ? 'Type'
                            : groupBy === 'channel_specs'
                              ? 'Specs'
                              : 'Name Group'
                      }`}
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setGroupBy('none')}>No Grouping</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setGroupBy('channel_group')}>
                  Group
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setGroupBy('channel_type')}>
                  Type
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setGroupBy('channel_specs')}>
                  Specs
                </DropdownMenuItem>
                {hasNameGroups && (
                  <DropdownMenuItem onSelect={() => setGroupBy('channel_name_group')}>
                    Name Group
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="size-4" />
          </Button>
          <FilterMenu />
        </div>
      </div>
      <ScrollArea className="grow">
        <div className="w-full p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : viewMode === 'card' ? (
            <CardView />
          ) : (
            <TableView />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function ChannelListPage() {
  return (
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <ChannelListContent />
      </Suspense>
    </main>
  );
}
