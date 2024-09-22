'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import ChannelDropdown from '@/components/snippets/ChannelDropdown';
import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import ProgramDialog from '@/components/snippets/ProgramDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { decodeHtml } from '@/utils/htmlUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

const colorClasses = ['bg-cyan-600'];

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
    channel_number: string;
    chlogo: string;
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

export default function WeeklyEPG() {
  const parameters = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelslug = parameters.channelslug as string;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [daysLength, setDaysLength] = useState<number>(7);
  const [channelName, setChannelName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientTimezone, setClientTimezone] = useState<string>('UTC');
  const [visibleDays, setVisibleDays] = useState<number>(7);
  const [startDayIndex, setStartDayIndex] = useState(0);
  const [storedDataSource, setStoredDataSource] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const containerReference = useRef<HTMLDivElement>(null);

  const timeSlotHeight = 60;
  const timeColumnWidth = 60;
  const gridGap = 0.25 * 16;
  // const headerHeight = 64; // Removed unused variable
  const stickyHeaderHeight = 40;
  const minDayWidth = 200; // Minimum width for a day column

  useEffect(() => {
    const detectedTimezone = dayjs.tz.guess();
    setClientTimezone(detectedTimezone);
  }, []);

  useEffect(() => {
    const urlSource = searchParams.get('source');
    const initialDataSource =
      urlSource || localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
    setStoredDataSource(initialDataSource);
  }, [searchParams]);

  useEffect(() => {
    const checkDataSource = () => {
      const currentDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
      if (storedDataSource && currentDataSource !== storedDataSource) {
        router.push(`/channel?source=${currentDataSource}`);
      }
    };

    const intervalId = setInterval(checkDataSource, 200); // Check every 200ms

    return () => clearInterval(intervalId);
  }, [router, storedDataSource]);

  const fetchData = useCallback(async () => {
    if (!channelslug || !storedDataSource) {
      setError('No channel or data source selected');
      setIsLoading(false);
      return;
    }

    try {
      const url = `/api/py/epg/channels/${storedDataSource}/${channelslug}?timezone=${encodeURIComponent(
        clientTimezone
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
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [channelslug, clientTimezone, storedDataSource]);

  useEffect(() => {
    fetchData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(timer);
  }, [fetchData]);

  const processApiData = (data: ApiData) => {
    const dates = Object.keys(data.programs);
    if (dates.length === 0) {
      setError('No program data available');
      return;
    }

    const startDay = dayjs.tz(dates[0], clientTimezone).toDate();

    setStartDate(startDay);
    setDaysLength(dates.length);
    setChannelName(data.channel.channel_name);

    const now = dayjs().tz(clientTimezone);

    const events = dates.flatMap((date, dayIndex) => {
      return data.programs[date].map((program, eventIndex) => {
        const start = dayjs.tz(program.start_time, clientTimezone);
        const end = dayjs.tz(program.end_time, clientTimezone);

        const isCurrentEvent = now.isAfter(start) && now.isBefore(end);

        return {
          id: dayIndex * 1000 + eventIndex,
          title: program.title,
          start: program.start_time,
          end: program.end_time,
          color:
            program.title === 'No Data Available'
              ? 'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]'
              : isCurrentEvent
                ? 'bg-red-500'
                : colorClasses[eventIndex % colorClasses.length],
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
          category: program.categories,
        };
      });
    });

    setAllEvents(events);
    setError(null);
  };

  const getEventStyle = useCallback(
    (event: Event): React.CSSProperties => {
      if (!startDate) return {};

      const eventStartDate = dayjs.tz(event.start, clientTimezone);
      const eventEndDate = dayjs.tz(event.end, clientTimezone);

      const dayIndex = dayjs(eventStartDate).diff(dayjs(startDate).startOf('day'), 'day');

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
    [startDate, timeSlotHeight, gridGap, clientTimezone, startDayIndex, visibleDays]
  );

  const days = useMemo(() => {
    if (!startDate) return [];
    return Array.from({ length: daysLength }, (_, index) =>
      dayjs(startDate).add(index, 'day').toDate()
    );
  }, [startDate, daysLength]);

  const timeSlots = useMemo(() => Array.from({ length: 48 }, (_, index) => index * 30), []);

  const handlePreviousDay = () => {
    setStartDayIndex((previous) => Math.max(0, previous - 1));
  };

  const handleNextDay = () => {
    setStartDayIndex((previous) => Math.min(daysLength - visibleDays, previous + 1));
  };

  useEffect(() => {
    const updateVisibleDays = () => {
      if (containerReference.current) {
        const containerWidth = containerReference.current.offsetWidth;
        const availableWidth = containerWidth - timeColumnWidth;
        const possibleDays = Math.floor(availableWidth / minDayWidth);
        setVisibleDays(Math.min(possibleDays, 7, daysLength)); // Limit to 7 days maximum
      }
    };

    updateVisibleDays();
    window.addEventListener('resize', updateVisibleDays);

    return () => window.removeEventListener('resize', updateVisibleDays);
  }, [daysLength]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center" role="alert">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-500" aria-hidden="true" />
          <p className="mb-4 text-xl text-red-500">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" aria-hidden="true" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="scrollbar-custom flex h-screen max-h-[calc(100vh-100px)] flex-col">
      <header className="bg-background sticky top-0 z-0 w-full border-b p-2 sm:p-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-lg font-bold sm:text-2xl">Weekly EPG - {channelName}</h1>
          <div className="flex items-center space-x-2">
            <ChannelDropdown channelslug={channelslug} />
          </div>
        </div>
      </header>
      <div className="grow overflow-hidden" ref={containerReference}>
        <ScrollArea className="h-full">
          <div className="min-w-fit p-2 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <Button
                onClick={handlePreviousDay}
                disabled={startDayIndex === 0}
                aria-label="Previous day"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <div className="font-semibold" aria-live="polite">
                {days[startDayIndex] && dayjs(days[startDayIndex]).format('MMM D')} -{' '}
                {days[startDayIndex + visibleDays - 1] &&
                  dayjs(days[startDayIndex + visibleDays - 1]).format('MMM D')}
              </div>
              <Button
                onClick={handleNextDay}
                disabled={startDayIndex + visibleDays >= daysLength}
                aria-label="Next day"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
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
                className="bg-background sticky top-0 z-20 col-span-1"
                style={{ height: `${stickyHeaderHeight}px` }}
                role="columnheader"
              ></div>
              {days.slice(startDayIndex, startDayIndex + visibleDays).map((day) => (
                <div
                  key={day ? day.toISOString() : ''}
                  className="bg-background sticky top-0 z-20 py-2 text-center font-semibold"
                  style={{ height: `${stickyHeaderHeight}px` }}
                  role="columnheader"
                >
                  {day ? dayjs(day).format('ddd, MMM D') : ''}
                </div>
              ))}

              {timeSlots.map((minutes) => (
                <React.Fragment key={minutes}>
                  <div
                    className="text-muted-foreground py-1 pr-2 text-right text-xs font-semibold sm:text-sm"
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
                      key={`${days[startDayIndex + index] ? days[startDayIndex + index].toISOString() : ''}-${minutes}`}
                      className="py-4"
                      style={{
                        height: `${timeSlotHeight}px`,
                      }}
                      role="gridcell"
                    ></div>
                  ))}
                </React.Fragment>
              ))}

              {allEvents.map((event) => (
                <ProgramDialog
                  key={event.id}
                  event={event}
                  onOpenChange={() => {}}
                  trigger={
                    <div
                      style={getEventStyle(event)}
                      className={cn(
                        'absolute overflow-hidden rounded-md p-1 text-xs text-white',
                        event.color,
                        'cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2'
                      )}
                      role="button"
                      tabIndex={0}
                      aria-label={`${event.title} from ${dayjs.tz(event.start, clientTimezone).format('HH:mm')} to ${dayjs.tz(event.end, clientTimezone).format('HH:mm')}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="truncate font-semibold">{decodeHtml(event.title)}</div>
                        <div className="text-[10px] opacity-90">
                          {dayjs.tz(event.start, clientTimezone).format('HH:mm')} -{' '}
                          {dayjs.tz(event.end, clientTimezone).format('HH:mm')}
                        </div>
                      </div>
                      {event.subtitle !== 'N/A' && (
                        <div className="truncate">{decodeHtml(event.subtitle)}</div>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
