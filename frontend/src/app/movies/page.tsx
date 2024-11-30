'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, CalendarIcon, Clock, FilterIcon, RefreshCw, X } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

interface MoviesData {
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
    const lcnA = Number.parseInt(a.channel.lcn) || Infinity;
    const lcnB = Number.parseInt(b.channel.lcn) || Infinity;
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

function MoviesPageContent() {
  const [moviesData, setMoviesData] = useState<MoviesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noMoviesData, setNoMoviesData] = useState(false);
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
    const fetchMoviesData = async () => {
      if (!dataSource || !userTimezone) return;

      setIsLoading(true);
      setError(null);
      setNoMoviesData(false);
      try {
        const response = await fetch(
          `/api/py/epg/movies/${dataSource}?days=${days}&timezone=${encodeURIComponent(userTimezone)}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch movies data');
        }
        const data: MoviesData = await response.json();
        if (data.channels.length === 0) {
          setNoMoviesData(true);
        } else {
          setMoviesData(data);
        }
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoviesData();
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
    if (!moviesData) return [];
    const filtered = moviesData.channels.filter(
      (ch) =>
        ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
        (selectedGroups.length === 0 || selectedGroups.includes(ch.channel.group)) &&
        (selectedCategories.length === 0 ||
          ch.programs[Object.keys(ch.programs)[0]].some((program) =>
            program.categories.some((category) => selectedCategories.includes(category))
          ))
    );
    return sortChannels(filtered);
  }, [moviesData, filterText, selectedGroups, selectedCategories]);

  const uniqueGroups = useMemo(() => {
    if (!moviesData) return [];
    return Array.from(new Set(moviesData.channels.map((ch) => ch.channel.group))).sort();
  }, [moviesData]);

  const uniqueCategories = useMemo(() => {
    if (!moviesData) return [];
    const categories = new Set<string>();
    moviesData.channels.forEach((ch) => {
      Object.values(ch.programs).forEach((programs) => {
        programs.forEach((program) => {
          program.categories.forEach((category) => categories.add(category));
        });
      });
    });
    return Array.from(categories).sort();
  }, [moviesData]);

  const handleGroupFilter = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = useCallback(() => {
    setFilterText('');
    setSelectedGroups([]);
    setSelectedCategories([]);
  }, []);

  const FilterMenu = () => (
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
            <CommandGroup heading="Categories">
              <ScrollArea className="h-[200px]">
                {uniqueCategories.map((category) => (
                  <CommandItem key={category} onSelect={() => handleCategoryFilter(category)}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryFilter(category)}
                      />
                      <Label htmlFor={`category-${category}`}>{category}</Label>
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
        <Button onClick={() => router.refresh()}>
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (noMoviesData) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Alert className="mb-4 max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>No Movies Programming</AlertTitle>
          <AlertDescription>
            No movies programming found for the next {days} days. <br />
            Try adjusting your search parameters or check back later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.refresh()}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>
    );
  }

  if (!moviesData || filteredAndSortedChannels.length === 0) {
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
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold">Upcoming Movies Programming</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search channels..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-[200px]"
          />
          <FilterMenu />
        </div>
      </div>
      <ScrollArea className="grow">
        <div className="w-full p-4">
          <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(600px,1fr))]">
            {filteredAndSortedChannels.map((channelData) => (
              <Card key={channelData.channel.slug} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between px-4 py-2">
                  {channelData.channel.icon && channelData.channel.icon.light !== 'N/A' && (
                    <div>
                      <img
                        className="block size-auto h-16 object-contain dark:hidden"
                        src={channelData.channel.icon.light}
                        alt={decodeHtml(channelData.channel.name)}
                      />
                      <img
                        className="hidden size-auto h-16 object-contain dark:block"
                        src={channelData.channel.icon.dark}
                        alt={decodeHtml(channelData.channel.name)}
                      />
                    </div>
                  )}
                  <div className="text-right">
                    <CardTitle className="text-lg">{channelData.channel.name}</CardTitle>
                    {channelData.channel.lcn !== 'N/A' && (
                      <CardDescription>Channel {channelData.channel.lcn}</CardDescription>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="h-[250px] w-full overflow-auto">
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(channelData.programs).map(([date, programs]) => (
                      <AccordionItem key={date} value={date}>
                        <AccordionTrigger className="text-md p-2">
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 size-4" />
                            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] w-full">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[150px]">Time</TableHead>
                                  <TableHead>Title</TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    Description
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="font-sm">
                                {programs.map((program, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-sm">
                                      {format(new Date(program.start), 'h:mm a')} -{' '}
                                      {format(new Date(program.end), 'h:mm a')}
                                    </TableCell>
                                    <TableCell className="font-sm">{program.title}</TableCell>
                                    <TableCell className="font-sm hidden md:table-cell">
                                      {program.description}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
                <CardFooter className="p-2">
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
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <MoviesPageContent />
      </Suspense>
    </main>
  );
}
