'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Clock,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { getCookie } from '@/lib/cookies';

interface Program {
  title: string;
  start: string;
  stop: string;
  desc: string | null;
  category: string[];
  rating: string;
  lengthstring: string;
}

interface Channel {
  id: string;
  name: {
    real: string;
  };
  icon: {
    light: string;
    dark: string;
  };
  slug: string;
  lcn: string;
  group: string;
}

interface ChannelData {
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  afterNextProgram: Program | null;
}

type GroupBy = 'none' | 'channel_group' | 'channel_type';
type ViewMode = 'card' | 'table';

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

function ChannelGrid() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmlepg_FTASYD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hideNoProgramData, setHideNoProgramData] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDataSource = (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel data');
      }
      const data = await response.json();
      const sortedChannels = data.data.sort((a: ChannelData, b: ChannelData) => {
        const aLcn = Number.parseInt(a.channel.lcn) || Infinity;
        const bLcn = Number.parseInt(b.channel.lcn) || Infinity;
        if (aLcn === bLcn) {
          return a.channel.name.real.localeCompare(b.channel.name.real);
        }
        return aLcn - bLcn;
      });
      setChannels(sortedChannels);
      setFilteredChannels(sortedChannels);
      setIsLoading(false);
    } catch (error_) {
      console.error('Error fetching channel data:', error_);
      setError('Error fetching channel data. Please try again later.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    const viewModeParam = searchParams.get('view');
    if (viewModeParam === 'card' || viewModeParam === 'table') {
      setViewMode(viewModeParam);
    } else {
      setViewMode('card'); // Default to card view
    }
  }, [searchParams]);

  useEffect(() => {
    const filtered = channels.filter(
      (channelData) =>
        (channelData.channel.name.real.toLowerCase().includes(searchTerm.toLowerCase()) ||
          channelData.channel.lcn.includes(searchTerm)) &&
        (selectedGroups.length === 0 || selectedGroups.includes(channelData.channel.group)) &&
        (!hideNoProgramData || !isChannelGreyedOut(channelData))
    );
    setFilteredChannels(filtered);
  }, [searchTerm, channels, selectedGroups, hideNoProgramData]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleRefresh = () => {
    fetchChannels();
  };

  const navigateToNext24Hours = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replaceAll('-', '');
    router.push(`/epg/${formattedDate}`);
  };

  const navigateToFullWeek = (channelSlug: string) => {
    router.push(`/channel/${channelSlug}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const uniqueGroups = Array.from(
    new Set(channels.map((channelData) => channelData.channel.group))
  ).sort();

  const handleGroupFilter = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const isChannelGreyedOut = (channelData: ChannelData) => {
    return (
      !channelData.currentProgram?.title ||
      channelData.currentProgram.title === 'N/A' ||
      channelData.currentProgram.title === 'No Data Available' ||
      channelData.currentProgram.title.trim() === '' ||
      !channelData.nextProgram?.title ||
      channelData.nextProgram.title === 'N/A' ||
      channelData.nextProgram.title === 'No Data Available' ||
      channelData.nextProgram.title.trim() === ''
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGroups([]);
    setHideNoProgramData(false);
  };

  const toggleViewMode = () => {
    const newViewMode = viewMode === 'card' ? 'table' : 'card';
    setViewMode(newViewMode);
    router.push(`/nownext?view=${newViewMode}`);
  };

  const FilterMenu = () => (
    <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <FilterIcon className="mr-2 size-4" />
          Filters
          {(selectedGroups.length > 0 || hideNoProgramData) && (
            <Badge variant="secondary" className="ml-2">
              {selectedGroups.length + (hideNoProgramData ? 1 : 0)}
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
                    id="hide-no-program-data"
                    checked={hideNoProgramData}
                    onCheckedChange={(checked) => setHideNoProgramData(checked as boolean)}
                  />
                  <Label htmlFor="hide-no-program-data">Hide No Program Data</Label>
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

  const ChannelCard = ({ channelData }: { channelData: ChannelData }) => (
    <Card
      key={channelData.channel.id}
      className={`bg-card flex flex-col ${isChannelGreyedOut(channelData) ? 'bg-muted grayscale' : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between px-4 py-2">
        {channelData.channel.icon.light !== 'N/A' && (
          <div>
            <img
              className="block size-auto h-16 object-contain dark:hidden"
              src={channelData.channel.icon.light}
              alt={decodeHtml(channelData.channel.name.real)}
            />
            <img
              className="hidden size-auto h-16 object-contain dark:block"
              src={channelData.channel.icon.dark}
              alt={decodeHtml(channelData.channel.name.real)}
            />
          </div>
        )}
        <div className="text-right">
          <CardTitle className="text-lg">{channelData.channel.name.real}</CardTitle>
          {channelData.channel.lcn !== 'N/A' && (
            <CardDescription>Channel {channelData.channel.lcn}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="grow p-4">
        <div className="text-sm">
          <p className="font-semibold">
            Current Program: {channelData.currentProgram?.title || 'N/A'}
          </p>
          <p className="text-card-foreground/60">
            {channelData.currentProgram
              ? `${formatTime(channelData.currentProgram.start)} - ${formatTime(
                  channelData.currentProgram.stop
                )}`
              : ''}{' '}
            ({channelData.currentProgram?.lengthstring})
          </p>
          <p className="mt-2 font-semibold">
            Next Program: {channelData.nextProgram?.title || 'N/A'}
          </p>
          <p className="text-card-foreground/60">
            {channelData.nextProgram
              ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(
                  channelData.nextProgram.stop
                )}`
              : ''}{' '}
            ({channelData.nextProgram?.lengthstring})
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <div className="flex w-full gap-2">
          <Button variant="secondary" className="flex-1" onClick={navigateToNext24Hours}>
            <Clock className="mr-2 size-4" />
            Next 24hrs
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigateToFullWeek(channelData.channel.slug)}
          >
            <Clock className="mr-2 size-4" />
            Full Week
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const CardView = () => {
    if (groupBy !== 'none') {
      const groupedChannels: { [key: string]: ChannelData[] } = {};
      filteredChannels.forEach((channelData) => {
        const groupKey = groupBy === 'channel_group' ? channelData.channel.group : 'Unknown';
        if (groupKey !== 'N/A') {
          if (!groupedChannels[groupKey]) {
            groupedChannels[groupKey] = [];
          }

          groupedChannels[groupKey].push(channelData);
        }
      });

      const sortedGroups = Object.keys(groupedChannels).sort();

      return (
        <div className="space-y-8">
          {sortedGroups.map((group) => (
            <div key={group}>
              <h2 className="mb-4 text-2xl font-bold">{group}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
                {groupedChannels[group].map((channelData) => (
                  <ChannelCard key={channelData.channel.id} channelData={channelData} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
          {filteredChannels.map((channelData) => (
            <ChannelCard key={channelData.channel.id} channelData={channelData} />
          ))}
        </div>
      );
    }
  };

  const TableView = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Current Program</TableHead>
            <TableHead>Next Program</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChannels.map((channelData) => (
            <TableRow
              key={channelData.channel.id}
              className={isChannelGreyedOut(channelData) ? 'opacity-50' : ''}
            >
              <TableCell>
                <div className="flex items-center space-x-2">
                  {channelData.channel.icon.light !== 'N/A' && (
                    <img
                      className="size-8 object-contain"
                      src={channelData.channel.icon.light}
                      alt={decodeHtml(channelData.channel.name.real)}
                    />
                  )}
                  <div>
                    <p className="font-medium">{channelData.channel.name.real}</p>
                    {channelData.channel.lcn !== 'N/A' && (
                      <p className="text-muted-foreground text-sm">
                        Channel {channelData.channel.lcn}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p>{channelData.currentProgram?.title || 'N/A'}</p>
                <p className="text-muted-foreground text-sm">
                  {channelData.currentProgram
                    ? `${formatTime(channelData.currentProgram.start)} - ${formatTime(
                        channelData.currentProgram.stop
                      )} (${channelData.currentProgram.lengthstring})`
                    : ''}
                </p>
              </TableCell>
              <TableCell>
                <p>{channelData.nextProgram?.title || 'N/A'}</p>
                <p className="text-muted-foreground text-sm">
                  {channelData.nextProgram
                    ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(
                        channelData.nextProgram.stop
                      )} (${channelData.nextProgram.lengthstring})`
                    : ''}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="secondary" onClick={navigateToNext24Hours}>
                    <Clock className="mr-2 size-4" />
                    Next 24hrs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigateToFullWeek(channelData.channel.slug)}
                  >
                    <Clock className="mr-2 size-4" />
                    Full Week
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

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
        <h1 className="text-xl font-bold">Now and Next</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="sm:w-auto">
                {groupBy === 'none'
                  ? 'Group By'
                  : `Grouped by ${groupBy === 'channel_group' ? 'Channel Group' : 'Channel Type'}`}
                <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setGroupBy('none')}>No Grouping</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setGroupBy('channel_group')}>
                Group by Channel Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="size-4" />
          </Button>
          <Button
            onClick={toggleViewMode}
            variant="outline"
            aria-label={`Switch to ${viewMode === 'card' ? 'table' : 'card'} view`}
          >
            {viewMode === 'card' ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
          </Button>
          <FilterMenu />
        </div>
      </div>
      <ScrollArea className="grow">
        <div className="w-full p-4">
          {isLoading ? (
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

export default function NowNextPage() {
  return (
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <ChannelGrid />
      </Suspense>
    </main>
  );
}
