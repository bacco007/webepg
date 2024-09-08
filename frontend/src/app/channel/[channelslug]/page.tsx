'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';

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

export default function Page() {
  const params = useParams();
  const channelslug = params.channelslug as string;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [daysLength, setDaysLength] = useState<number>(7);
  const [channelName, setChannelName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [clientTimezone, setClientTimezone] = useState<string>('UTC');

  const timeSlotHeight = 60;
  const timeColumnWidth = 60;
  const gridGap = 0.25 * 16;
  const headerHeight = 64; // Height of the header
  const stickyHeaderHeight = 40; // Height of the sticky day headers

  useEffect(() => {
    const detectedTimezone = dayjs.tz.guess();
    setClientTimezone(detectedTimezone);
  }, []);

  const fetchData = useCallback(async () => {
    if (!channelslug) {
      setError('No channel selected');
      setIsLoading(false);
      return;
    }

    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';

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
  }, [channelslug, clientTimezone]);

  useEffect(() => {
    fetchData();

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

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

      const days = Array.from({ length: daysLength }, (_, i) =>
        dayjs(startDate).add(i, 'day').toDate()
      );

      const dayIndex = days.findIndex(
        (day) => dayjs(day).format('YYYY-MM-DD') === eventStartDate.format('YYYY-MM-DD')
      );

      if (dayIndex === -1) return {};

      const startMinutes = eventStartDate.hour() * 60 + eventStartDate.minute();
      const endMinutes = eventEndDate.hour() * 60 + eventEndDate.minute();
      const duration = endMinutes - startMinutes;
      const startRow = Math.floor(startMinutes / 30) + 2;
      const endRow = Math.ceil(endMinutes / 30) + 2;
      const rowSpan = endRow - startRow;
      const endTime = eventEndDate.minute();
      const gG = [0, 30].includes(endTime) ? 0 : -4;

      return {
        gridColumnStart: dayIndex + 2,
        gridColumnEnd: dayIndex + 3,
        gridRowStart: startRow,
        gridRowEnd: endRow,
        marginTop: `${(startMinutes % 30) * (timeSlotHeight / 30)}px`,
        height: `calc(${duration * (timeSlotHeight / 30)}px + ${(rowSpan - 1) * gridGap + gG}px)`,
        width: '100%',
      };
    },
    [startDate, daysLength, timeSlotHeight, gridGap, clientTimezone]
  );

  const days = useMemo(() => {
    if (!startDate) return [];
    return Array.from({ length: daysLength }, (_, i) => dayjs(startDate).add(i, 'day').toDate());
  }, [startDate, daysLength]);

  const timeSlots = useMemo(() => Array.from({ length: 48 }, (_, i) => i * 30), []);

  const getCurrentTimePosition = useCallback(() => {
    if (!startDate) return 0;
    const now = dayjs(currentTime).tz(clientTimezone);
    const startOfDay = dayjs(startDate).tz(clientTimezone).startOf('day');
    const minutesSinceMidnight = now.diff(startOfDay, 'minute');
    const slots = Math.floor(minutesSinceMidnight / 30);
    const extraMinutes = minutesSinceMidnight % 30;
    return (
      slots * (timeSlotHeight + gridGap) +
      (extraMinutes / 30) * timeSlotHeight +
      headerHeight +
      stickyHeaderHeight
    );
  }, [
    currentTime,
    startDate,
    clientTimezone,
    timeSlotHeight,
    gridGap,
    headerHeight,
    stickyHeaderHeight,
  ]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-500" />
          <p className="mb-4 text-xl text-red-500">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="scrollbar-custom flex h-screen max-h-[calc(100vh-100px)] flex-col">
      <header
        className="bg-background flex items-center justify-between border-b p-4"
        style={{ height: `${headerHeight}px` }}
      >
        <h1 className="text-2xl font-bold">Weekly EPG (by Channel) - {channelName}</h1>
        <div className="flex items-center gap-4">
          <ChannelDropdown channelslug={channelslug} />
        </div>
      </header>
      <div className="grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-w-fit p-4">
            <div
              className="relative grid gap-1"
              style={{
                gridTemplateColumns: `${timeColumnWidth}px repeat(${daysLength}, minmax(200px, 1fr))`,
              }}
            >
              <div
                className="bg-background sticky top-0 z-20 col-span-1"
                style={{ height: `${stickyHeaderHeight}px` }}
              ></div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="bg-background sticky top-0 z-20 py-2 text-center font-semibold"
                  style={{ height: `${stickyHeaderHeight}px` }}
                >
                  {dayjs(day).format('ddd, MMM D')}
                </div>
              ))}

              {timeSlots.map((minutes) => (
                <React.Fragment key={minutes}>
                  <div
                    className="text-muted-foreground py-1 pr-2 text-right text-sm font-semibold"
                    style={{
                      height: `${timeSlotHeight}px`,
                    }}
                  >
                    {dayjs()
                      .tz(clientTimezone)
                      .startOf('day')
                      .add(minutes, 'minute')
                      .format('HH:mm')}
                  </div>
                  {days.map((day) => (
                    <div
                      key={`${day.toISOString()}-${minutes}`}
                      className="py-4"
                      style={{
                        height: `${timeSlotHeight}px`,
                      }}
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
                        'cursor-pointer transition-opacity hover:opacity-90'
                      )}
                    >
                      <div className="truncate font-semibold">{decodeHtml(event.title)}</div>
                      <div className="text-[10px] opacity-90">
                        {dayjs.tz(event.start, clientTimezone).format('HH:mm')} -{' '}
                        {dayjs.tz(event.end, clientTimezone).format('HH:mm')}
                      </div>
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
