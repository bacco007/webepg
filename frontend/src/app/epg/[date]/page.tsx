'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { differenceInMinutes, format } from 'date-fns';
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';

import DateTabs from '@/components/DateTabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProgramDialog from '@/components/ProgramDialog';
import TimeJumpDropdown from '@/components/TimeJumpDropdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCookie } from '@/lib/cookies';
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
    'bg-gray-400 bg-linear-to-br from-gray-400 to-gray-500 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  'To Be Advised':
    'bg-gray-400 bg-linear-to-br from-gray-400 to-gray-500 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  'To Be Advised (cont)':
    'bg-gray-400 bg-linear-to-br from-gray-400 to-gray-500 bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23ffffff" stroke-width="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
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
  const [sortBy, setSortBy] = useState<'channel_number' | 'channel_name'>(
    'channel_number',
  );
  const [groupBy, setGroupBy] = useState<
    'none' | 'channel_group' | 'channel_type'
  >('none');
  const [displayNameType, setDisplayNameType] = useState<
    'real' | 'clean' | 'location'
  >('real');
  const [nameFilter, setNameFilter] = useState('');
  const [groupFilters, setGroupFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [specsFilters, setSpecsFilters] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [specsOptions, setSpecsOptions] = useState<string[]>([]);

  const inputDateDJS = useMemo(
    () => dayjs(inputDate, 'YYYYMMDD').toDate(),
    [inputDate],
  );

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

        [...uniquePrograms.values()].forEach(
          (programData: ProgramData, index: number) => {
            const start = dayjs(programData.start_time);
            const end = dayjs(programData.end_time);

            const isCurrentProgram = now.isAfter(start) && now.isBefore(end);

            const getColorClass = () => {
              if (programData.title in titleColorMappings) {
                return titleColorMappings[
                  programData.title as keyof typeof titleColorMappings
                ];
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
          },
        );
      }
      return programs;
    },
    [clientTimezone],
  );

  const fetchData = useCallback(
    async (storedDataSource: string, storedTimezone: string) => {
      if (!storedDataSource || !storedTimezone) return;

      try {
        setLoading(true);
        setError(null);

        const channelResponse = await fetch(
          `/api/py/channels/${storedDataSource}`,
        );
        if (!channelResponse.ok) {
          throw new Error('Failed to fetch channel data');
        }
        const channelData = await channelResponse.json();
        const sortedChannels = (channelData.data.channels || []).sort(
          (a: Channel, b: Channel) => {
            if (sortBy === 'channel_number') {
              const aNumber = Number.parseInt(a.channel_number);
              const bNumber = Number.parseInt(b.channel_number);
              if (isNaN(aNumber) && isNaN(bNumber))
                return a.channel_names.real.localeCompare(b.channel_names.real);
              if (isNaN(aNumber)) return 1;
              if (isNaN(bNumber)) return -1;
              if (aNumber === bNumber)
                return a.channel_names.real.localeCompare(b.channel_names.real);
              return aNumber - bNumber;
            } else {
              return a.channel_names.real.localeCompare(b.channel_names.real);
            }
          },
        );
        setChannels(sortedChannels);

        const groups = [
          ...new Set(
            sortedChannels.map((c: { channel_group: any }) => c.channel_group),
          ),
        ];
        const types = [
          ...new Set(
            sortedChannels.map(
              (c: { other_data: { channel_type: any } }) =>
                c.other_data.channel_type,
            ),
          ),
        ];
        const specs = [
          ...new Set(
            sortedChannels.map(
              (c: { other_data: { channel_specs: any } }) =>
                c.other_data.channel_specs,
            ),
          ),
        ];
        setGroupOptions(
          groups.filter((group): group is string => typeof group === 'string'),
        );
        setTypeOptions(
          types.filter((type): type is string => typeof type === 'string'),
        );
        setSpecsOptions(
          specs.filter((spec): spec is string => typeof spec === 'string'),
        );

        const programResponse = await fetch(
          `/api/py/epg/date/${inputDate}/${storedDataSource}?timezone=${encodeURIComponent(
            storedTimezone,
          )}`,
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
        setError(
          error instanceof Error ? error.message : 'An unknown error occurred',
        );
        setLoading(false);
      }
    },
    [inputDate, transformPrograms, sortBy],
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

  const getProgramStyle = useCallback(
    (program: Program): React.CSSProperties => {
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
        minWidth: `${duration * (timeSlotWidth / 30) - 2 * horizontalProgramGap}px`,
        height: `${programBoxHeight}px`,
        top: '0',
      };
    },
    [],
  );

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
          '[data-radix-scroll-area-viewport]',
        );
        if (scrollViewport) {
          scrollViewport.scrollTo({
            left: position,
            behavior: 'smooth',
          });
        }
      }
    },
    [isMobile],
  );

  const timeSlots = useMemo(
    () => Array.from({ length: 48 }, (_, index) => index * 30),
    [],
  );

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const nameMatch = channel.channel_names.real
        .toLowerCase()
        .includes(nameFilter.toLowerCase());
      const groupMatch =
        groupFilters.length === 0 ||
        groupFilters.includes(channel.channel_group);
      const typeMatch =
        typeFilters.length === 0 ||
        typeFilters.includes(channel.other_data.channel_type);
      const specsMatch =
        specsFilters.length === 0 ||
        specsFilters.includes(channel.other_data.channel_specs);
      return nameMatch && groupMatch && typeMatch && specsMatch;
    });
  }, [channels, nameFilter, groupFilters, typeFilters, specsFilters]);

  const renderSchedule = useCallback((): JSX.Element => {
    const currentTimePosition = calculateCurrentTimePosition();

    return (
      <div className="relative">
        {filteredChannels.map(channel => (
          <ChannelRow
            key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names.real}`}
            channel={channel}
            programs={allPrograms.filter(
              program => program.channel === channel.channel_id,
            )}
            xmltvDataSource={xmltvDataSource}
            timeSlots={timeSlots}
            getProgramStyle={getProgramStyle}
            clientTimezone={clientTimezone}
            isMobile={isMobile}
            displayNameType={displayNameType}
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
    displayNameType,
  ]);

  const onTimeJump = useCallback(
    (time: number | string | { value: string }) => {
      if (typeof time === 'number') {
        // If it's a number, it's already minutes from midnight
        scrollToTime(time);
      } else {
        let timeString: string;
        if (typeof time === 'object' && 'value' in time) {
          timeString = time.value;
        } else if (typeof time === 'string') {
          timeString = time;
        } else {
          console.error('Invalid time format');
          return;
        }
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        scrollToTime(totalMinutes);
      }
    },
    [scrollToTime],
  );

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
              xmltvDataSource &&
              clientTimezone &&
              fetchData(xmltvDataSource, clientTimezone)
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
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 size-4" />
                Display Options
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">Sort by</h4>
                  <Select
                    value={sortBy}
                    onValueChange={value =>
                      setSortBy(value as 'channel_number' | 'channel_name')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sort option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="channel_number">
                        Channel Number
                      </SelectItem>
                      <SelectItem value="channel_name">Channel Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">Group by</h4>
                  <Select
                    value={groupBy}
                    onValueChange={value =>
                      setGroupBy(
                        value as 'none' | 'channel_group' | 'channel_type',
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="channel_group">
                        Channel Group
                      </SelectItem>
                      <SelectItem value="channel_type">Channel Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">Display Name</h4>
                  <Select
                    value={displayNameType}
                    onValueChange={value =>
                      setDisplayNameType(value as 'real' | 'clean' | 'location')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select display name type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real">Real</SelectItem>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">
                    Filter by Channel Name
                  </h4>
                  <Input
                    type="text"
                    placeholder="Filter by channel name..."
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">
                    Filter by Channel Group
                  </h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {groupFilters.length > 0
                          ? `${groupFilters.length} selected`
                          : 'Select groups'}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search groups..." />
                        <CommandEmpty>No group found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {groupOptions.map(group => (
                            <CommandItem
                              key={group}
                              onSelect={() => {
                                setGroupFilters(previous =>
                                  previous.includes(group)
                                    ? previous.filter(item => item !== group)
                                    : [...previous, group],
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 size-4',
                                  groupFilters.includes(group)
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              {group}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">
                    Filter by Channel Type
                  </h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {typeFilters.length > 0
                          ? `${typeFilters.length} selected`
                          : 'Select types'}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search types..." />
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {typeOptions.map(type => (
                            <CommandItem
                              key={type}
                              onSelect={() => {
                                setTypeFilters(previous =>
                                  previous.includes(type)
                                    ? previous.filter(item => item !== type)
                                    : [...previous, type],
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 size-4',
                                  typeFilters.includes(type)
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              {type}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">
                    Filter by Channel Specs
                  </h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {specsFilters.length > 0
                          ? `${specsFilters.length} selected`
                          : 'Select specs'}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search specs..." />
                        <CommandEmpty>No specs found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {specsOptions.map(specs => (
                            <CommandItem
                              key={specs}
                              onSelect={() => {
                                setSpecsFilters(previous =>
                                  previous.includes(specs)
                                    ? previous.filter(item => item !== specs)
                                    : [...previous, specs],
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 size-4',
                                  specsFilters.includes(specs)
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              {specs}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  onClick={() => {
                    setSortBy('channel_number');
                    setGroupBy('none');
                    setDisplayNameType('real');
                    setNameFilter('');
                    setGroupFilters([]);
                    setTypeFilters([]);
                    setSpecsFilters([]);
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <TimeJumpDropdown onTimeJump={onTimeJump} />
        </div>
      </div>
      <div className="p-1">
        <DateTabs />
      </div>
      <div className="relative grow overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
          <div className="bg-background sticky top-0 left-0 z-20">
            <div className="flex" role="row">
              <div
                className="shrink-0"
                style={{
                  width: isMobile
                    ? mobileChannelColumnWidth
                    : channelColumnWidth,
                }}
                role="columnheader"
              ></div>
              {timeSlots.map(minutes => (
                <div
                  key={minutes}
                  className="border-border text-muted-foreground shrink-0 border-l py-2 text-left text-sm"
                  style={{ width: `${timeSlotWidth}px` }}
                  role="columnheader"
                >
                  <span className="ml-2 text-sm font-bold">
                    {dayjs()
                      .startOf('day')
                      .add(minutes, 'minute')
                      .format('HH:mm')}
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
    displayNameType,
  }: {
    channel: Channel;
    programs: Program[];
    xmltvDataSource: string | null;
    timeSlots: number[];
    getProgramStyle: (program: Program) => React.CSSProperties;
    clientTimezone: string | null;
    isMobile: boolean;
    displayNameType: 'real' | 'clean' | 'location';
  }) => {
    const [hoveredProgram, setHoveredProgram] = useState<Program | null>(null);

    return (
      <div className="flex" role="row">
        <div
          className={cn(
            'border-border bg-background sticky left-0 z-10 flex items-center border-t px-2 py-1 font-semibold transition-colors duration-200',
            hoveredProgram && HOVER_COLOR,
          )}
          style={{
            width: isMobile
              ? `${mobileChannelColumnWidth}px`
              : `${channelColumnWidth}px`,
            height: `${rowHeight}px`,
          }}
          role="rowheader"
        >
          <div>
            <img
              className="mr-2 block size-auto h-10 rounded-md object-contain dark:hidden"
              src={channel.channel_logo.light || '/placeholder.svg'}
              alt={decodeHtml(channel.channel_name)}
              width={isMobile ? 25 : 45}
            />
            <img
              className="mr-2 hidden size-auto h-10 rounded-md object-contain dark:block"
              src={channel.channel_logo.dark || '/placeholder.svg'}
              alt={decodeHtml(channel.channel_name)}
              width={isMobile ? 25 : 45}
            />
          </div>
          {!isMobile && (
            <Link
              href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
              className={cn(
                'grow hover:underline',
                hoveredProgram && 'text-white',
              )}
              style={{ fontSize: '0.9rem' }}
            >
              {channel.channel_names[displayNameType]}
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
            {timeSlots.map(minutes => (
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
          {programs.map(program => (
            <ProgramDialog
              key={program.id}
              event={program}
              onOpenChange={() => {}}
              trigger={
                <div
                  id={program.id}
                  style={{
                    ...getProgramStyle(program),
                    transition: 'all 0.3s ease-in',
                    opacity: dayjs().isAfter(dayjs(program.end)) ? 0.7 : 1,
                  }}
                  className={cn(
                    'absolute overflow-hidden rounded-md p-1 text-xs text-white',
                    'cursor-pointer hover:z-10 focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
                    hoveredProgram === program
                      ? HOVER_COLOR
                      : program.color || 'bg-blue-600',
                  )}
                  role="button"
                  tabIndex={0}
                  aria-label={`${program.title} from ${dayjs(program.start)
                    .tz(clientTimezone || 'UTC')
                    .format('HH:mm')} to ${dayjs(program.end)
                    .tz(clientTimezone || 'UTC')
                    .format('HH:mm')}`}
                  onMouseEnter={() => {
                    setHoveredProgram(program);
                    const element = document.getElementById(program.id);
                    if (element) {
                      const content = element.querySelector('.program-content');
                      if (content) {
                        element.style.zIndex = '10';
                        element.style.width = 'auto';
                        element.style.maxWidth = 'none';
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredProgram(null);
                    const element = document.getElementById(program.id);
                    if (element) {
                      element.style.zIndex = '0';
                      element.style.width = getProgramStyle(program)
                        .width as string;
                      element.style.maxWidth = '';
                    }
                  }}
                >
                  {' '}
                  <div className="program-content shrink-0 whitespace-nowrap">
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
                        dayjs(program.start).toDate(),
                      )}
                      min)
                    </div>
                    <div className="truncate font-semibold">
                      {program.title}
                    </div>
                    {!isMobile &&
                      program.subtitle &&
                      program.subtitle !== 'N/A' && (
                        <div className="truncate italic">
                          {program.subtitle}
                        </div>
                      )}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </div>
    );
  },
);

ChannelRow.displayName = 'ChannelRow';

export default function EPGComponent() {
  return (
    <main>
      <EPGContent />
    </main>
  );
}
