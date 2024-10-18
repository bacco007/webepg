/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-case-declarations */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
} from 'lucide-react';
import Link from 'next/link';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
type GroupBy = 'none' | 'channel_group' | 'channel_type';

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const ChannelList: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmlepg_FTASYD');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [hideNoPrograms, setHideNoPrograms] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmlepg_FTASYD';
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
    hideNoPrograms,
    sortField,
    sortDirection,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
        case 'name':
          const aName = a.channel_names?.real || a.channel_name || '';
          const bName = b.channel_names?.real || b.channel_name || '';
          comparison = aName.localeCompare(bName);
          break;
        case 'number':
          const aNumber = parseInt(String(a.channel_number), 10) || Infinity;
          const bNumber = parseInt(String(b.channel_number), 10) || Infinity;
          comparison = aNumber - bNumber;
          break;
        case 'group':
          const aGroup = a.channel_group || '';
          const bGroup = b.channel_group || '';
          comparison = aGroup.localeCompare(bGroup);
          break;
        case 'program_count':
          const aCount = a.program_count || 0;
          const bCount = b.program_count || 0;
          comparison = aCount - bCount;
          break;
      }
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const uniqueGroups = Array.from(new Set(channels.map((channel) => channel.channel_group))).sort();
  const uniqueTypes = Array.from(
    new Set(channels.map((channel) => channel.other_data.channel_type))
  ).sort();
  const uniqueSpecs = Array.from(
    new Set(channels.map((channel) => channel.other_data.channel_specs))
  ).sort();

  const FilterPanel = () => (
    <div
      className={`bg-background border-border h-full border-l p-4 transition-all duration-300 ease-in-out ${
        isFilterPanelOpen ? 'w-64' : 'w-0 overflow-hidden opacity-0'
      }`}
    >
      <h2 className="mb-4 text-lg font-semibold">Filters</h2>
      <div className="mb-4">
        <Label htmlFor="search-channels" className="mb-2 block text-sm font-medium">
          Search Channels
        </Label>
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            id="search-channels"
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-8 pr-4"
          />
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Filter by Group</h3>
            <div className="space-y-2">
              {uniqueGroups.map((group) => (
                <div key={group} className="flex items-center">
                  <Checkbox
                    id={`group-${group}`}
                    checked={selectedGroups.includes(group)}
                    onCheckedChange={() => handleGroupFilter(group)}
                  />
                  <Label htmlFor={`group-${group}`} className="ml-2 text-sm">
                    {group}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Filter by Type</h3>
            <div className="space-y-2">
              {uniqueTypes.map((type) => (
                <div key={type} className="flex items-center">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleTypeFilter(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="ml-2 text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Filter by Specs</h3>
            <div className="space-y-2">
              {uniqueSpecs.map((specs) => (
                <div key={specs} className="flex items-center">
                  <Checkbox
                    id={`specs-${specs}`}
                    checked={selectedSpecs.includes(specs)}
                    onCheckedChange={() => handleSpecsFilter(specs)}
                  />
                  <Label htmlFor={`specs-${specs}`} className="ml-2 text-sm">
                    {specs}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="hide-no-programs"
              checked={hideNoPrograms}
              onCheckedChange={(checked) => setHideNoPrograms(checked as boolean)}
            />
            <Label htmlFor="hide-no-programs" className="ml-2 text-sm">
              Hide channels with no programs
            </Label>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  const ChannelCard = ({ channel }: { channel: Channel }) => (
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
        const groupKey =
          groupBy === 'channel_group' ? channel.channel_group : channel.other_data.channel_type;
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
                {groupedChannels[group].map((channel) => (
                  <ChannelCard
                    key={`${channel.channel_slug}-${channel.channel_number}`}
                    channel={channel}
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
          {filteredChannels.map((channel) => (
            <ChannelCard
              key={`${channel.channel_slug}-${channel.channel_number}`}
              channel={channel}
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
          {filteredChannels.map((channel) => (
            <TableRow
              key={`${channel.channel_slug}-${channel.channel_number}`}
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-xl text-red-500" role="alert">
            {error}
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="bg-background sticky top-0 w-full border-b p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-xl font-bold sm:text-2xl">Weekly EPG (by Channel)</h1>
          <div className="flex flex-wrap items-center gap-2">
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
                      : `By ${groupBy === 'channel_group' ? 'Group' : 'Type'}`}
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setGroupBy('none')}>
                    No Grouping
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setGroupBy('channel_group')}>
                    Group
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setGroupBy('channel_type')}>
                    Type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="sm:w-auto"
              aria-label="Refresh channel list"
            >
              <RefreshCw className="mr-2 size-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              variant="outline"
              aria-label={isFilterPanelOpen ? 'Close filter panel' : 'Open filter panel'}
            >
              {isFilterPanelOpen ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
              <span className="ml-2 hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="relative flex grow">
        <ScrollArea className="h-[calc(100vh-80px)] w-full">
          <div className="flex">
            <div className="grow p-4">
              {loading ? (
                <div
                  className="flex h-full items-center justify-center"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <LoadingSpinner />
                </div>
              ) : viewMode === 'card' ? (
                <CardView />
              ) : (
                <div className="container mx-auto px-2 py-4">
                  <TableView />
                </div>
              )}
            </div>
            <FilterPanel />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChannelList;
