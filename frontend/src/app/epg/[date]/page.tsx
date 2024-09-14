'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import ChannelFilter from '@/components/snippets/ChannelFilter';
import DateTabs from '@/components/snippets/DateTabs';
import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import ProgramDialog from '@/components/snippets/ProgramDialog';
import TimeJumpDropdown from '@/components/snippets/TimeJumpDropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const defaultColorClasses = ['bg-cyan-600'];
const titleColorMappings = {
  'No Data Available':
    'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  'To Be Advised':
    'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  'To Be Advised (cont)':
    'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  // 'Breaking News': 'bg-yellow-500 text-black',
  // 'Live Sports': 'bg-green-500',
  // // Add more mappings as needed
};

const timeSlotWidth = 180;
const channelColumnWidth = 250;
const mobileChannelColumnWidth = 90;
const rowHeight = 70;
const rowGap = 5;
const programBoxHeight = rowHeight - rowGap;
const horizontalProgramGap = 2;

export default function Component() {
  const parameters = useParams();
  const inputDate = parameters.date as string;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [channelFilter, setChannelFilter] = useState('');
  const [xmltvDataSource, setXmltvDataSource] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [clientTimezone, setClientTimezone] = useState<string>('UTC');
  const scrollContainerReference = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const inputDateDJS = useMemo(() => dayjs(inputDate, 'YYYYMMDD').toDate(), [inputDate]);

  const fetchData = useCallback(
    async (storedDataSource: string, storedTimezone: string) => {
      try {
        setLoading(true);

        const channelResponse = await fetch(`/api/py/channels/${storedDataSource}`);
        const channelData = await channelResponse.json();
        const sortedChannels = (channelData.data.channels || []).sort((a: Channel, b: Channel) => {
          const aNumber = Number.parseInt(a.channel_number);
          const bNumber = Number.parseInt(b.channel_number);
          if (isNaN(aNumber) && isNaN(bNumber)) return a.channel_name.localeCompare(b.channel_name);
          if (isNaN(aNumber)) return 1;
          if (isNaN(bNumber)) return -1;
          if (aNumber === bNumber) return a.channel_name.localeCompare(b.channel_name);
          return aNumber - bNumber;
        });
        setChannels(sortedChannels);

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
    },
    [inputDate, clientTimezone]
  );

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
    const storedTimezone = localStorage.getItem('userTimezone') || dayjs.tz.guess();

    setXmltvDataSource(storedDataSource);
    setUserTimezone(storedTimezone);
    setClientTimezone(storedTimezone);
    localStorage.setItem('userTimezone', storedTimezone);

    fetchData(storedDataSource, storedTimezone);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [fetchData]);

  const transformPrograms = useCallback(
    (channelsData: any[]): Program[] => {
      const programs: Program[] = [];
      const now = dayjs().tz(clientTimezone);

      for (const channelData of channelsData) {
        const channel = channelData.channel;
        channelData.programs.forEach((programData: ProgramData, index: number) => {
          const start = dayjs.tz(programData.start_time, clientTimezone);
          const end = dayjs.tz(programData.end_time, clientTimezone);

          const isCurrentProgram = now.isAfter(start) && now.isBefore(end);

          const getColorClass = () => {
            if (programData.title in titleColorMappings) {
              return titleColorMappings[programData.title as keyof typeof titleColorMappings];
            }
            if (isCurrentProgram) {
              return 'bg-red-500';
            }
            return defaultColorClasses[index % defaultColorClasses.length];
          };

          programs.push({
            id: `${channel.id}-${index}`,
            title: decodeHtml(programData.title),
            description: decodeHtml(programData.description),
            start: start.format(),
            end: end.format(),
            color: getColorClass(),
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
      }
      return programs;
    },
    [clientTimezone]
  );

  const getProgramStyle = useCallback(
    (program: Program): React.CSSProperties => {
      const channelIndex = channels.findIndex((ch) => ch.channel_id === program.channel);
      if (channelIndex === -1) {
        console.error(`Channel not found for program: ${program.title}`);
        return {};
      }
      const stripSeconds = (date: dayjs.Dayjs) => date.second(0).millisecond(0);
      const start = stripSeconds(dayjs(program.start).tz(clientTimezone));
      const end = stripSeconds(dayjs(program.end).tz(clientTimezone));
      const dayStart = start.startOf('day');

      const startMinutes = start.diff(dayStart, 'minute');
      const durationExact = end.diff(start, 'minute', true);
      const duration = Math.round(durationExact);

      return {
        position: 'absolute',
        left: `${startMinutes * (timeSlotWidth / 30) + horizontalProgramGap}px`,
        width: `${duration * (timeSlotWidth / 30) - 2 * horizontalProgramGap}px`,
        height: `${programBoxHeight}px`,
        top: '0',
      };
    },
    [channels, clientTimezone]
  );

  const filteredChannels = useMemo(
    () =>
      channels.filter((channel) =>
        channel.channel_name.toLowerCase().includes(channelFilter.toLowerCase())
      ),
    [channels, channelFilter]
  );

  const calculateCurrentTimePosition = useCallback((): number => {
    const now = dayjs().tz(clientTimezone);
    const startOfDay = now.startOf('day');
    const minutesFromMidnight = now.diff(startOfDay, 'minute');
    return (
      (minutesFromMidnight / 30) * timeSlotWidth +
      (isMobile ? mobileChannelColumnWidth : channelColumnWidth)
    );
  }, [clientTimezone, isMobile]);

  const scrollToTime = useCallback(
    (minutesFromMidnight: number): void => {
      if (scrollContainerReference.current) {
        const position =
          (minutesFromMidnight / 30) * timeSlotWidth +
          (isMobile ? mobileChannelColumnWidth : channelColumnWidth);
        scrollContainerReference.current.scrollTo({
          left: position,
          behavior: 'smooth',
        });
      }
    },
    [isMobile]
  );

  const timeSlots = useMemo(() => Array.from({ length: 48 }, (_, index) => index * 30), []);

  const renderSchedule = useCallback((): JSX.Element => {
    const currentTimePosition = calculateCurrentTimePosition();

    return (
      <div
        className="relative"
        style={{
          display: 'table',
          width: `${(isMobile ? mobileChannelColumnWidth : channelColumnWidth) + timeSlotWidth * 48}px`,
        }}
      >
        <div className="bg-background sticky left-0 top-0 z-20 flex">
          <div
            className="shrink-0"
            style={{ width: isMobile ? mobileChannelColumnWidth : channelColumnWidth }}
          ></div>
          {timeSlots.map((minutes) => (
            <div
              key={minutes}
              className="border-border text-muted-foreground shrink-0 border-l py-2 text-left text-sm"
              style={{ width: `${timeSlotWidth}px` }}
            >
              <span className="ml-2 text-sm font-bold">
                {dayjs().startOf('day').add(minutes, 'minute').format('HH:mm')}
              </span>
            </div>
          ))}
        </div>

        {filteredChannels.map((channel) => (
          <ChannelRow
            key={channel.channel_slug}
            channel={channel}
            programs={allPrograms.filter((program) => program.channel === channel.channel_id)}
            xmltvDataSource={xmltvDataSource}
            timeSlots={timeSlots}
            getProgramStyle={getProgramStyle}
            setSelectedProgram={setSelectedProgram}
            clientTimezone={clientTimezone}
            isMobile={isMobile}
          />
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
  }, [
    filteredChannels,
    allPrograms,
    xmltvDataSource,
    calculateCurrentTimePosition,
    getProgramStyle,
    clientTimezone,
    currentDate,
    timeSlots,
    isMobile,
  ]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="scrollbar-custom flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex flex-col items-start justify-between border-b p-4 sm:flex-row sm:items-center">
        <h1 className="mb-4 text-xl font-bold sm:mb-0 sm:text-2xl">
          Daily EPG - {format(inputDateDJS, 'EEEE, do MMMM')}
        </h1>
        {isMobile ? (
          <div className="w-full">
            <Button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="mb-2 w-full justify-between"
              variant="outline"
            >
              {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
              {isFilterExpanded ? (
                <ChevronUp className="ml-2 size-4" />
              ) : (
                <ChevronDown className="ml-2 size-4" />
              )}
            </Button>
            {isFilterExpanded && (
              <div className="flex flex-col space-y-2">
                <ChannelFilter value={channelFilter} onChange={setChannelFilter} />
                <TimeJumpDropdown onTimeJump={scrollToTime} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <ChannelFilter value={channelFilter} onChange={setChannelFilter} />
            <TimeJumpDropdown onTimeJump={scrollToTime} />
          </div>
        )}
      </header>
      <div className="p-1">
        <DateTabs />
      </div>
      <div
        className="scrollbar-custom relative ml-1 max-h-[calc(100vh-230px)] max-w-full"
        style={{ display: 'flex', overflow: 'scroll' }}
        ref={scrollContainerReference}
      >
        <div className="flex flex-col">{renderSchedule()}</div>
      </div>
    </div>
  );
}

const ChannelRow = React.memo(
  ({
    channel,
    programs,
    xmltvDataSource,
    timeSlots,
    getProgramStyle,
    setSelectedProgram,
    clientTimezone,
    isMobile,
  }: {
    channel: Channel;
    programs: Program[];
    xmltvDataSource: string | null;
    timeSlots: number[];
    getProgramStyle: (program: Program) => React.CSSProperties;
    setSelectedProgram: (program: Program | null) => void;
    clientTimezone: string;
    isMobile: boolean;
  }) => {
    return (
      <div key={channel.channel_slug} className="flex">
        <div
          className="border-border bg-background sticky left-0 z-20 flex items-center border-t px-2 py-1 font-semibold"
          style={{
            width: isMobile ? `${mobileChannelColumnWidth}px` : `${channelColumnWidth}px`,
            height: `${rowHeight}px`,
          }}
        >
          <Image
            src={channel.chlogo && channel.chlogo !== 'N/A' ? channel.chlogo : '/placeholder.svg'}
            alt={`${channel.channel_name} logo`}
            width={isMobile ? 30 : 50}
            height={isMobile ? 30 : 50}
            className="mr-2 rounded-md"
          />
          {!isMobile && (
            <Link
              href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
              className="grow hover:underline"
              style={{ fontSize: '0.9rem' }}
            >
              {channel.channel_name}
            </Link>
          )}
          {channel.channel_number && channel.channel_number !== 'N/A' && (
            <Badge variant="secondary" className="mr-2">
              {channel.channel_number}
            </Badge>
          )}
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
          {programs.map((program) => (
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
                    {dayjs(program.start).tz(clientTimezone).format('HH:mm')} -{' '}
                    {dayjs(program.end).tz(clientTimezone).format('HH:mm')} (
                    {differenceInMinutes(
                      dayjs(program.end).tz(clientTimezone).toDate(),
                      dayjs(program.start).tz(clientTimezone).toDate()
                    )}
                    min)
                  </div>
                  <div className="truncate font-semibold">{program.title}</div>
                  {!isMobile && (
                    <div className="truncate">
                      {program.subtitle && program.subtitle !== 'N/A' && program.subtitle}
                    </div>
                  )}
                </div>
              }
            />
          ))}
        </div>
      </div>
    );
  }
);

ChannelRow.displayName = 'ChannelRow';
