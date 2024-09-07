'use client';

import React, { useEffect, useRef, useState } from 'react';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import ChannelFilter from '@/components/snippets/ChannelFilter';
import DateDropdown from '@/components/snippets/DateDropdown';
import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import ProgramDialog from '@/components/snippets/ProgramDialog';
import TimeJumpDropdown from '@/components/snippets/TimeJumpDropdown';
import { cn } from '@/lib/utils';
import { decodeHtml } from '@/utils/htmlUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Program {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  color: string;
  channel: string;
  subtitle: string;
  episodeNum: string;
  rating: string;
  category: string[];
  lengthstring: string;
  previouslyShown: boolean;
  date: string;
  icon: string;
  image: string;
  premiere: boolean;
  country: string;
  language: string;
  new: boolean;
}

interface ProgramData {
  start_time: string;
  end_time: string;
  length: string;
  channel: string;
  title: string;
  subtitle: string;
  description: string;
  categories: string[];
  episode: string;
  original_air_date: string;
  rating: string;
}

interface Channel {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_number: string;
  chlogo: string;
}

const defaultColorClasses = ['bg-cyan-500'];

export default function Page() {
  const params = useParams();
  const inputDate = params.date as string;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [channelFilter, setChannelFilter] = useState('');
  const [xmltvDataSource, setXmltvDataSource] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string>('UTC');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const timeSlotWidth = 180;
  const channelColumnWidth = 200;
  const rowHeight = 70;
  const rowGap = 5;
  const programBoxHeight = rowHeight - rowGap;
  const horizontalProgramGap = 2;
  const inputDateDJS = dayjs(inputDate, 'YYYYMMDD').toDate();

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
    const clientTimezone = dayjs.tz.guess();

    setXmltvDataSource(storedDataSource);
    setTimezone(clientTimezone);

    const fetchData = async () => {
      try {
        setLoading(true);

        const channelResponse = await fetch(`/api/py/channels/${storedDataSource}`);
        const channelData = await channelResponse.json();
        setChannels(channelData.data.channels || []);

        const programResponse = await fetch(
          `/api/py/epg/date/${inputDate}/${storedDataSource}?timezone=${encodeURIComponent(
            clientTimezone
          )}`
        );
        const programData = await programResponse.json();

        if (!programData.channels || !Array.isArray(programData.channels)) {
          console.error('Unexpected API response structure:', programData);
          setAllPrograms([]);
        } else {
          const programs = transformPrograms(programData.channels);
          setAllPrograms(programs);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [inputDate]);

  const transformPrograms = (channelsData: any[]): Program[] => {
    const programs: Program[] = [];
    const now = new Date();

    channelsData.forEach((channelData) => {
      const channel = channelData.channel;
      channelData.programs.forEach((programData: ProgramData, index: number) => {
        const start = parseISO(programData.start_time);
        const end = parseISO(programData.end_time);

        const isCurrentProgram = now >= start && now <= end;

        programs.push({
          id: `${channel.id}-${index}`,
          title: decodeHtml(programData.title),
          description: decodeHtml(programData.description),
          start: programData.start_time,
          end: programData.end_time,
          color:
            programData.title === 'No Data Available'
              ? 'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]'
              : isCurrentProgram
                ? 'bg-red-500'
                : defaultColorClasses[index % defaultColorClasses.length],
          channel: channel.id,
          subtitle: programData.subtitle,
          episodeNum: programData.episode,
          rating: programData.rating,
          category: programData.categories,
          lengthstring: programData.length,
          previouslyShown: false,
          date: programData.original_air_date,
          icon: '',
          image: '',
          premiere: false,
          country: '',
          language: '',
          new: false,
        });
      });
    });
    return programs;
  };

  const getProgramStyle = (program: Program): React.CSSProperties => {
    const channelIndex = channels.findIndex((ch) => ch.channel_id === program.channel);
    if (channelIndex === -1) {
      console.error(`Channel not found for program: ${program.title}`);
      return {};
    }

    const start = parseISO(program.start);
    const end = parseISO(program.end);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);

    return {
      gridRow: channelIndex + 2,
      gridColumn: 2,
      marginLeft: `${startMinutes * (timeSlotWidth / 30) + horizontalProgramGap}px`,
      width: `${duration * (timeSlotWidth / 30) - 2 * horizontalProgramGap}px`,
      height: `${programBoxHeight}px`,
    };
  };

  const filteredChannels = channels.filter((channel) =>
    channel.channel_name.toLowerCase().includes(channelFilter.toLowerCase())
  );

  const calculateCurrentTimePosition = (): number => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const minutesFromMidnight = (now.getTime() - startOfDay.getTime()) / (1000 * 60);
    return (minutesFromMidnight / 30) * timeSlotWidth + channelColumnWidth;
  };

  const scrollToTime = (minutesFromMidnight: number): void => {
    if (scrollContainerRef.current) {
      const position = (minutesFromMidnight / 30) * timeSlotWidth + channelColumnWidth;
      scrollContainerRef.current.scrollTo({
        left: position,
        behavior: 'smooth',
      });
    }
  };

  const renderSchedule = (): JSX.Element => {
    const timeSlots = Array.from({ length: 48 }, (_, i) => i * 30);
    const currentTimePosition = calculateCurrentTimePosition();

    return (
      <div
        className="relative"
        style={{
          display: 'table',
          width: `${channelColumnWidth + timeSlotWidth * 48}px`,
        }}
      >
        <div className="bg-background sticky left-0 top-0 z-20 flex">
          <div className="shrink-0" style={{ width: channelColumnWidth }}></div>
          {timeSlots.map((minutes) => (
            <div
              key={minutes}
              className="border-border text-muted-foreground shrink-0 border-l py-2 text-left text-sm"
              style={{ width: `${timeSlotWidth}px` }}
            >
              <span className="ml-2 text-base">
                {format(
                  new Date(currentDate).setHours(Math.floor(minutes / 60), minutes % 60),
                  'HH:mm'
                )}
              </span>
            </div>
          ))}
        </div>

        {filteredChannels.map((channel) => (
          <div key={channel.channel_slug} className="flex">
            <div
              className="border-border bg-background sticky left-0 z-20 flex items-center border-t px-2 py-1 font-semibold"
              style={{
                width: `${channelColumnWidth}px`,
                height: `${rowHeight}px`,
              }}
            >
              <Image
                src={
                  channel.chlogo && channel.chlogo !== 'N/A' ? channel.chlogo : '/placeholder.svg'
                }
                alt={`${channel.channel_name} logo`}
                width={50}
                height={50}
                className="mr-2 rounded-md"
              />
              <Link
                href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
                className="grow hover:underline"
                style={{ fontSize: '0.9rem' }}
              >
                {channel.channel_name}
              </Link>
            </div>
            <div
              className="border-border relative border-t"
              style={{
                height: `${rowHeight}px`,
                width: `${timeSlotWidth * 48}px`,
              }}
            >
              <div className="absolute inset-0 flex">
                {timeSlots.map((minutes) => (
                  <div
                    key={`${channel.channel_slug}-${minutes}`}
                    className="border-border shrink-0 border-l"
                    style={{
                      width: `${timeSlotWidth}px`,
                      height: '100%',
                    }}
                  ></div>
                ))}
              </div>
              {allPrograms
                .filter((program) => program.channel === channel.channel_id)
                .map((program) => (
                  <ProgramDialog
                    key={program.id}
                    event={program}
                    onOpenChange={(open) => !open && setSelectedProgram(null)}
                    trigger={
                      <div
                        style={getProgramStyle(program)}
                        className={cn(
                          'absolute overflow-hidden rounded-md p-1 text-xs text-white',
                          program.color,
                          'cursor-pointer transition-opacity hover:opacity-90'
                        )}
                        onClick={() => setSelectedProgram(program)}
                      >
                        <div className="truncate">
                          {format(parseISO(program.start), 'HH:mm')} -{' '}
                          {format(parseISO(program.end), 'HH:mm')} (
                          {differenceInMinutes(parseISO(program.end), parseISO(program.start))}
                          min)
                        </div>
                        <div className="truncate font-semibold">{program.title}</div>
                        <div className="truncate">{program.description}</div>
                      </div>
                    }
                  />
                ))}
            </div>
          </div>
        ))}

        <div
          className="absolute bottom-0 top-[40px] z-20 w-px bg-green-500"
          style={{
            display: 'inline-block',
            left: `${currentTimePosition}px`,
            transform: 'translateX(-50%)',
            height: 'calc(100%)',
          }}
        />
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Daily EPG - {format(inputDateDJS, 'EEEE, do MMMM')}</h1>
        <div className="flex items-center gap-4">
          <ChannelFilter value={channelFilter} onChange={setChannelFilter} />
          <DateDropdown />
          <TimeJumpDropdown onTimeJump={scrollToTime} />
        </div>
      </header>
      <div
        className="relative ml-1 max-h-[calc(100vh-185px)] max-w-full"
        style={{ display: 'flex', overflow: 'scroll' }}
        ref={scrollContainerRef}
      >
        <div className="flex flex-col">{renderSchedule()}</div>
      </div>
    </div>
  );
}
