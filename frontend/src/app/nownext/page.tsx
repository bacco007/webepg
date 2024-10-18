'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const ChannelGrid: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmlepg_FTASYD');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hideNoProgramData, setHideNoProgramData] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const router = useRouter();

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmlepg_FTASYD';
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
    const filtered = channels.filter(
      (channelData) =>
        (channelData.channel.name.real.toLowerCase().includes(searchTerm.toLowerCase()) ||
          channelData.channel.lcn.includes(searchTerm)) &&
        (selectedGroups.length === 0 || selectedGroups.includes(channelData.channel.group)) &&
        (!hideNoProgramData ||
          (channelData.currentProgram?.title &&
            channelData.currentProgram.title !== 'N/A' &&
            channelData.currentProgram.title !== 'No Data Available' &&
            channelData.currentProgram.title.trim() !== '' &&
            channelData.nextProgram?.title &&
            channelData.nextProgram.title !== 'N/A' &&
            channelData.nextProgram.title !== 'No Data Available' &&
            channelData.nextProgram.title.trim() !== ''))
    );
    setFilteredChannels(filtered);
  }, [searchTerm, channels, selectedGroups, hideNoProgramData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
      <div className="mb-4">
        <div className="flex items-center">
          <Checkbox
            id="hide-no-program-data"
            checked={hideNoProgramData}
            onCheckedChange={(checked) => setHideNoProgramData(checked as boolean)}
          />
          <Label htmlFor="hide-no-program-data" className="ml-2 text-sm">
            Hide No Program Data
          </Label>
        </div>
      </div>
      <h3 className="mb-2 text-sm font-medium">Filter by Group</h3>
      <ScrollArea className="h-[calc(100vh-300px)]">
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
      </ScrollArea>
    </div>
  );

  const ChannelCard = ({ channelData }: { channelData: ChannelData }) => (
    <Card key={channelData.channel.id} className="bg-card flex flex-col">
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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-500" />
          <p className="mb-4 text-xl text-red-500">{error}</p>
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
      <header className="bg-background sticky top-0 z-10 w-full border-b p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-2xl font-bold">Now and Next</h1>
          <div className="flex items-center space-x-2">
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
      <div className="flex grow">
        <main className="w-full grow overflow-auto">
          <div className="max-w-full p-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <CardView />
            )}
          </div>
        </main>
        <FilterPanel />
      </div>
    </div>
  );
};

export default ChannelGrid;
