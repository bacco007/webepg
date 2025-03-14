'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useParams, useSearchParams } from 'next/navigation';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import ChannelDropdown from '@/components/ChannelDropdown';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProgramDialog from '@/components/ProgramDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { getCookie, setCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';
import { decodeHtml } from '@/utils/htmlUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  description: string;
  categories: string[];
  subtitle: string;
  episodeNum: string;
  rating: string;
  lengthstring: string;
  previouslyShown: boolean;
  date: string;
  icon: string;
  image: string;
  premiere: boolean;
  country: string;
  language: string;
  new: boolean;
  channel: string;
  channel_name: string;
  category: string[];
}

interface ApiData {
  date_pulled: string;
  query: string;
  source: string;
  channel: {
    channel_id: string;
    channel_slug: string;
    channel_name: string;
    channel_names: {
      real: string;
      clean: string;
      location: string;
    };
    channel_number: string;
    chlogo: string;
    channel_logo: {
      light: string;
      dark: string;
    };
  };
  programs: {
    [date: string]: Array<{
      start_time: string;
      start: string;
      end_time: string;
      end: string;
      length: string;
      channel: string;
      title: string;
      subtitle: string;
      description: string;
      categories: string[];
      episode: string;
      original_air_date: string;
      rating: string;
    }>;
  };
}

const defaultCategoryColors: { [key: string]: string } = {
  Sports: 'bg-green-600',
  News: 'bg-blue-600',
  Movie: 'bg-purple-600',
  Series: 'bg-yellow-600',
};

const defaultColorClasses = ['bg-cyan-600'];
const defaultLiveColor = 'bg-red-600';

const timeSlotHeight = 60;
const timeColumnWidth = 60;
const gridGap = 0.25 * 16;
const stickyHeaderHeight = 40;
const minDayWidth = 200;

