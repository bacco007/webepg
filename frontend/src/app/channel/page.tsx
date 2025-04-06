'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Sliders,
  X,
} from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getCookie } from '@/lib/cookies';

type Channel = {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_names?: {
    clean: string;
    location: string;
    real: string;
  };
  channel_number: string | number | null;
  chlogo: string;
  channel_group: string;
  channel_url: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  other_data: {
    channel_type: string;
    channel_specs: string;
    channel_name_group?: string;
  };
  program_count: number;
};

type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
};

type ViewMode = 'card' | 'table';
type SortField = 'name' | 'number' | 'group' | 'program_count';
type SortDirection = 'asc' | 'desc';
type GroupBy =
  | 'none'
  | 'channel_group'
  | 'channel_type'
  | 'channel_name_group'
  | 'channel_specs';

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

function FilterSection({
  title,
  options,
  filters,
  onFilterChange,
  counts,
}: {
  title: string;
  options: string[];
  filters: string[];
  onFilterChange: (value: string) => void;
  counts: Record<string, number>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter options to only include those with counts > 0 or those already selected
  const availableOptions = useMemo(() => {
    return options.filter(
      option =>
        filters.includes(option) || // Always show selected options
        counts[option] > 0, // Only show options with counts > 0
    );
  }, [options, counts, filters]);

  // Calculate total available options for display
  const totalAvailableOptions = useMemo(() => {
    return options.filter(
      option => counts[option] > 0 || filters.includes(option),
    ).length;
  }, [options, counts, filters]);

  return (
    <div className="border-b">
      <div
        className="hover:bg-muted/10 flex w-full cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {totalAvailableOptions}
          </span>
          {isOpen ? (
            <ChevronUp className="text-muted-foreground size-4" />
          ) : (
            <ChevronDown className="text-muted-foreground size-4" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="thin-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-1">
            {availableOptions.length > 0 ? (
              availableOptions.map(option => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center justify-between py-1"
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={filters.includes(option)}
                      onCheckedChange={() => onFilterChange(option)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {counts[option]}
                  </span>
                </label>
              ))
            ) : (
              <div className="text-muted-foreground py-2 text-center text-sm">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelListContent() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>('xmlepg_FTASYD');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedNameGroups, setSelectedNameGroups] = useState<string[]>([]);
  const [hideNoPrograms, setHideNoPrograms] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [columnVisibility, setColumnVisibility] = useState({
    logo: true,
    number: true,
    name: true,
    group: true,
    type: true,
    specs: true,
    nameGroup: true,
    programs: true,
    actions: true,
  });

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource =
        (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/channels/${storedDataSource}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setChannels(data.data.channels);
      setFilteredChannels(data.data.channels);
    } catch (error) {
      setError('Failed to fetch channels');
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    const filtered = channels.filter(
      channel =>
        ((channel.channel_names?.real || channel.channel_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          (typeof channel.channel_number === 'string' &&
            channel.channel_number.includes(searchTerm))) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group,
            ))) &&
        (!hideNoPrograms || channel.program_count > 0),
    );
    const sorted = sortChannels(filtered, sortField, sortDirection);
    setFilteredChannels(sorted);
  }, [
    searchTerm,
    channels,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    sortField,
    sortDirection,
  ]);

  const handleRefresh = () => {
    fetchChannels();
  };

  const handleGroupFilter = (group: string) => {
    setSelectedGroups(previous =>
      previous.includes(group)
        ? previous.filter(g => g !== group)
        : [...previous, group],
    );
  };

  const handleTypeFilter = (type: string) => {
    setSelectedTypes(previous =>
      previous.includes(type)
        ? previous.filter(t => t !== type)
        : [...previous, type],
    );
  };

  const handleSpecsFilter = (specs: string) => {
    setSelectedSpecs(previous =>
      previous.includes(specs)
        ? previous.filter(s => s !== specs)
        : [...previous, specs],
    );
  };

  const handleNameGroupFilter = (nameGroup: string) => {
    setSelectedNameGroups(previous =>
      previous.includes(nameGroup)
        ? previous.filter(ng => ng !== nameGroup)
        : [...previous, nameGroup],
    );
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortChannels = (
    channels: Channel[],
    field: SortField,
    direction: SortDirection,
  ) => {
    return [...channels].sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name': {
          const aName = a.channel_names?.real || a.channel_name || '';
          const bName = b.channel_names?.real || b.channel_name || '';
          comparison = aName.localeCompare(bName);
          break;
        }
        case 'number': {
          const aNumber =
            Number.parseInt(String(a.channel_number), 10) ||
            Number.POSITIVE_INFINITY;
          const bNumber =
            Number.parseInt(String(b.channel_number), 10) ||
            Number.POSITIVE_INFINITY;
          comparison = aNumber - bNumber;
          break;
        }
        case 'group': {
          const aGroup = a.channel_group || '';
          const bGroup = b.channel_group || '';
          comparison = aGroup.localeCompare(bGroup);
          break;
        }
        case 'program_count': {
          const aCount = a.program_count || 0;
          const bCount = b.program_count || 0;
          comparison = aCount - bCount;
          break;
        }
      }
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const uniqueGroups = useMemo(
    () => [...new Set(channels.map(channel => channel.channel_group))].sort(),
    [channels],
  );

  const uniqueTypes = useMemo(
    () =>
      [
        ...new Set(channels.map(channel => channel.other_data.channel_type)),
      ].sort(),
    [channels],
  );

  const uniqueSpecs = useMemo(
    () =>
      [
        ...new Set(channels.map(channel => channel.other_data.channel_specs)),
      ].sort(),
    [channels],
  );

  const uniqueNameGroups = useMemo(
    () =>
      [
        ...new Set(
          channels
            .map(channel => channel.other_data.channel_name_group)
            .filter((group): group is string => group !== undefined),
        ),
      ].sort(),
    [channels],
  );

  const hasNameGroups = uniqueNameGroups.length > 0;

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedGroups([]);
    setSelectedTypes([]);
    setSelectedSpecs([]);
    setSelectedNameGroups([]);
    setHideNoPrograms(false);
  }, []);

  // Calculate counts for each filter option
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes group filter
    const filterWithoutGroup = (channel: Channel) =>
      (selectedTypes.length === 0 ||
        selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedSpecs.length === 0 ||
        selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (selectedNameGroups.length === 0 ||
        (channel.other_data.channel_name_group &&
          selectedNameGroups.includes(
            channel.other_data.channel_name_group,
          ))) &&
      (!hideNoPrograms || channel.program_count > 0) &&
      (searchTerm === '' ||
        (channel.channel_names?.real || channel.channel_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (typeof channel.channel_number === 'string' &&
          channel.channel_number.includes(searchTerm)));

    // Count only channels that match all other filters
    uniqueGroups.forEach(group => {
      counts[group] = channels.filter(
        c => c.channel_group === group && filterWithoutGroup(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    uniqueGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    searchTerm,
  ]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes type filter
    const filterWithoutType = (channel: Channel) =>
      (selectedGroups.length === 0 ||
        selectedGroups.includes(channel.channel_group)) &&
      (selectedSpecs.length === 0 ||
        selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (selectedNameGroups.length === 0 ||
        (channel.other_data.channel_name_group &&
          selectedNameGroups.includes(
            channel.other_data.channel_name_group,
          ))) &&
      (!hideNoPrograms || channel.program_count > 0) &&
      (searchTerm === '' ||
        (channel.channel_names?.real || channel.channel_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (typeof channel.channel_number === 'string' &&
          channel.channel_number.includes(searchTerm)));

    // Count only channels that match all other filters
    uniqueTypes.forEach(type => {
      counts[type] = channels.filter(
        c => c.other_data.channel_type === type && filterWithoutType(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    uniqueTypes,
    selectedGroups,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    searchTerm,
  ]);

  const specsCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes specs filter
    const filterWithoutSpecs = (channel: Channel) =>
      (selectedGroups.length === 0 ||
        selectedGroups.includes(channel.channel_group)) &&
      (selectedTypes.length === 0 ||
        selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedNameGroups.length === 0 ||
        (channel.other_data.channel_name_group &&
          selectedNameGroups.includes(
            channel.other_data.channel_name_group,
          ))) &&
      (!hideNoPrograms || channel.program_count > 0) &&
      (searchTerm === '' ||
        (channel.channel_names?.real || channel.channel_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (typeof channel.channel_number === 'string' &&
          channel.channel_number.includes(searchTerm)));

    // Count only channels that match all other filters
    uniqueSpecs.forEach(spec => {
      counts[spec] = channels.filter(
        c => c.other_data.channel_specs === spec && filterWithoutSpecs(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    uniqueSpecs,
    selectedGroups,
    selectedTypes,
    selectedNameGroups,
    hideNoPrograms,
    searchTerm,
  ]);

  const nameGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes name group filter
    const filterWithoutNameGroup = (channel: Channel) =>
      (selectedGroups.length === 0 ||
        selectedGroups.includes(channel.channel_group)) &&
      (selectedTypes.length === 0 ||
        selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedSpecs.length === 0 ||
        selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (!hideNoPrograms || channel.program_count > 0) &&
      (searchTerm === '' ||
        (channel.channel_names?.real || channel.channel_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (typeof channel.channel_number === 'string' &&
          channel.channel_number.includes(searchTerm)));

    // Count only channels that match all other filters
    uniqueNameGroups.forEach(nameGroup => {
      counts[nameGroup] = channels.filter(
        c =>
          c.other_data.channel_name_group === nameGroup &&
          filterWithoutNameGroup(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    uniqueNameGroups,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    hideNoPrograms,
    searchTerm,
  ]);

  // Column display names mapping for the visibility dropdown
  const columnDisplayNames = {
    logo: 'Logo',
    number: 'Ch No',
    name: 'Channel Name',
    group: 'Channel Operator',
    type: 'Channel Type',
    specs: 'Specs',
    nameGroup: 'Name Group',
    programs: 'Programs',
    actions: 'Actions',
  };

  const ChannelCard = ({
    channel,
    index,
  }: {
    channel: Channel;
    index: number;
  }) => (
    <Link
      href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
      passHref
      className="focus:ring-primary focus:ring-2 focus:outline-hidden"
    >
      <Card
        className={`flex h-full flex-row items-center space-x-4 rounded-lg border p-3 shadow-sm transition-shadow duration-300 hover:shadow-lg ${
          channel.program_count === 0 ? 'bg-muted grayscale' : 'bg-card'
        }`}
      >
        <div className="flex size-16 shrink-0 items-center justify-center">
          <img
            src={channel.channel_logo.light || '/placeholder.svg'}
            alt={decodeHtml(
              channel.channel_names?.real || channel.channel_name || '',
            )}
            width="100"
            height="100"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-bold">
            {decodeHtml(
              channel.channel_names?.real || channel.channel_name || '',
            )}
          </p>
          {typeof channel.channel_number === 'string' &&
            channel.channel_number !== 'N/A' && (
              <p className="text-primary text-xs font-semibold">
                Channel {channel.channel_number}
              </p>
            )}
          {channel.channel_group &&
            channel.channel_group !== 'N/A' &&
            channel.channel_group.toLowerCase() !== 'unknown' && (
              <p className="text-primary text-xs font-semibold">
                {channel.channel_group}
              </p>
            )}
          {channel.other_data &&
            channel.other_data.channel_specs !== 'N/A' &&
            channel.other_data.channel_type !== 'N/A' && (
              <p className="text-muted-foreground text-xs">
                {channel.other_data.channel_specs},{' '}
                {channel.other_data.channel_type}
              </p>
            )}
        </div>
      </Card>
    </Link>
  );

  const CardView = () => {
    if (groupBy === 'none') {
      return (
        <div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredChannels.map((channel, index) => (
              <ChannelCard
                key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
                channel={channel}
                index={index}
              />
            ))}
          </div>
          <div className="size-16"></div>
        </div>
      );
    } else {
      const groupedChannels: { [key: string]: Channel[] } = {};
      filteredChannels.forEach(channel => {
        let groupKey;
        switch (groupBy) {
          case 'channel_group': {
            groupKey = channel.channel_group;
            break;
          }
          case 'channel_type': {
            groupKey = channel.other_data.channel_type;
            break;
          }
          case 'channel_name_group': {
            groupKey = channel.other_data.channel_name_group || 'Ungrouped';
            break;
          }
          case 'channel_specs': {
            groupKey = channel.other_data.channel_specs;
            break;
          }
          default: {
            groupKey = 'Unknown';
          }
        }
        if (groupKey !== 'N/A') {
          if (!groupedChannels[groupKey]) {
            groupedChannels[groupKey] = [];
          }
          groupedChannels[groupKey].push(channel);
        }
      });

      const sortedGroups = Object.keys(groupedChannels).sort();

      return (
        <div className="space-y-4">
          {sortedGroups.map(group => (
            <div key={group}>
              <h2 className="mb-4 text-2xl font-bold">{group}</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {groupedChannels[group].map((channel, index) => (
                  <ChannelCard
                    key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
                    channel={channel}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const TableView = () => (
    <div className="w-full">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-20 shadow-xs">
          <TableRow>
            {columnVisibility.logo && (
              <TableHead className="w-[100px]">Logo</TableHead>
            )}
            {columnVisibility.number && (
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('number')}
                  className="hover:bg-accent hover:text-accent-foreground flex items-center p-0 font-medium"
                >
                  Ch No
                  {sortField === 'number' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="ml-2 size-4" />
                    ) : (
                      <ChevronDown className="ml-2 size-4" />
                    ))}
                </Button>
              </TableHead>
            )}
            {columnVisibility.name && (
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="hover:bg-accent hover:text-accent-foreground flex items-center p-0 font-medium"
                >
                  Channel Name
                  {sortField === 'name' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="ml-2 size-4" />
                    ) : (
                      <ChevronDown className="ml-2 size-4" />
                    ))}
                </Button>
              </TableHead>
            )}
            {columnVisibility.group && (
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('group')}
                  className="hover:bg-accent hover:text-accent-foreground flex items-center p-0 font-medium"
                >
                  Channel Operator
                  {sortField === 'group' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="ml-2 size-4" />
                    ) : (
                      <ChevronDown className="ml-2 size-4" />
                    ))}
                </Button>
              </TableHead>
            )}
            {columnVisibility.type && <TableHead>Channel Type</TableHead>}
            {columnVisibility.specs && <TableHead>Specs</TableHead>}
            {hasNameGroups && columnVisibility.nameGroup && (
              <TableHead>Name Group</TableHead>
            )}
            {columnVisibility.programs && (
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('program_count')}
                  className="hover:bg-accent hover:text-accent-foreground flex items-center p-0 font-medium"
                >
                  Programs
                  {sortField === 'program_count' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="ml-2 size-4" />
                    ) : (
                      <ChevronDown className="ml-2 size-4" />
                    ))}
                </Button>
              </TableHead>
            )}
            {columnVisibility.actions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChannels.map((channel, index) => (
            <TableRow
              key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
              className="hover:bg-muted/50"
            >
              {columnVisibility.logo && (
                <TableCell>
                  {channel.chlogo === 'N/A' ? (
                    <div className="bg-muted flex size-12 items-center justify-center rounded-md">
                      <span className="text-muted-foreground text-xs">
                        No logo
                      </span>
                    </div>
                  ) : (
                    <div>
                      <img
                        className="block size-12 max-h-full object-contain dark:hidden"
                        src={channel.channel_logo.light || '/placeholder.svg'}
                        alt={decodeHtml(
                          channel.channel_names?.real ||
                            channel.channel_name ||
                            '',
                        )}
                      />
                      <img
                        className="hidden size-12 max-h-full object-contain dark:block"
                        src={channel.channel_logo.dark || '/placeholder.svg'}
                        alt={decodeHtml(
                          channel.channel_names?.real ||
                            channel.channel_name ||
                            '',
                        )}
                      />
                    </div>
                  )}
                </TableCell>
              )}
              {columnVisibility.number && (
                <TableCell>
                  <Badge variant="secondary">
                    {typeof channel.channel_number === 'string' &&
                    channel.channel_number !== 'N/A'
                      ? channel.channel_number
                      : '-'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.name && (
                <TableCell>
                  {decodeHtml(
                    channel.channel_names?.real || channel.channel_name || '',
                  )}
                </TableCell>
              )}
              {columnVisibility.group && (
                <TableCell>
                  <Badge variant="secondary" className="mr-2">
                    {channel.channel_group === 'N/A'
                      ? '-'
                      : channel.channel_group}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.type && (
                <TableCell>
                  <Badge variant="secondary" className="mr-2">
                    {channel.other_data.channel_type === 'N/A'
                      ? '-'
                      : channel.other_data.channel_type}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.specs && (
                <TableCell>
                  <Badge variant="secondary" className="mr-2">
                    {channel.other_data.channel_specs === 'N/A'
                      ? '-'
                      : channel.other_data.channel_specs}
                  </Badge>
                </TableCell>
              )}
              {hasNameGroups && columnVisibility.nameGroup && (
                <TableCell>
                  <Badge variant="secondary" className="mr-2">
                    {channel.other_data.channel_name_group || '-'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.programs && (
                <TableCell>
                  <Badge variant="secondary" className="mr-2">
                    {typeof channel.program_count === 'number'
                      ? channel.program_count.toString()
                      : '-'}
                  </Badge>
                </TableCell>
              )}
              {columnVisibility.actions && (
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
                      className="hover:text-primary inline-flex items-center font-medium"
                    >
                      View
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with filters - fixed */}
        <div className="bg-background w-64 shrink-0 flex-col overflow-hidden border-r">
          {/* Search input */}
          <div className="border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
                aria-label="Search channels"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-7 w-7 p-0"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filter sections */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="thin-scrollbar h-full">
              {/* Options section */}
              <div className="border-b">
                <div className="hover:bg-muted/10 flex w-full cursor-pointer items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Options</span>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <label className="flex cursor-pointer items-center py-1">
                    <div className="flex items-center">
                      <Checkbox
                        id="hide-no-programs"
                        checked={hideNoPrograms}
                        onCheckedChange={checked =>
                          setHideNoPrograms(checked as boolean)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">
                        Hide channels with no programs
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <FilterSection
                title="Channel Groups"
                options={uniqueGroups}
                filters={selectedGroups}
                onFilterChange={handleGroupFilter}
                counts={groupCounts}
              />

              <FilterSection
                title="Channel Types"
                options={uniqueTypes}
                filters={selectedTypes}
                onFilterChange={handleTypeFilter}
                counts={typeCounts}
              />

              <FilterSection
                title="Channel Specs"
                options={uniqueSpecs}
                filters={selectedSpecs}
                onFilterChange={handleSpecsFilter}
                counts={specsCounts}
              />

              {hasNameGroups && (
                <FilterSection
                  title="Name Groups"
                  options={uniqueNameGroups}
                  filters={selectedNameGroups}
                  onFilterChange={handleNameGroupFilter}
                  counts={nameGroupCounts}
                />
              )}
            </ScrollArea>
          </div>

          {/* Footer with clear filters button */}
          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full text-xs"
            >
              Clear All Filters
            </Button>
            <div className="text-muted-foreground mt-2 text-center text-xs">
              Showing {filteredChannels.length} of {channels.length} channels
            </div>
          </div>
        </div>

        {/* Main content - only table scrolls */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Table header - fixed */}
          <div className="bg-background flex w-full items-center justify-between border-b p-2">
            <div className="flex items-center space-x-2">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={value => value && setViewMode(value as ViewMode)}
              >
                <ToggleGroupItem value="card" aria-label="Card view">
                  <LayoutGrid className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table view">
                  <List className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              {viewMode === 'card' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="sm:w-auto">
                      {groupBy === 'none'
                        ? 'Group By'
                        : `By ${
                            groupBy === 'channel_group'
                              ? 'Group'
                              : groupBy === 'channel_type'
                                ? 'Type'
                                : groupBy === 'channel_specs'
                                  ? 'Specs'
                                  : 'Name Group'
                          }`}
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setGroupBy('none')}>
                      No Grouping
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setGroupBy('channel_group')}
                    >
                      Group
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setGroupBy('channel_type')}
                    >
                      Type
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setGroupBy('channel_specs')}
                    >
                      Specs
                    </DropdownMenuItem>
                    {hasNameGroups && (
                      <DropdownMenuItem
                        onSelect={() => setGroupBy('channel_name_group')}
                      >
                        Name Group
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {viewMode === 'table' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Sliders className="h-4 w-4" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(columnDisplayNames).map(([key, value]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        className="capitalize"
                        checked={
                          columnVisibility[key as keyof typeof columnVisibility]
                        }
                        onCheckedChange={checked =>
                          setColumnVisibility(prev => ({
                            ...prev,
                            [key]: checked,
                          }))
                        }
                      >
                        {value}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table content - scrollable */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : viewMode === 'card' ? (
                <CardView />
              ) : (
                <TableView />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChannelListPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ChannelListContent />
    </div>
  );
}
