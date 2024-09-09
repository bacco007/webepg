'use client';

import { Suspense } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// const getValidImageSrc = (src: string) => {
//   return src && src.startsWith('http') ? src : '/placeholder.svg';
// };

const sortChannels = (channels: ChannelPrograms[]) => {
  return channels.sort((a, b) => {
    const lcnA = parseInt(a.channel.lcn) || Infinity;
    const lcnB = parseInt(b.channel.lcn) || Infinity;
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
  const [filterText, setFilterText] = useState('');
  const [dataSource, setDataSource] = useState<string>('xmltvnet-sydney');
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  const searchParams = useSearchParams();
  const days = searchParams.get('days') || '7';

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
      try {
        const response = await fetch(
          `/api/py/epg/sports/${dataSource}?days=${days}&timezone=${userTimezone}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch sports data');
        }
        const data: SportsData = await response.json();
        setSportsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSportsData();
  }, [days, dataSource, userTimezone]);

  const filteredAndSortedChannels = useMemo(() => {
    if (!sportsData) return [];
    const filtered = sportsData.channels.filter((ch) =>
      ch.channel.name.toLowerCase().includes(filterText.toLowerCase())
    );
    return sortChannels(filtered);
  }, [sportsData, filterText]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-4 text-2xl text-red-500">Error: {error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
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
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredAndSortedChannels.map((channelData) => (
                <Card key={channelData.channel.slug} className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <Image
                      src={channelData.channel.icon}
                      alt={`${channelData.channel.name} Logo`}
                      width={80}
                      height={40}
                      className="object-contain"
                    />
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
                </Card>
              ))}
            </div>
          )}
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
