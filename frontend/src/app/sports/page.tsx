'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertCircle,
  CalendarIcon,
  Clock,
  FilterIcon,
  RefreshCw,
  X,
} from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
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
import { getCookie } from '@/lib/cookies';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Channel {
  id: string;
  name: string;
  icon: {
    light: string;
    dark: string;
  };
  slug: string;
  lcn: string;
  group: string;
}

interface Program {
  title: string;
  start: string;
  end: string;
  description: string;
  categories: string[];
  subtitle: string;
  episode: string;
  original_air_date: string;
  rating: string;
}

interface ChannelPrograms {
  channel: Channel;
  programs: {
    [date: string]: Program[];
  };
}

interface SportsData {
  date_pulled: string;
  query: string;
  source: string;
  start_date: string;
  end_date: string;
  timezone: string;
  channels: ChannelPrograms[];
}

const sortChannels = (channels: ChannelPrograms[]) => {
  return channels.sort((a, b) => {
    const lcnA = Number.parseInt(a.channel.lcn) || Number.POSITIVE_INFINITY;
    const lcnB = Number.parseInt(b.channel.lcn) || Number.POSITIVE_INFINITY;
    if (lcnA !== lcnB) {
      return lcnA - lcnB;
    }
    return a.channel.name.localeCompare(b.channel.name);
  });
};

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

