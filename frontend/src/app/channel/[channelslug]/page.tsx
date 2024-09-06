'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useParams } from 'next/navigation';

import ChannelDropdown from '@/components/snippets/ChannelDropdown';
import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import ProgramDialog from '@/components/snippets/ProgramDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const colorClasses = ['bg-cyan-500'];

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

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

export default function Page() {
  const params = useParams();
  const channelslug = params.channelslug as string;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [daysLength, setDaysLength] = useState<number>(7);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [channelName, setChannelName] = useState<string>('');
  const [xmltvDataSource, setXmltvDataSource] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [error, setError] = useState<string | null>(null);

  const timeSlotHeight = 60;
  const timeColumnWidth = 60;
  const gridGap = 0.25 * 16;

  useEffect(() => {
    const fetchData = async () => {
      if (!channelslug) {
        setError('No channel selected');
        return;
      }

      try {
        const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
        const clientTimezone = dayjs.tz.guess();

        setXmltvDataSource(storedDataSource);
        setTimezone(clientTimezone);

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
      }
    };

    fetchData();
  }, [channelslug]);

  const processApiData = (data: ApiData) => {
    const dates = Object.keys(data.programs);
    if (dates.length === 0) {
      setError('No program data available');
      return;
    }

    const startDay = dayjs(dates[0]).toDate();

    setStartDate(startDay);
    setDaysLength(dates.length);
    setChannelName(data.channel.channel_name);

    const now = new Date();

    const events = dates.flatMap((date, dayIndex) => {
      return data.programs[date].map((program, eventIndex) => {
        const start = new Date(program.start_time);
        const end = new Date(program.end_time);

        const isCurrentEvent = now >= start && now <= end;

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
          previouslyShown: false, // This information is not provided in the new data structure
          date: program.original_air_date,
          icon: '', // This information is not provided in the new data structure
          image: '', // This information is not provided in the new data structure
          premiere: false, // This information is not provided in the new data structure
          country: '', // This information is not provided in the new data structure
          language: '', // This information is not provided in the new data structure
          new: false, // This information is not provided in the new data structure
          channel: data.channel.channel_name,
          category: program.categories,
        };
      });
    });

    setAllEvents(events);
    setError(null);
  };

  const getEventStyle = (event: Event): React.CSSProperties => {
    if (!startDate) return {};

    const eventStartDate = new Date(event.start);
    const eventEndDate = new Date(event.end);

    const days = Array.from({ length: daysLength }, (_, i) =>
      dayjs(startDate).add(i, 'day').toDate()
    );

    const dayIndex = days.findIndex(
      (day) => dayjs(day).format('YYYY-MM-DD') === dayjs(eventStartDate).format('YYYY-MM-DD')
    );

    if (dayIndex === -1) return {};

    const startMinutes = eventStartDate.getHours() * 60 + eventStartDate.getMinutes();
    const endMinutes = eventEndDate.getHours() * 60 + eventEndDate.getMinutes();
    const duration = endMinutes - startMinutes;
    const startRow = Math.floor(startMinutes / 30) + 2;
    const endRow = Math.ceil(endMinutes / 30) + 2;
    const rowSpan = endRow - startRow;
    const endTime = eventEndDate.getMinutes();
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
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!startDate) {
    return <LoadingSpinner />;
  }

  const days = Array.from({ length: daysLength }, (_, i) =>
    dayjs(startDate).add(i, 'day').toDate()
  );

  const timeSlots = Array.from({ length: 48 }, (_, i) => i * 30);

  return (
    <div>
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Weekly EPG (by Channel) - {channelName}</h1>
        <div className="flex items-center gap-4">
          <ChannelDropdown channelslug={channelslug} />
        </div>
      </header>
      <div className="mx-auto w-full p-4">
        <ScrollArea className="h-[calc(100vh-2rem)] w-full">
          <div
            className={'relative grid gap-1'}
            style={{
              gridTemplateColumns: `${timeColumnWidth}px repeat(${daysLength}, 1fr)`,
            }}
          >
            <div className="bg-background sticky top-0 z-20 col-span-1"></div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="bg-background sticky top-0 z-20 py-2 text-center font-semibold"
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
                    .hour(Math.floor(minutes / 60))
                    .minute(minutes % 60)
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
                onOpenChange={(open) => !open && setSelectedEvent(null)}
                trigger={
                  <div
                    style={getEventStyle(event)}
                    className={cn(
                      'absolute overflow-hidden rounded-md p-1 text-xs text-white',
                      event.color,
                      'cursor-pointer transition-opacity hover:opacity-90'
                    )}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="truncate font-semibold">{decodeHtml(event.title)}</div>
                    <div className="text-[10px] opacity-90">
                      {dayjs(event.start).format('HH:mm')} - {dayjs(event.end).format('HH:mm')}
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
