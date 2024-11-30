'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { differenceInMinutes, format } from 'date-fns';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

import ChannelFilter from '@/components/ChannelFilter';
import DateTabs from '@/components/DateTabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProgramDialog from '@/components/ProgramDialog';
import TimeJumpDropdown from '@/components/TimeJumpDropdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getCookie, setCookie } from '@/lib/cookies';
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
  channel_name: string;
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
  channel: {
    id: string;
  };
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
  channel_names: {
    real: string;
    clean: string;
    location: string;
  };
  channel_number: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_name: string;
  channel_group: string;
  other_data: {
    channel_type: string;
    channel_specs: string;
  };
}

interface ChannelData {
  channel: {
    id: string;
    name: {
      real: string;
      clean: string;
      location: string;
    };
  };
  programs: ProgramData[];
}

const defaultColorClasses = ['bg-cyan-600'];
const HOVER_COLOR = 'bg-green-600';
const titleColorMappings = {
  'No Data Available':
    'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  'To Be Advised':
    'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  'To Be Advised (cont)':
    'bg-gray-500 bg-gradient-to-br from-gray-500 to-gray-700 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
};

const timeSlotWidth = 180;
const channelColumnWidth = 250;
const mobileChannelColumnWidth = 90;
const rowHeight = 70;
const rowGap = 5;
const programBoxHeight = rowHeight - rowGap;
const horizontalProgramGap = 2;