function SportsPageContent() {
  const [sportsData, setSportsData] = useState<SportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSportsData, setNoSportsData] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const searchParameters = useSearchParams();
  const days = searchParameters.get('days') || '7';

  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      const storedDataSource = await getCookie('xmltvdatasource');
      const storedTimezone = await getCookie('userTimezone');

      setDataSource(storedDataSource || 'xmlepg_FTASYD');
      setUserTimezone(storedTimezone || dayjs.tz.guess());
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchSportsData = async () => {
      if (!dataSource || !userTimezone) return;

      setIsLoading(true);
      setError(null);
      setNoSportsData(false);
      try {
        const response = await fetch(
          `/api/py/epg/sports/${dataSource}?days=${days}&timezone=${encodeURIComponent(userTimezone)}`,
        );
        if (response.ok) {
          const data: SportsData = await response.json();
          setSportsData(data);
        } else {
          const errorData = await response.json();
          if (
            errorData.detail ===
            'No sports programming found for the next 7 days'
          ) {
            setNoSportsData(true);
          } else {
            throw new Error(errorData.detail || 'Failed to fetch sports data');
          }
        }
      } catch (error_) {
        setError(
          error_ instanceof Error
            ? error_.message
            : 'An unknown error occurred',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSportsData();
  }, [days, dataSource, userTimezone]);

  const navigateToNext24Hours = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replaceAll('-', '');
    router.push(`/epg/${formattedDate}`);
  };

  const navigateToFullWeek = (channelSlug: string) => {
    router.push(`/channel/${channelSlug}`);
  };

  const filteredAndSortedChannels = useMemo(() => {
    if (!sportsData) return [];
    const filtered = sportsData.channels.filter(
      ch =>
        ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(ch.channel.group)) &&
        (selectedCategories.length === 0 ||
          Object.values(ch.programs).some(programsArray =>
            programsArray.some(program =>
              program.categories.some(category =>
                selectedCategories.includes(category),
              ),
            ),
          )),
    );
    return sortChannels(filtered);
  }, [sportsData, filterText, selectedGroups, selectedCategories]);

  const uniqueGroups = useMemo(() => {
    if (!sportsData) return [];
    return [...new Set(sportsData.channels.map(ch => ch.channel.group))].sort();
  }, [sportsData]);

  const uniqueCategories = useMemo(() => {
    if (!sportsData) return [];
    const categories = new Set<string>();
    sportsData.channels.forEach(ch => {
      Object.values(ch.programs).forEach(programs => {
        programs.forEach(program => {
          program.categories.forEach(category => categories.add(category));
        });
      });
    });
    return [...categories].sort();
  }, [sportsData]);

  const handleGroupFilter = (group: string) => {
    setSelectedGroups(previous =>
      previous.includes(group)
        ? previous.filter(g => g !== group)
        : [...previous, group],
    );
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories(previous =>
      previous.includes(category)
        ? previous.filter(c => c !== category)
        : [...previous, category],
    );
  };

  const clearFilters = useCallback(() => {
    setFilterText('');
    setSelectedGroups([]);
    setSelectedCategories([]);
  }, []);

  const FilterMenu = () => (
    <div className="">
      <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="ml-auto">
            <FilterIcon className="mr-2 size-4" />
            Filters
            {(selectedGroups.length > 0 || selectedCategories.length > 0) && (
              <Badge variant="secondary" className="ml-2">
                {selectedGroups.length + selectedCategories.length}
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
                  {uniqueGroups.map(group => (
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
              <CommandGroup heading="Categories">
                <ScrollArea className="h-[200px]">
                  {uniqueCategories.map(category => (
                    <CommandItem
                      key={category}
                      onSelect={() => handleCategoryFilter(category)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryFilter(category)}
                        />
                        <Label htmlFor={`category-${category}`}>
                          {category}
                        </Label>
                      </div>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
            <div className="border-t p-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                <X className="mr-2 size-4" />
                Clear Filters
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
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
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (noSportsData) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Alert className="mb-4 max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>No Sports Programming</AlertTitle>
          <AlertDescription>
            No sports programming found for the next {days} days. <br />
            Try adjusting your search parameters or check back later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>
    );
  }

  if (!sportsData || filteredAndSortedChannels.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Alert className="mb-4 max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No channels match your current filter. <br />
            Try adjusting your search or clear the filter.
          </AlertDescription>
        </Alert>
        <Button onClick={clearFilters} aria-label="Clear All Filters">
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold">Upcoming Sports Programming</h1>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search channels..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-[200px]"
          />
          <FilterMenu />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="w-full p-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedChannels.map(channelData => (
              <div
                key={channelData.channel.slug}
                className="bg-card rounded-md border shadow-sm"
              >
                {/* Custom header with minimal padding */}
                <div className="flex items-center justify-between border-b px-3 py-2">
                  {channelData.channel.icon &&
                    channelData.channel.icon.light !== 'N/A' && (
                      <div className="flex h-8 items-center">
                        <img
                          className="block max-h-full max-w-[60px] object-contain dark:hidden"
                          src={
                            channelData.channel.icon.light || '/placeholder.svg'
                          }
                          alt={decodeHtml(channelData.channel.name)}
                        />
                        <img
                          className="hidden max-h-full max-w-[60px] object-contain dark:block"
                          src={
                            channelData.channel.icon.dark || '/placeholder.svg'
                          }
                          alt={decodeHtml(channelData.channel.name)}
                        />
                      </div>
                    )}
                  <div className="ml-auto text-right">
                    <div className="text-base font-medium">
                      {decodeHtml(channelData.channel.name)}
                    </div>
                    {channelData.channel.lcn !== 'N/A' && (
                      <div className="text-muted-foreground text-xs">
                        Channel {channelData.channel.lcn}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom content with no padding */}
                <div className="max-h-[250px] overflow-auto">
                  <div className="w-full">
                    {Object.entries(channelData.programs).map(
                      ([date, programs]) => (
                        <div key={date} className="border-b last:border-b-0">
                          <button
                            className="hover:bg-muted/50 flex w-full items-center justify-between px-3 py-1 text-left text-sm font-medium"
                            onClick={e => {
                              const content =
                                e.currentTarget.nextElementSibling;
                              if (content) {
                                content.classList.toggle('hidden');
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 size-4" />
                              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                            </div>
                            <ChevronIcon className="size-4" />
                          </button>
                          <div className="hidden overflow-x-auto">
                            <table className="w-full min-w-full table-auto border-collapse text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="w-[100px] px-3 py-1 text-left font-medium">
                                    Time
                                  </th>
                                  <th className="px-3 py-1 text-left font-medium">
                                    Title
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {programs.map((program, index) => (
                                  <tr
                                    key={index}
                                    className="border-muted/20 border-b last:border-b-0"
                                  >
                                    <td className="px-3 py-1 text-xs">
                                      {format(
                                        new Date(program.start),
                                        'h:mm a',
                                      )}{' '}
                                      -{' '}
                                      {format(new Date(program.end), 'h:mm a')}
                                    </td>
                                    <td className="px-3 py-1">
                                      <div className="font-medium">
                                        {program.title}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {program.description}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Custom footer with minimal padding */}
                <div className="flex border-t px-2 py-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mr-2 flex-1"
                    onClick={navigateToNext24Hours}
                  >
                    <Clock className="mr-1 size-3" />
                    Next 24hrs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigateToFullWeek(channelData.channel.slug)}
                  >
                    <CalendarIcon className="mr-1 size-3" />
                    Full Week
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple chevron icon component that toggles between up and down
function ChevronIcon({ className }: { className?: string }) {
  const [isUp, setIsUp] = useState(false);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      onClick={() => setIsUp(!isUp)}
    >
      {isUp ? (
        <polyline points="18 15 12 9 6 15"></polyline>
      ) : (
        <polyline points="6 9 12 15 18 9"></polyline>
      )}
    </svg>
  );
}

export default function SportsPage() {
  return (
    <main className="h-[calc(100vh-4rem)] overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <SportsPageContent />
      </Suspense>
    </main>
  );
}
