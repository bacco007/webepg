'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutGrid,
  List,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // ADDED
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

function FilterSection({
  title,
  options,
  filters,
  onFilterChange,
  counts,
}: {
  title: string;
  options: string[];
  filters: string[];
  onFilterChange: (value: string) => void;
  counts: Record<string, number>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter options to only include those with counts > 0 or those already selected
  const availableOptions = useMemo(() => {
    return options.filter(
      option =>
        filters.includes(option) || // Always show selected options
        counts[option] > 0, // Only show options with counts > 0
    );
  }, [options, counts, filters]);

  // Calculate total available options for display
  const totalAvailableOptions = useMemo(() => {
    return options.filter(
      option => counts[option] > 0 || filters.includes(option),
    ).length;
  }, [options, counts, filters]);

  return (
    <div className="border-b">
      <div
        className="hover:bg-muted/10 flex w-full cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {totalAvailableOptions}
          </span>
          {isOpen ? (
            <ChevronUp className="text-muted-foreground size-4" />
          ) : (
            <ChevronDown className="text-muted-foreground size-4" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="thin-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-1">
            {availableOptions.length > 0 ? (
              availableOptions.map(option => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center justify-between py-1"
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={filters.includes(option)}
                      onCheckedChange={() => onFilterChange(option)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {counts[option]}
                  </span>
                </label>
              ))
            ) : (
              <div className="text-muted-foreground py-2 text-center text-sm">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelGrid() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>('xmlepg_FTASYD');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [hideNoProgramData, setHideNoProgramData] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false); // ADDED

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
          .includes(searchTerm.toLowerCase()) ||
          channelData.channel.lcn.includes(searchTerm)) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channelData.channel.group)) &&
        (!hideNoProgramData || !isChannelGreyedOut(channelData)),
    );
    setFilteredChannels(filtered);
  }, [searchTerm, channels, selectedGroups, hideNoProgramData]);

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
            .includes(searchTerm.toLowerCase()) ||
            channelData.channel.lcn.includes(searchTerm)) &&
          (!hideNoProgramData || !isChannelGreyedOut(channelData)),
      ).length;
    });
    return counts;
  }, [channels, uniqueGroups, searchTerm, hideNoProgramData]);

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
          <h3 className="text-xl font-semibold">{program.title}</h3>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
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
          <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
            <p>{program.desc}</p>
            {program.category.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {program.category.map((cat, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 rounded-full px-2 py-0.5 text-xs"
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
                  className="bg-muted flex items-center justify-between rounded-lg p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.title}</p>
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
        <h3 className="text-lg font-semibold">{channel.name.real}</h3>
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
      <CardHeader className="flex flex-row items-center justify-between px-4 py-1 pb-0">
        {channelData.channel.icon.light !== 'N/A' && (
          <div>
            <img
              className="block size-auto h-14 object-contain dark:hidden"
              src={channelData.channel.icon.light || '/placeholder.svg'}
              alt={decodeHtml(channelData.channel.name.real)}
            />
            <img
              className="hidden size-auto h-14 object-contain dark:block"
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
      <CardContent className="grow px-4 py-1">
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
            <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700">
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
        <div className="flex w-full gap-2">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
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
          {sortedGroups.map(group => (
            <div key={group}>
              <h2 className="mb-4 text-2xl font-bold">{group}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
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
              <Button variant="ghost" className="size-12 p-0">
                {channelData.channel.icon.light !== 'N/A' && (
                  <img
                    className="block size-full rounded-md object-contain dark:hidden"
                    src={channelData.channel.icon.light || '/placeholder.svg'}
                    alt={channelData.channel.name.real}
                  />
                )}
                {channelData.channel.icon.dark !== 'N/A' && (
                  <img
                    className="hidden size-full rounded-md object-contain dark:block"
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
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start p-0 text-left"
                >
                  <div className="w-full">
                    <div className="text-muted-foreground text-xs font-medium">
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
                      <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700">
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
                  className="h-auto w-full justify-start p-0 text-left"
                >
                  <div className="w-full">
                    <div className="text-muted-foreground text-xs font-medium">
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
                  <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700">
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
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Main header */}
      <div className="bg-background w-full border-b p-4">
        <h1 className="text-xl font-bold">Now and Next</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar - hidden on small screens */}
        <div className="bg-background hidden w-64 shrink-0 flex-col overflow-hidden border-r lg:flex">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
                aria-label="Search channels"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-7 w-7 p-0"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="thin-scrollbar h-full">
              {/* Options section */}
              <div className="border-b">
                <div className="hover:bg-muted/10 flex w-full cursor-pointer items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Options</span>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <label className="flex cursor-pointer items-center py-1">
                    <div className="flex items-center">
                      <Checkbox
                        id="hide-no-programs"
                        checked={hideNoProgramData}
                        onCheckedChange={checked =>
                          setHideNoProgramData(checked as boolean)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">
                        Hide channels with no programs
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <FilterSection
                title="Channel Groups"
                options={uniqueGroups}
                filters={selectedGroups}
                onFilterChange={handleGroupFilter}
                counts={groupCounts}
              />
            </ScrollArea>
          </div>

          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full text-xs"
            >
              Clear All Filters
            </Button>
            <div className="text-muted-foreground mt-2 text-center text-xs">
              Showing {filteredChannels.length} of {channels.length} channels
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Content header with view controls */}
          <div className="bg-background flex items-center justify-between border-b p-2">
            <div className="flex items-center space-x-2">
              {/* Mobile sidebar trigger - only visible on small screens */}
              <div className="lg:hidden">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle sidebar</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    {/* Mobile sidebar content */}
                    <div className="flex h-full flex-col overflow-hidden">
                      <div className="border-b p-3">
                        <div className="relative">
                          <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
                          <Input
                            placeholder="Search channels..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-8 text-sm"
                            aria-label="Search channels"
                          />
                          {searchTerm && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 h-7 w-7 p-0"
                              onClick={() => setSearchTerm('')}
                              aria-label="Clear search"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <ScrollArea className="thin-scrollbar h-full">
                          {/* Options section */}
                          <div className="border-b">
                            <div className="hover:bg-muted/10 flex w-full cursor-pointer items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  Options
                                </span>
                              </div>
                            </div>
                            <div className="px-4 pb-3">
                              <label className="flex cursor-pointer items-center py-1">
                                <div className="flex items-center">
                                  <Checkbox
                                    id="hide-no-programs-mobile"
                                    checked={hideNoProgramData}
                                    onCheckedChange={checked =>
                                      setHideNoProgramData(checked as boolean)
                                    }
                                    className="mr-2"
                                  />
                                  <span className="text-sm">
                                    Hide channels with no programs
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <FilterSection
                            title="Channel Groups"
                            options={uniqueGroups}
                            filters={selectedGroups}
                            onFilterChange={handleGroupFilter}
                            counts={groupCounts}
                          />
                        </ScrollArea>
                      </div>

                      <div className="border-t p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="w-full text-xs"
                        >
                          Clear All Filters
                        </Button>
                        <div className="text-muted-foreground mt-2 text-center text-xs">
                          Showing {filteredChannels.length} of {channels.length}{' '}
                          channels
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
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
                  <DropdownMenuItem
                    onSelect={() => setGroupBy('channel_group')}
                  >
                    Group by Channel Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center space-x-2">
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

              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          {/* Content area - scrollable */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : viewMode === 'card' ? (
                <CardView />
              ) : viewMode === 'table' ? (
                <TableView />
              ) : (
                <MobileView />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NowNextPage() {
  return (
    <main className="h-[calc(100vh-4rem)] overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <ChannelGrid />
      </Suspense>
    </main>
  );
}
