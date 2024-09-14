'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { AlertCircle, CalendarIcon, Clock, FilterIcon, RefreshCw } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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

function SportsPageContent() {
  const [sportsData, setSportsData] = useState<SportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSportsData, setNoSportsData] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [dataSource, setDataSource] = useState<string>('xmltvnet-sydney');
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  const searchParameters = useSearchParams();
  const days = searchParameters.get('days') || '7';

  const router = useRouter();

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
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
    const filtered = sportsData.channels.filter((ch) =>
      ch.channel.name.toLowerCase().includes(filterText.toLowerCase())
    );
    return sortChannels(filtered);
  }, [sportsData, filterText]);

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
            No sports programming found for the next {days} days. Try adjusting your search
            parameters or check back later.
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
            No channels match your current filter. Try adjusting your search or clear the filter.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setFilterText('')}>Clear Filter</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="bg-background sticky top-0 z-10 w-full border-b">
        <div className="flex max-w-full flex-col items-center justify-between p-4 sm:flex-row">
          <h1 className="mb-4 text-2xl font-bold sm:mb-0">Sports Programs</h1>
          <div className="flex w-full items-center space-x-2 sm:w-auto">
            <FilterIcon className="hidden size-5 sm:block" />
            <Input
              type="text"
              placeholder="Filter channels..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full sm:w-[300px]"
            />
            {filterText && (
              <Button
                variant="outline"
                onClick={() => setFilterText('')}
                className="whitespace-nowrap"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="w-full grow overflow-auto">
        <div className="max-w-full px-4 py-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredAndSortedChannels.map((channelData) => (
              <Card key={channelData.channel.slug} className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  {channelData.channel.icon !== 'N/A' && (
                    <Image
                      src={channelData.channel.icon}
                      alt={`${channelData.channel.name} Logo`}
                      width={80}
                      height={40}
                      className="object-contain"
                    />
                  )}
                  <div className="text-right">
                    <CardTitle className="text-lg">{channelData.channel.name}</CardTitle>
                    {channelData.channel.lcn !== 'N/A' && (
                      <CardDescription>Channel {channelData.channel.lcn}</CardDescription>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(channelData.programs).map(([date, programs]) => (
                      <AccordionItem key={date} value={date}>
                        <AccordionTrigger className="text-lg">
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 size-5" />
                            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[400px] w-full">
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
                              <TableBody>
                                {programs.map((program, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">
                                      {format(new Date(program.start), 'h:mm a')} -{' '}
                                      {format(new Date(program.end), 'h:mm a')}
                                    </TableCell>
                                    <TableCell>{program.title}</TableCell>
                                    <TableCell className="hidden md:table-cell">
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
            ))}
          </div>
        </div>
      </main>
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