function EPGContent() {
  const parameters = useParams();
  const inputDate = parameters.date as string;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [channelFilter, setChannelFilter] = useState('');
  const [xmltvDataSource, setXmltvDataSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientTimezone, setClientTimezone] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const inputDateDJS = useMemo(() => dayjs(inputDate, 'YYYYMMDD').toDate(), [inputDate]);

  const transformPrograms = useCallback(
    (channelsData: ChannelData[]): Program[] => {
      const programs: Program[] = [];
      const now = dayjs().tz(clientTimezone || 'UTC');

      for (const channelData of channelsData) {
        const channel = channelData.channel;
        const uniquePrograms = new Map<string, ProgramData>();

        channelData.programs.forEach((programData: ProgramData) => {
          const key = `${programData.start_time}-${programData.end_time}-${programData.title}`;
          if (!uniquePrograms.has(key)) {
            uniquePrograms.set(key, programData);
          }
        });

        Array.from(uniquePrograms.values()).forEach((programData: ProgramData, index: number) => {
          const start = dayjs(programData.start_time);
          const end = dayjs(programData.end_time);

          const isCurrentProgram = now.isAfter(start) && now.isBefore(end);

          const getColorClass = () => {
            if (programData.title in titleColorMappings) {
              return titleColorMappings[programData.title as keyof typeof titleColorMappings];
            }
            if (isCurrentProgram) {
              return 'bg-red-500/80';
            }
            return defaultColorClasses[index % defaultColorClasses.length];
          };

          programs.push({
            id: `${channel.id}-${start.valueOf()}-${end.valueOf()}`,
            title: decodeHtml(programData.title),
            description: decodeHtml(programData.description),
            start: start.toISOString(),
            end: end.toISOString(),
            color: getColorClass(),
            channel: channel.id,
            channel_name: channel.name.real,
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

  const fetchData = useCallback(
    async (storedDataSource: string, storedTimezone: string) => {
      if (!storedDataSource || !storedTimezone) return;

      try {
        setLoading(true);
        setError(null);

        const channelResponse = await fetch(`/api/py/channels/${storedDataSource}`);
        if (!channelResponse.ok) {
          throw new Error('Failed to fetch channel data');
        }
        const channelData = await channelResponse.json();
        const sortedChannels = (channelData.data.channels || []).sort((a: Channel, b: Channel) => {
          const aNumber = Number.parseInt(a.channel_number);
          const bNumber = Number.parseInt(b.channel_number);
          if (isNaN(aNumber) && isNaN(bNumber))
            return a.channel_names.real.localeCompare(b.channel_names.real);
          if (isNaN(aNumber)) return 1;
          if (isNaN(bNumber)) return -1;
          if (aNumber === bNumber) return a.channel_names.real.localeCompare(b.channel_names.real);
          return aNumber - bNumber;
        });
        setChannels(sortedChannels);

        const programResponse = await fetch(
          `/api/py/epg/date/${inputDate}/${storedDataSource}?timezone=${encodeURIComponent(
            storedTimezone
          )}`
        );
        if (!programResponse.ok) {
          throw new Error('Failed to fetch program data');
        }
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
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setLoading(false);
      }
    },
    [inputDate, transformPrograms]
  );

  useEffect(() => {
    const initializeData = async () => {
      const storedDataSource = await getCookie('xmltvdatasource');
      const storedTimezone = await getCookie('userTimezone');

      setXmltvDataSource(storedDataSource || 'xmlepg_FTASYD');
      setClientTimezone(storedTimezone || dayjs.tz.guess());

      if (storedDataSource && storedTimezone) {
        await fetchData(storedDataSource, storedTimezone);
      }

      setIsInitialized(true);
    };

    initializeData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [fetchData]);

  useEffect(() => {
    if (isInitialized && xmltvDataSource && clientTimezone) {
      fetchData(xmltvDataSource, clientTimezone);
    }
  }, [isInitialized, xmltvDataSource, clientTimezone, fetchData]);

  const getProgramStyle = useCallback((program: Program): React.CSSProperties => {
    const start = dayjs(program.start);
    const end = dayjs(program.end);
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
  }, []);

  const calculateCurrentTimePosition = useCallback((): number => {
    const now = dayjs().tz(clientTimezone || 'UTC');
    const startOfDay = now.startOf('day');
    const minutesFromMidnight = now.diff(startOfDay, 'minute');
    return (
      (minutesFromMidnight / 30) * timeSlotWidth +
      (isMobile ? mobileChannelColumnWidth : channelColumnWidth)
    );
  }, [clientTimezone, isMobile]);

  const scrollToTime = useCallback(
    (minutesFromMidnight: number): void => {
      const position =
        (minutesFromMidnight / 30) * timeSlotWidth +
        (isMobile ? mobileChannelColumnWidth : channelColumnWidth);

      if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector(
          '[data-radix-scroll-area-viewport]'
        );
        if (scrollViewport) {
          scrollViewport.scrollTo({
            left: position,
            behavior: 'smooth',
          });
        }
      }
    },
    [isMobile]
  );

  const timeSlots = useMemo(() => Array.from({ length: 48 }, (_, index) => index * 30), []);

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) =>
      channel.channel_names.real.toLowerCase().includes(channelFilter.toLowerCase())
    );
  }, [channels, channelFilter]);

  const renderSchedule = useCallback((): JSX.Element => {
    const currentTimePosition = calculateCurrentTimePosition();

    return (
      <div className="relative">
        {filteredChannels.map((channel) => (
          <ChannelRow
            key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names.real}`}
            channel={channel}
            programs={allPrograms.filter((program) => program.channel === channel.channel_id)}
            xmltvDataSource={xmltvDataSource}
            timeSlots={timeSlots}
            getProgramStyle={getProgramStyle}
            clientTimezone={clientTimezone}
            isMobile={isMobile}
          />
        ))}

        <div
          className="absolute bottom-0 z-20 w-0.5 bg-green-500"
          style={{
            display: 'inline-block',
            left: `${currentTimePosition}px`,
            transform: 'translateX(-50%)',
            height: 'calc(100%)',
          }}
          role="presentation"
          aria-label="Current time"
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
    timeSlots,
    isMobile,
  ]);

  if (!isInitialized || loading) {
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
          <Button
            onClick={() =>
              xmltvDataSource && clientTimezone && fetchData(xmltvDataSource, clientTimezone)
            }
            className="mt-4"
          >
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold sm:text-2xl">
          Daily EPG - {format(inputDateDJS, 'EEEE, do MMMM')}
        </h1>
        {isMobile ? (
          <div className="w-full">
            <Button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="mb-2 w-full justify-between"
              variant="outline"
              aria-expanded={isFilterExpanded}
              aria-controls="mobile-filters"
            >
              {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
              {isFilterExpanded ? (
                <ChevronUp className="ml-2 size-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="ml-2 size-4" aria-hidden="true" />
              )}
            </Button>
            {isFilterExpanded && (
              <div id="mobile-filters" className="flex flex-col space-y-2">
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
      </div>
      <div className="p-1">
        <DateTabs />
      </div>
      <div className="relative grow overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
          <div className="bg-background sticky left-0 top-0 z-20">
            <div className="flex" role="row">
              <div
                className="shrink-0"
                style={{
                  width: isMobile ? mobileChannelColumnWidth : channelColumnWidth,
                }}
                role="columnheader"
              ></div>
              {timeSlots.map((minutes) => (
                <div
                  key={minutes}
                  className="border-border text-muted-foreground shrink-0 border-l py-2 text-left text-sm"
                  style={{ width: `${timeSlotWidth}px` }}
                  role="columnheader"
                >
                  <span className="ml-2 text-sm font-bold">
                    {dayjs().startOf('day').add(minutes, 'minute').format('HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="relative"
            style={{
              width: `${(isMobile ? mobileChannelColumnWidth : channelColumnWidth) + timeSlotWidth * 48}px`,
            }}
            role="grid"
            aria-label="EPG Schedule"
          >
            {renderSchedule()}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
    clientTimezone,
    isMobile,
  }: {
    channel: Channel;
    programs: Program[];
    xmltvDataSource: string | null;
    timeSlots: number[];
    getProgramStyle: (program: Program) => React.CSSProperties;
    clientTimezone: string | null;
    isMobile: boolean;
  }) => {
    const [hoveredProgram, setHoveredProgram] = useState<Program | null>(null);

    return (
      <div className="flex" role="row">
        <div
          className={cn(
            'border-border bg-background sticky left-0 z-10 flex items-center border-t px-2 py-1 font-semibold transition-colors duration-200',
            hoveredProgram && HOVER_COLOR
          )}
          style={{
            width: isMobile ? `${mobileChannelColumnWidth}px` : `${channelColumnWidth}px`,
            height: `${rowHeight}px`,
          }}
          role="rowheader"
        >
          <div>
            <img
              className="mr-2 block size-auto h-10 rounded-md object-contain dark:hidden"
              src={channel.channel_logo.light}
              alt={decodeHtml(channel.channel_name)}
              width={isMobile ? 25 : 45}
            />
            <img
              className="mr-2 hidden size-auto h-10 rounded-md object-contain dark:block"
              src={channel.channel_logo.dark}
              alt={decodeHtml(channel.channel_name)}
              width={isMobile ? 25 : 45}
            />
          </div>
          {!isMobile && (
            <Link
              href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
              className={cn('grow hover:underline', hoveredProgram && 'text-white')}
              style={{ fontSize: '0.9rem' }}
            >
              {channel.channel_names.real}
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
          role="gridcell"
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
              onOpenChange={() => {}}
              trigger={
                <div
                  style={getProgramStyle(program)}
                  className={cn(
                    'absolute overflow-hidden rounded-md p-1 text-xs text-white',
                    'cursor-pointer transition-colors duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    hoveredProgram === program ? HOVER_COLOR : program.color || 'bg-blue-600'
                  )}
                  role="button"
                  tabIndex={0}
                  aria-label={`${program.title} from ${dayjs(program.start)
                    .tz(clientTimezone || 'UTC')
                    .format('HH:mm')} to ${dayjs(program.end)
                    .tz(clientTimezone || 'UTC')
                    .format('HH:mm')}`}
                  onMouseEnter={() => setHoveredProgram(program)}
                  onMouseLeave={() => setHoveredProgram(null)}
                >
                  <div className="truncate">
                    {dayjs(program.start)
                      .tz(clientTimezone || 'UTC')
                      .format('HH:mm')}{' '}
                    -{' '}
                    {dayjs(program.end)
                      .tz(clientTimezone || 'UTC')
                      .format('HH:mm')}{' '}
                    (
                    {differenceInMinutes(
                      dayjs(program.end).toDate(),
                      dayjs(program.start).toDate()
                    )}
                    min)
                  </div>
                  <div className="truncate font-semibold">{program.title}</div>
                  {!isMobile && (
                    <div className="truncate whitespace-nowrap italic">
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

export default function EPGComponent() {
  return (
    <main>
      <EPGContent />
    </main>
  );
}