function WeeklyEPGContent() {
  const parameters = useParams();
  const searchParams = useSearchParams();
  const channelslug = parameters.channelslug as string;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [daysLength, setDaysLength] = useState<number>(7);
  const [channelName, setChannelName] = useState<string>('');
  const [channelNumber, setChannelNumber] = useState<string>('');
  const [channelLogoLight, setChannelLogoLight] = useState<string>('');
  const [channelLogoDark, setChannelLogoDark] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientTimezone, setClientTimezone] = useState<string>('UTC');
  const [visibleDays, setVisibleDays] = useState<number>(7);
  const [startDayIndex, setStartDayIndex] = useState(0);
  const [storedDataSource, setStoredDataSource] = useState<string>('');
  const [useCategories, setUseCategories] = useState(false);
  const [now, setNow] = useState(() => dayjs());
  const [totalDays, setTotalDays] = useState<number>(0);

  const containerReference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const detectedTimezone = dayjs.tz.guess();
    setClientTimezone(detectedTimezone);
  }, []);

  useEffect(() => {
    const fetchDataSource = async () => {
      const urlSource = searchParams.get('source');
      const initialDataSource =
        urlSource || (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setStoredDataSource(initialDataSource);
    };

    fetchDataSource();
  }, [searchParams]);

  useEffect(() => {
    if (!storedDataSource) return;

    const checkDataSource = async () => {
      const currentDataSource =
        (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      if (currentDataSource !== storedDataSource) {
        globalThis.location.href = `/channel?source=${currentDataSource}`;
      }
    };

    const intervalId = setInterval(checkDataSource, 200);

    return () => clearInterval(intervalId);
  }, [storedDataSource]);

  const processApiData = useCallback(
    (data: ApiData) => {
      const dates = Object.keys(data.programs);
      if (dates.length === 0) {
        setError('No program data available');
        return;
      }

      const startDay = dayjs.tz(dates[0], clientTimezone).toDate();

      setStartDate(startDay);
      setDaysLength(dates.length);
      setTotalDays(dates.length);
      setChannelName(data.channel.channel_names.real);
      setChannelNumber(data.channel.channel_number);
      setChannelLogoLight(data.channel.channel_logo.light);
      setChannelLogoDark(data.channel.channel_logo.dark);

      const events = dates.flatMap((date, dayIndex) => {
        return data.programs[date].map((program, eventIndex) => {
          const start = dayjs.tz(program.start_time, clientTimezone);
          const end = dayjs.tz(program.end_time, clientTimezone);
          const category = program.categories[0] || 'No Data Available';

          return {
            id: dayIndex * 1000 + eventIndex,
            title: program.title,
            start: program.start_time,
            end: program.end_time,
            color: defaultCategoryColors[category] || 'bg-gray-500',
            description: program.description,
            categories: program.categories,
            subtitle: program.subtitle,
            episodeNum: program.episode,
            rating: program.rating,
            lengthstring: program.length,
            previouslyShown: false,
            date: program.original_air_date,
            icon: '',
            image: '',
            premiere: false,
            country: '',
            language: '',
            new: false,
            channel: data.channel.channel_name,
            channel_name: data.channel.channel_names.real,
            category: program.categories,
          };
        });
      });

      setAllEvents(events);
      setError(null);
    },
    [clientTimezone],
  );

  const fetchData = useCallback(async () => {
    if (!channelslug || !storedDataSource) {
      setError('No channel or data source selected');
      setIsLoading(false);
      return;
    }

    try {
      const url = `/api/py/epg/channels/${storedDataSource}/${channelslug}?timezone=${encodeURIComponent(
        clientTimezone,
      )}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiData = await response.json();
      if (!data || !data.programs) {
        throw new Error('Invalid data received from API');
      }
      processApiData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelslug, clientTimezone, storedDataSource, processApiData]);

  useEffect(() => {
    if (storedDataSource && channelslug) {
      fetchData();
    }

    const timer = setInterval(() => {
      setNow(dayjs());
    }, 60_000);

    return () => clearInterval(timer);
  }, [fetchData, storedDataSource, channelslug]);

  const getEventStyle = useCallback(
    (event: Event): React.CSSProperties => {
      if (!startDate) return {};

      const eventStartDate = dayjs.tz(event.start, clientTimezone);
      const eventEndDate = dayjs.tz(event.end, clientTimezone);

      const dayIndex = dayjs(eventStartDate).diff(
        dayjs(startDate).startOf('day'),
        'day',
      );

      if (dayIndex < startDayIndex || dayIndex >= startDayIndex + visibleDays) {
        return { display: 'none' };
      }

      const startMinutes = eventStartDate.hour() * 60 + eventStartDate.minute();
      const endMinutes = eventEndDate.hour() * 60 + eventEndDate.minute();
      const duration = endMinutes - startMinutes;
      const startRow = Math.floor(startMinutes / 30) + 2;
      const endRow = Math.ceil(endMinutes / 30) + 2;
      const rowSpan = endRow - startRow;
      const endTime = eventEndDate.minute();
      const gG = [0, 30].includes(endTime) ? 0 : -4;

      return {
        gridColumnStart: dayIndex - startDayIndex + 2,
        gridColumnEnd: dayIndex - startDayIndex + 3,
        gridRowStart: startRow,
        gridRowEnd: endRow,
        marginTop: `${(startMinutes % 30) * (timeSlotHeight / 30)}px`,
        height: `calc(${duration * (timeSlotHeight / 30)}px + ${(rowSpan - 1) * gridGap + gG}px)`,
        width: '100%',
      };
    },
    [startDate, clientTimezone, startDayIndex, visibleDays],
  );

  const days = useMemo(() => {
    if (!startDate) return [];
    return Array.from({ length: daysLength }, (_, index) =>
      dayjs(startDate).add(index, 'day').toDate(),
    );
  }, [startDate, daysLength]);

  const timeSlots = useMemo(
    () => Array.from({ length: 48 }, (_, index) => index * 30),
    [],
  );

  const handlePreviousDay = useCallback(() => {
    setStartDayIndex(previous => Math.max(0, previous - 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setStartDayIndex(previous =>
      Math.min(daysLength - visibleDays, previous + 1),
    );
  }, [daysLength, visibleDays]);

  useEffect(() => {
    const updateVisibleDays = () => {
      if (containerReference.current) {
        const containerWidth = containerReference.current.offsetWidth;
        const availableWidth = containerWidth - timeColumnWidth;
        const possibleDays = Math.floor(availableWidth / minDayWidth);
        setVisibleDays(Math.min(possibleDays, 7, daysLength));
      }
    };

    updateVisibleDays();
    window.addEventListener('resize', updateVisibleDays);

    return () => window.removeEventListener('resize', updateVisibleDays);
  }, [daysLength]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={fetchData} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <div className="sticky flex items-center justify-between border-b p-2">
        <div className="flex items-center space-x-4">
          {channelLogoLight && (
            <div>
              <img
                className="block size-auto h-10 object-contain dark:hidden"
                src={channelLogoLight || '/placeholder.svg'}
                alt={decodeHtml(channelName)}
              />
              <img
                className="hidden size-auto h-10 object-contain dark:block"
                src={channelLogoDark || '/placeholder.svg'}
                alt={decodeHtml(channelName)}
              />
            </div>
          )}
          <div className="flex items-center">
            <h1 className="text-lg font-bold sm:text-2xl">
              Weekly EPG - {channelName}
            </h1>
            <Badge variant="secondary" className="ml-2 self-center">
              LCN {channelNumber}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ChannelDropdown channelslug={channelslug} />
        </div>
      </div>
      <ScrollArea className="h-full">
        <div className="grow overflow-hidden" ref={containerReference}>
          <div className="min-w-fit p-2 sm:p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-categories"
                  checked={useCategories}
                  onCheckedChange={setUseCategories}
                />
                <label htmlFor="use-categories" className="text-sm font-medium">
                  Color by category
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePreviousDay}
                  disabled={startDayIndex === 0}
                  aria-label="Previous day"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <div className="font-semibold" aria-live="polite">
                  {days[startDayIndex] &&
                    dayjs(days[startDayIndex]).format('MMM D')}{' '}
                  -{' '}
                  {days[startDayIndex + visibleDays - 1] &&
                    dayjs(days[startDayIndex + visibleDays - 1]).format(
                      'MMM D',
                    )}{' '}
                  ({visibleDays} of {daysLength} days)
                </div>
                <Button
                  onClick={handleNextDay}
                  disabled={startDayIndex + visibleDays >= daysLength}
                  aria-label="Next day"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div
              className="relative grid gap-1"
              style={{
                gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays}, minmax(${minDayWidth}px, 1fr))`,
              }}
              role="grid"
              aria-label="Weekly EPG Grid"
            >
              <div
                className="sticky top-0 z-20 col-span-1 bg-background"
                style={{ height: `${stickyHeaderHeight}px` }}
                role="columnheader"
              ></div>
              {days
                .slice(startDayIndex, startDayIndex + visibleDays)
                .map((day, index) => {
                  if (!day) {
                    return null; // Skip rendering if day is undefined
                  }
                  return (
                    <div
                      key={`day-${index}-${day.toISOString()}`}
                      className="sticky top-0 z-20 bg-background py-2 text-center font-semibold"
                      style={{ height: `${stickyHeaderHeight}px` }}
                      role="columnheader"
                    >
                      {dayjs(day).format('ddd, MMM D')}
                    </div>
                  );
                })}

              {timeSlots.map(minutes => (
                <React.Fragment key={minutes}>
                  <div
                    className="py-1 pr-2 text-right text-xs font-semibold text-muted-foreground sm:text-sm"
                    style={{
                      height: `${timeSlotHeight}px`,
                    }}
                    role="rowheader"
                  >
                    {dayjs()
                      .tz(clientTimezone)
                      .startOf('day')
                      .add(minutes, 'minute')
                      .format('HH:mm')}
                  </div>
                  {Array.from({ length: visibleDays }).map((_, index) => (
                    <div
                      key={`timeslot-${index}-${minutes}`}
                      className="py-4"
                      style={{
                        height: `${timeSlotHeight}px`,
                      }}
                      role="gridcell"
                    ></div>
                  ))}
                </React.Fragment>
              ))}

              {allEvents.map(event => {
                const hasEnded = dayjs().isAfter(dayjs(event.end));
                return (
                  <ProgramDialog
                    key={event.id}
                    event={event}
                    onOpenChange={() => {}}
                    trigger={
                      <div
                        style={{
                          ...getEventStyle(event),
                          opacity: hasEnded ? 0.7 : 1,
                          transition: 'opacity 0.3s ease-in-out',
                        }}
                        className={cn(
                          'absolute overflow-hidden rounded-md p-1 text-xs text-white',
                          useCategories ? event.color : defaultColorClasses[0],
                          now.isAfter(dayjs(event.start)) &&
                            now.isBefore(dayjs(event.end)) &&
                            defaultLiveColor,
                          // eslint-disable-next-line
                          // prettier-ignore
                          event.title === 'No Data Available' &&
                            "bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"4\" height=\"4\" viewBox=\"0 0 4 4\"><path fill=\"none\" stroke=\"%23ffffff\" stroke-width=\"1\" d=\"M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3\"/></svg>')] bg-gray-300 bg-gradient-to-br from-gray-300 to-gray-400 bg-[length:4px_4px] bg-[position:1px_1px]",
                          'cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2',
                        )}
                        role="button"
                        tabIndex={0}
                        aria-label={`${event.title} from ${dayjs.tz(event.start, clientTimezone).format('HH:mm')} to ${dayjs.tz(event.end, clientTimezone).format('HH:mm')}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="truncate font-semibold">
                            {decodeHtml(event.title)}
                          </div>
                          <div className="text-[10px] opacity-90">
                            {dayjs
                              .tz(event.start, clientTimezone)
                              .format('HH:mm')}{' '}
                            -{' '}
                            {dayjs
                              .tz(event.end, clientTimezone)
                              .format('HH:mm')}
                          </div>
                        </div>
                        {event.subtitle !== 'N/A' && (
                          <div className="truncate italic">
                            {decodeHtml(event.subtitle)}
                          </div>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function WeeklyEPG() {
  return (
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <WeeklyEPGContent />
      </Suspense>
    </main>
  );
}
