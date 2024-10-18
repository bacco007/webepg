'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
  AlertCircle,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilterIcon,
  RefreshCw,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

dayjs.extend(utc);
dayjs.extend(timezone);

interface Channel {
  id: string;
  name: string;
  icon: string;
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

function SportsPageContent() {
  const [sportsData, setSportsData] = useState<SportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSportsData, setNoSportsData] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [dataSource, setDataSource] = useState<string>('xmlepg_FTASYD');
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const searchParameters = useSearchParams();
  const days = searchParameters.get('days') || '7';

  const router = useRouter();

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmlepg_FTASYD';
    const storedTimezone = localStorage.getItem('userTimezone') || dayjs.tz.guess();

    setDataSource(storedDataSource);
    setUserTimezone(storedTimezone);
  }, []);

  useEffect(() => {
    const fetchSportsData = async () => {
      setIsLoading(true);
      setError(null);
      setNoSportsData(false);
      try {
        const response = await fetch(
          `/api/py/epg/sports/${dataSource}?days=${days}&timezone=${userTimezone}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.detail === 'No sports programming found for the next 7 days') {
            setNoSportsData(true);
          } else {
            throw new Error(errorData.detail || 'Failed to fetch sports data');
          }
        } else {
          const data: SportsData = await response.json();
          setSportsData(data);
        }
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'An unknown error occurred');
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
      (ch) =>
        ch.channel.name.toLowerCase().includes(filterText.toLowerCase()) &&
        (selectedGroups.length === 0 || selectedGroups.includes(ch.channel.group)) &&
        (selectedCategories.length === 0 ||
          ch.programs[Object.keys(ch.programs)[0]].some((program) =>
            program.categories.some((category) => selectedCategories.includes(category))
          ))
    );
    return sortChannels(filtered);
  }, [sportsData, filterText, selectedGroups, selectedCategories]);

  const uniqueGroups = useMemo(() => {
    if (!sportsData) return [];
    return Array.from(new Set(sportsData.channels.map((ch) => ch.channel.group))).sort();
  }, [sportsData]);

  const uniqueCategories = useMemo(() => {
    if (!sportsData) return [];
    const categories = new Set<string>();
    sportsData.channels.forEach((ch) => {
      Object.values(ch.programs).forEach((programs) => {
        programs.forEach((program) => {
          program.categories.forEach((category) => categories.add(category));
        });
      });
    });
    return Array.from(categories).sort();
  }, [sportsData]);

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
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-4"
          />
        </div>
      </div>
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium">Filter by Group</h3>
        <ScrollArea className="h-40">
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
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium">Filter by Category</h3>
        <ScrollArea className="h-40">
          <div className="space-y-2">
            {uniqueCategories.map((category) => (
              <div key={category} className="flex items-center">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryFilter(category)}
                />
                <Label htmlFor={`category-${category}`} className="ml-2 text-sm">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
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
      <div className="flex h-screen flex-col items-center justify-center">
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
      <div className="flex h-screen flex-col items-center justify-center">
        <Alert className="mb-4 max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No channels match your current filter. <br />
            Try adjusting your search or clear the filter.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => {
            setFilterText('');
            setSelectedGroups([]);
            setSelectedCategories([]);
          }}
          aria-label="Clear All Filters"
        >
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="bg-background sticky top-0 z-10 w-full border-b">
        <div className="flex max-w-full flex-col items-center justify-between p-4 sm:flex-row">
          <h1 className="mb-4 text-2xl font-bold sm:mb-0">Sports Programs</h1>
          <div className="flex w-full items-center space-x-2 sm:w-auto">
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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(600px,1fr))]">
              {filteredAndSortedChannels.map((channelData) => (
                <Card key={channelData.channel.slug} className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between px-4 py-2">
                    {channelData.channel.icon !== 'N/A' && (
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
                            <ScrollArea className=" w-full">
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
              ))}
            </div>
          </div>
        </main>
        <FilterPanel />
      </div>
    </div>
  );
}

export default function SportsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SportsPageContent />
    </Suspense>
  );
}
