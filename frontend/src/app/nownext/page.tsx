'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ChevronDown,
  Clock,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Smartphone,
} from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { FilterSection } from '@/components/filter-section';
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from '@/components/layouts/sidebar-layout';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { getCookie } from '@/lib/cookies';

interface Program {
  title: string;
  subtitle: string;
  episode: string | null;
  start: string;
  stop: string;
  desc: string | null;
  category: string[];
  rating: string;
  lengthstring: string;
}

interface Channel {
  nextProgram: any;
  afterNextProgram: any;
  id: string;
  name: {
    clean: string;
    location: string;
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
type ViewMode = 'card' | 'table' | 'mobile';

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
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>('xmlepg_FTASYD');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hideNoProgramData, setHideNoProgramData] = useState(false);
  const [groupFilterSearch, setGroupFilterSearch] = useState('');

  // View states
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const router = useRouter();
  const searchParams = useSearchParams();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDataSource =
        (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel data');
      }
      const data = await response.json();
      const sortedChannels = data.data.sort(
        (a: ChannelData, b: ChannelData) => {
          const aLcn =
            Number.parseInt(a.channel.lcn) || Number.POSITIVE_INFINITY;
          const bLcn =
            Number.parseInt(b.channel.lcn) || Number.POSITIVE_INFINITY;
          if (aLcn === bLcn) {
            return a.channel.name.real.localeCompare(b.channel.name.real);
          }
          return aLcn - bLcn;
        },
      );
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
    const viewModeParameter = searchParams.get('view');
    if (
      viewModeParameter === 'card' ||
      viewModeParameter === 'table' ||
      viewModeParameter === 'mobile'
    ) {
      setViewMode(viewModeParameter as ViewMode);
    } else {
      setViewMode('card'); // Default to card view
    }
  }, [searchParams]);

  useEffect(() => {
    const filtered = channels.filter(
      channelData =>
        (channelData.channel.name.real
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
          channelData.channel.lcn.includes(debouncedSearchTerm)) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channelData.channel.group)) &&
        (!hideNoProgramData || !isChannelGreyedOut(channelData)),
    );
    setFilteredChannels(filtered);
  }, [debouncedSearchTerm, channels, selectedGroups, hideNoProgramData]);

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

  function calculateProgress(start: string, end: string) {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  }

  const uniqueGroups = useMemo(() => {
    return [
      ...new Set(channels.map(channelData => channelData.channel.group)),
    ].sort();
  }, [channels]);

  const handleGroupFilter = (group: string) => {
    setSelectedGroups(previous =>
      previous.includes(group)
        ? previous.filter(g => g !== group)
        : [...previous, group],
    );
  };

  const isChannelGreyedOut = (channelData: ChannelData): boolean => {
    const isProgramInvalid = (program: Program | null): boolean => {
      return (
        !program?.title ||
        program.title === 'N/A' ||
        program.title === 'No Data Available' ||
        program.title.trim() === ''
      );
    };

    return (
      isProgramInvalid(channelData.currentProgram) &&
      isProgramInvalid(channelData.nextProgram)
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGroups([]);
    setHideNoProgramData(false);
  };

  // Calculate counts for filter options
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueGroups.forEach(group => {
      counts[group] = channels.filter(
        channelData =>
          channelData.channel.group === group &&
          (channelData.channel.name.real
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
            channelData.channel.lcn.includes(debouncedSearchTerm)) &&
          (!hideNoProgramData || !isChannelGreyedOut(channelData)),
      ).length;
    });
    return counts;
  }, [channels, uniqueGroups, debouncedSearchTerm, hideNoProgramData]);

  function ProgramDetails({
    program,
    channel,
  }: {
    program: Program | null;
    channel: Channel;
  }) {
    if (!program) return null;

    const now = new Date();
    const startTime = new Date(program.start);
    const endTime = new Date(program.stop);
    let timeDisplay = '';

    if (now < startTime) {
      const minutesUntilStart = Math.floor(
        (startTime.getTime() - now.getTime()) / (1000 * 60),
      );
      if (minutesUntilStart < 60) {
        timeDisplay = `Starts in ${minutesUntilStart} minute${minutesUntilStart === 1 ? '' : 's'}`;
      } else {
        const hours = Math.floor(minutesUntilStart / 60);
        const minutes = minutesUntilStart % 60;
        timeDisplay = `Starts in ${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${
          minutes === 1 ? '' : 's'
        }`;
      }
    } else if (now < endTime) {
      const remainingMinutes = Math.floor(
        (endTime.getTime() - now.getTime()) / (1000 * 60),
      );
      if (remainingMinutes < 60) {
        timeDisplay = `${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} remaining`;
      } else {
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        timeDisplay = `${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
      }
    }

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-xl">{program.title}</h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>
              {formatTime(program.start)} - {formatTime(program.stop)}
            </span>
            {timeDisplay && <span>• {timeDisplay}</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" size="lg">
            Watch Live
          </Button>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>

        <Button variant="secondary" className="w-full" size="sm">
          <Plus className="mr-2 size-4" />
          Add to Up Next
        </Button>

        {program.desc && (
          <div className="space-y-2 bg-muted p-4 rounded-lg text-sm">
            <p>{program.desc}</p>
            {program.category.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {program.category.map((cat, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 px-2 py-0.5 rounded-full text-xs"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
            <p className="text-muted-foreground">
              Rating: <span className="font-medium">{program.rating}</span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Channel Schedule</h4>
          <div className="space-y-2">
            {[program, channel.nextProgram, channel.afterNextProgram]
              .filter(Boolean)
              .map((p, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-muted p-3 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatTime(p.start)} - {formatTime(p.stop)}
                    </p>
                  </div>
                  {index === 0 && <Badge>Now</Badge>}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  function ChannelDetails({ channel }: { channel: Channel }) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{channel.name.real}</h3>
        <p className="text-sm">
          <span className="font-medium">Clean Name:</span> {channel.name.clean}
        </p>
        <p className="text-sm">
          <span className="font-medium">Location:</span> {channel.name.location}
        </p>
        <p className="text-sm">
          <span className="font-medium">LCN:</span> {channel.lcn}
        </p>
        <p className="text-sm">
          <span className="font-medium">Group:</span> {channel.group}
        </p>
      </div>
    );
  }

  const ChannelCard = ({ channelData }: { channelData: ChannelData }) => (
    <Card
      key={`${channelData.channel.id}-${channelData.channel.lcn}`}
      className={`bg-card flex flex-col p-0 ${isChannelGreyedOut(channelData) ? 'bg-muted grayscale' : ''}`}
    >
      <CardHeader className="flex flex-row justify-between items-center px-4 py-1 pb-0">
        {channelData.channel.icon.light !== 'N/A' && (
          <div>
            <img
              className="dark:hidden block h-14 size-auto object-contain"
              src={channelData.channel.icon.light || '/placeholder.svg'}
              alt={decodeHtml(channelData.channel.name.real)}
            />
            <img
              className="hidden dark:block h-14 size-auto object-contain"
              src={channelData.channel.icon.dark || '/placeholder.svg'}
              alt={decodeHtml(channelData.channel.name.real)}
            />
          </div>
        )}
        <div className="text-right">
          <CardTitle className="text-lg">
            {channelData.channel.name.real}
          </CardTitle>
          {channelData.channel.lcn !== 'N/A' && (
            <CardDescription>Channel {channelData.channel.lcn}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-1 grow">
        <div className="text-sm">
          <div className="font-semibold">
            Current Program: {channelData.currentProgram?.title || 'N/A'}
          </div>
          <div className="text-card-foreground/60">
            {channelData.currentProgram
              ? `${formatTime(channelData.currentProgram.start)} - ${formatTime(channelData.currentProgram.stop)}`
              : ''}{' '}
            ({channelData.currentProgram?.lengthstring || 'N/A'})
          </div>
          {channelData.currentProgram && (
            <div className="bg-gray-200 dark:bg-gray-700 mt-1 w-full h-1">
              <div
                className="bg-primary h-1"
                style={{
                  width: `${calculateProgress(channelData.currentProgram.start, channelData.currentProgram.stop)}%`,
                }}
              ></div>
            </div>
          )}
          <div className="mt-2 font-semibold">
            Next Program: {channelData.nextProgram?.title || 'N/A'}
          </div>
          <div className="text-card-foreground/60">
            {channelData.nextProgram
              ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(channelData.nextProgram.stop)}`
              : ''}{' '}
            ({channelData.nextProgram?.lengthstring || 'N/A'})
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-1 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={navigateToNext24Hours}
          >
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
    if (groupBy === 'none') {
      return (
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
          {filteredChannels.map(channelData => (
            <ChannelCard
              key={`${channelData.channel.id}-${channelData.channel.lcn}`}
              channelData={channelData}
            />
          ))}
        </div>
      );
    } else {
      const groupedChannels: { [key: string]: ChannelData[] } = {};
      filteredChannels.forEach(channelData => {
        const groupKey =
          groupBy === 'channel_group' ? channelData.channel.group : 'Unknown';
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
          {sortedGroups.map((group, index) => (
            <div
              key={group}
              className={index === sortedGroups.length - 1 ? 'mb-4' : ''}
            >
              <h2 className="mb-4 font-bold text-2xl">{group}</h2>
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
                {groupedChannels[group].map(channelData => (
                  <ChannelCard
                    key={`${channelData.channel.id}-${channelData.channel.lcn}`}
                    channelData={channelData}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const MobileView = () => (
    <div className="divide-y">
      {filteredChannels.map(channelData => (
        <div
          key={`${channelData.channel.id}-${channelData.channel.lcn}`}
          className="flex items-center gap-3 p-4"
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="p-0 size-12">
                {channelData.channel.icon.light !== 'N/A' && (
                  <img
                    className="dark:hidden block rounded-md size-full object-contain"
                    src={channelData.channel.icon.light || '/placeholder.svg'}
                    alt={channelData.channel.name.real}
                  />
                )}
                {channelData.channel.icon.dark !== 'N/A' && (
                  <img
                    className="hidden dark:block rounded-md size-full object-contain"
                    src={channelData.channel.icon.dark || '/placeholder.svg'}
                    alt={channelData.channel.name.real}
                  />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Channel Information</DialogTitle>
              </DialogHeader>
              <ChannelDetails channel={channelData.channel} />
            </DialogContent>
          </Dialog>
          <div className="flex-1 gap-4 grid grid-cols-2 min-w-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="justify-start p-0 w-full h-auto text-left"
                >
                  <div className="w-full">
                    <div className="font-medium text-muted-foreground text-xs">
                      Now
                    </div>
                    <div
                      className={`truncate text-sm font-medium ${
                        !channelData.currentProgram?.title ||
                        channelData.currentProgram.title === 'No Program Data'
                          ? 'text-muted-foreground'
                          : ''
                      }`}
                    >
                      {channelData.currentProgram?.title || 'No Program Data'}
                    </div>
                    {channelData.currentProgram && (
                      <div className="text-muted-foreground text-xs">
                        {formatTime(channelData.currentProgram.start)} -{' '}
                        {formatTime(channelData.currentProgram.stop)} (
                        {channelData.currentProgram.lengthstring})
                      </div>
                    )}
                    {channelData.currentProgram && (
                      <div className="bg-gray-200 dark:bg-gray-700 mt-1 w-full h-1">
                        <div
                          className="bg-primary h-1"
                          style={{
                            width: `${calculateProgress(
                              channelData.currentProgram.start,
                              channelData.currentProgram.stop,
                            )}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {channelData.channel.name.real} - Now
                  </DialogTitle>
                </DialogHeader>
                <ProgramDetails
                  program={channelData.currentProgram}
                  channel={channelData.channel}
                />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="justify-start p-0 w-full h-auto text-left"
                >
                  <div className="w-full">
                    <div className="font-medium text-muted-foreground text-xs">
                      Next
                    </div>
                    <div
                      className={`truncate text-sm font-medium ${
                        !channelData.nextProgram?.title ||
                        channelData.nextProgram.title === 'No Program Data'
                          ? 'text-muted-foreground'
                          : ''
                      }`}
                    >
                      {channelData.nextProgram?.title || 'No Program Data'}
                    </div>
                    {channelData.nextProgram && (
                      <div className="text-muted-foreground text-xs">
                        {formatTime(channelData.nextProgram.start)} -{' '}
                        {formatTime(channelData.nextProgram.stop)} (
                        {channelData.nextProgram.lengthstring})
                      </div>
                    )}
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {channelData.channel.name.real} - Next
                  </DialogTitle>
                </DialogHeader>
                <ProgramDetails
                  program={channelData.nextProgram}
                  channel={channelData.channel}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );

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
          {filteredChannels.map(channelData => (
            <TableRow
              key={`${channelData.channel.id}-${channelData.channel.lcn}`}
              className={isChannelGreyedOut(channelData) ? 'opacity-50' : ''}
            >
              <TableCell>
                <div className="flex items-center space-x-2">
                  {channelData.channel.icon.light !== 'N/A' && (
                    <img
                      className="size-8 object-contain"
                      src={channelData.channel.icon.light || '/placeholder.svg'}
                      alt={decodeHtml(channelData.channel.name.real)}
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {channelData.channel.name.real}
                    </p>
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
                        channelData.currentProgram.stop,
                      )} (${channelData.currentProgram.lengthstring})`
                    : ''}
                </p>
                {channelData.currentProgram && (
                  <div className="bg-gray-200 dark:bg-gray-700 mt-1 w-full h-1">
                    <div
                      className="bg-primary h-1"
                      style={{
                        width: `${calculateProgress(channelData.currentProgram.start, channelData.currentProgram.stop)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <p>{channelData.nextProgram?.title || 'N/A'}</p>
                <p className="text-muted-foreground text-sm">
                  {channelData.nextProgram
                    ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(
                        channelData.nextProgram.stop,
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
      <div className="flex justify-center items-center h-full">
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

  // Create the sidebar content using the template structure
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search channels..."
        />
      </SidebarHeader>
      <SidebarContent>
        {/* Options section */}
        <FilterSection
          title="Options"
          options={['Hide channels with no programs']}
          filters={hideNoProgramData ? ['Hide channels with no programs'] : []}
          onFilterChange={() => setHideNoProgramData(!hideNoProgramData)}
          counts={{ 'Hide channels with no programs': channels.length }}
          showSearch={false}
          searchValue=""
          onSearchChange={() => {}}
        />

        {/* Channel Groups section */}
        <FilterSection
          title="Channel Groups"
          options={uniqueGroups}
          filters={selectedGroups}
          onFilterChange={handleGroupFilter}
          counts={groupCounts}
          showSearch={true}
          searchValue={groupFilterSearch}
          onSearchChange={setGroupFilterSearch}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-xs"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredChannels.length} of {channels.length} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // View controls for the header actions
  const viewControls = (
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
          <DropdownMenuItem onSelect={() => setGroupBy('none')}>
            No Grouping
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setGroupBy('channel_group')}>
            Group by Channel Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-start">
            {viewMode === 'card' ? (
              <LayoutGrid className="mr-2 size-4" />
            ) : viewMode === 'table' ? (
              <List className="mr-2 size-4" />
            ) : (
              <Smartphone className="mr-2 size-4" />
            )}
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setViewMode('card')}>
            <LayoutGrid className="mr-2 size-4" />
            Card
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('table')}>
            <List className="mr-2 size-4" />
            Table
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewMode('mobile')}>
            <Smartphone className="mr-2 size-4" />
            Mobile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={handleRefresh} variant="outline" size="icon">
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );

  return (
    <SidebarLayout
      sidebar={sidebar}
      title="Now and Next"
      actions={viewControls}
      contentClassName="overflow-auto"
    >
      <div className="p-4 pb-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
          </div>
        ) : viewMode === 'card' ? (
          <>
            <CardView />
            <div className="h-24" aria-hidden="true"></div>{' '}
            {/* Spacer element */}
          </>
        ) : viewMode === 'table' ? (
          <TableView />
        ) : (
          <MobileView />
        )}
      </div>
    </SidebarLayout>
  );
}

export default function NowNextPage() {
  return (
    <main className="h-full overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <ChannelGrid />
      </Suspense>
    </main>
  );
}
