'use client';

import 'leaflet/dist/leaflet.css';

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
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCookie } from '@/lib/cookies';
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from '@/components/layouts/sidebar-layout';
import { ErrorAlert, withErrorHandling, APIError } from '@/lib/error-handling';
import { Component } from 'react';

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
    if (dataSource) {
      fetchSportsData();
    }
  }, [dataSource, days]);

  const fetchSportsData = async () => {
    setIsLoading(true);
    setError(null);
    setNoSportsData(false);
    try {
      const storedDataSource = await getCookie('xmltvdatasource');
      if (!storedDataSource) {
        throw new Error('No data source selected');
      }
      setDataSource(storedDataSource);

      const response = await fetch(
        `/api/py/epg/sports/${storedDataSource}?days=${days}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch sports data');
      }

      const data: SportsData = await response.json();
      if (!data.channels || data.channels.length === 0) {
        setNoSportsData(true);
      } else {
        setSportsData(data);
      }
    } catch (error) {
      console.error('Error fetching sports data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch sports data',
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  // Calculate counts for filter options
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (!sportsData) return counts;

    uniqueGroups.forEach(group => {
      counts[group] = sportsData.channels.filter(
        ch =>
          ch.channel.group === group &&
          ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedCategories.length === 0 ||
            Object.values(ch.programs).some(programsArray =>
              programsArray.some(program =>
                program.categories.some(category =>
                  selectedCategories.includes(category),
                ),
              ),
            )),
      ).length;
    });

    return counts;
  }, [sportsData, uniqueGroups, filterText, selectedCategories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (!sportsData) return counts;

    uniqueCategories.forEach(category => {
      counts[category] = sportsData.channels.filter(
        ch =>
          ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedGroups.length === 0 ||
            selectedGroups.includes(ch.channel.group)) &&
          Object.values(ch.programs).some(programsArray =>
            programsArray.some(program =>
              program.categories.includes(category),
            ),
          ),
      ).length;
    });

    return counts;
  }, [sportsData, uniqueCategories, filterText, selectedGroups]);

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

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 lg:hidden">
            <FilterIcon className="h-4 w-4" />
            <span>Filters</span>
            {(selectedGroups.length > 0 || selectedCategories.length > 0) && (
              <Badge variant="secondary" className="ml-1">
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

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          value={filterText}
          onChange={setFilterText}
          placeholder="Search channels..."
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          title="Channel Groups"
          options={uniqueGroups}
          filters={selectedGroups}
          onFilterChange={handleGroupFilter}
          counts={groupCounts}
        />
        <FilterSection
          title="Categories"
          options={uniqueCategories}
          filters={selectedCategories}
          onFilterChange={handleCategoryFilter}
          counts={categoryCounts}
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
        <div className="text-muted-foreground mt-2 text-center text-xs">
          Showing {filteredAndSortedChannels.length} of{' '}
          {sportsData?.channels.length || 0} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
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
      <div className="h-full">
        <ErrorAlert message={error} onRetry={fetchSportsData} />
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
    <SidebarLayout
      title="Upcoming Sports Programming"
      sidebar={sidebar}
      actions={headerActions}
      contentClassName="overflow-auto"
    >
      <div className="p-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedChannels.map(channelData => (
            <div
              key={channelData.channel.slug}
              className="bg-card flex h-full flex-col rounded-md border shadow-sm"
            >
              {/* Channel header */}
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

              {/* Programs content - fixed height with scrolling */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-[250px]">
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
                </ScrollArea>
              </div>

              {/* Card footer */}
              <div className="mt-auto flex border-t px-2 py-2">
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
        <div className="h-24" aria-hidden="true"></div> {/* Spacer element */}
      </div>
    </SidebarLayout>
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

function ChevronUp({ className }: { className?: string }) {
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
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
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
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Create an error boundary component
class ErrorBoundaryComponent extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="size-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An error occurred while rendering the sports view. Please try
              refreshing the page.
            </AlertDescription>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="mr-2 size-4" />
              Refresh Page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SportsPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ErrorBoundaryComponent>
        <Suspense fallback={<LoadingSpinner />}>
          <SportsPageContent />
        </Suspense>
      </ErrorBoundaryComponent>
    </div>
  );
}
