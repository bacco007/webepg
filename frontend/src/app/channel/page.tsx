'use client';

import React from 'react';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  RefreshCw,
  Sliders,
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
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from '@/components/layouts/sidebar-layout';
import { compareLCN } from '@/utils/sort';
import LoadingState from '@/components/LoadingState';

// Define types for better type safety
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

// Extract FilterSection into a separate component
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
        className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {totalAvailableOptions}
          </span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="space-y-1 pr-1 max-h-[200px] overflow-y-auto thin-scrollbar">
            {availableOptions.length > 0 ? (
              availableOptions.map(option => (
                <label
                  key={option}
                  className="flex justify-between items-center py-1 cursor-pointer"
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
              <div className="py-2 text-muted-foreground text-sm text-center">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Extract ChannelCard into a separate component
function ChannelCard({
  channel,
  index,
  xmltvDataSource,
}: {
  channel: Channel;
  index: number;
  xmltvDataSource: string;
}) {
  return (
    <Link
      href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
      passHref
      className="focus:outline-hidden focus:ring-2 focus:ring-primary h-full"
    >
      <Card
        className={`flex h-full flex-col rounded-lg border p-3 shadow-sm transition-shadow duration-300 hover:shadow-lg ${
          channel.program_count === 0 ? 'bg-muted grayscale' : 'bg-card'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="flex justify-center items-center size-16 shrink-0">
            <img
              src={channel.channel_logo.light || '/placeholder.svg'}
              alt={decodeHtml(
                channel.channel_names?.real || channel.channel_name || '',
              )}
              width="100"
              height="100"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col flex-1">
            <p className="font-bold text-sm">
              {decodeHtml(
                channel.channel_names?.real || channel.channel_name || '',
              )}
            </p>
            {typeof channel.channel_number === 'string' &&
              channel.channel_number !== 'N/A' && (
                <p className="font-semibold text-primary text-xs">
                  Channel {channel.channel_number}
                </p>
              )}
            {channel.channel_group &&
              channel.channel_group !== 'N/A' &&
              channel.channel_group.toLowerCase() !== 'unknown' && (
                <p className="font-semibold text-primary text-xs">
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
        </div>
      </Card>
    </Link>
  );
}

// Extract CardView into a separate component
function CardView({
  filteredChannels,
  groupBy,
  xmltvDataSource,
}: {
  filteredChannels: Channel[];
  groupBy: GroupBy;
  xmltvDataSource: string;
}) {
  // Sort channels by channel number first, then by name
  const sortedChannels = [...filteredChannels].sort((a, b) => {
    const aNum = typeof a.channel_number === 'string' ? a.channel_number : '';
    const bNum = typeof b.channel_number === 'string' ? b.channel_number : '';
    return compareLCN(aNum, bNum);
  });

  if (groupBy === 'none') {
    return (
      <div>
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 xl:grid-cols-4">
          {sortedChannels.map((channel, index) => (
            <ChannelCard
              key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
              channel={channel}
              index={index}
              xmltvDataSource={xmltvDataSource}
            />
          ))}
        </div>
      </div>
    );
  } else {
    const groupedChannels: { [key: string]: Channel[] } = {};
    sortedChannels.forEach(channel => {
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
      <div className="space-y-8">
        {sortedGroups.map(group => (
          <div key={group}>
            <h2 className="mb-4 font-bold text-2xl">{group}</h2>
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 xl:grid-cols-4">
              {groupedChannels[group].map((channel, index) => (
                <ChannelCard
                  key={`${channel.channel_slug}-${channel.channel_number}-${channel.channel_names?.location}-${index}`}
                  channel={channel}
                  index={index}
                  xmltvDataSource={xmltvDataSource}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

// Add a loading skeleton for the card view
function CardViewSkeleton() {
  return (
    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <Card key={index} className="p-3 h-[100px]">
          <div className="flex items-center space-x-4">
            <Skeleton className="rounded-md size-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-3" />
              <Skeleton className="w-2/3 h-3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Also update the TableViewSkeleton to match the new column order
function TableViewSkeleton() {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="w-16 h-6" />
            </TableHead>
            <TableHead className="w-[100px]">
              <Skeleton className="w-16 h-6" />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <Skeleton className="w-32 h-6" />
            </TableHead>
            <TableHead>
              <Skeleton className="w-32 h-6" />
            </TableHead>
            <TableHead>
              <Skeleton className="w-24 h-6" />
            </TableHead>
            <TableHead>
              <Skeleton className="w-16 h-6" />
            </TableHead>
            <TableHead>
              <Skeleton className="w-24 h-6" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="ml-auto w-16 h-6" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="w-12 h-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="rounded-md size-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-40 h-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-24 h-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-20 h-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-16 h-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-12 h-6" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto w-16 h-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Create an error boundary component
class ErrorBoundaryComponent extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Define table columns using TanStack Table
function getColumns(
  xmltvDataSource: string,
  hasNameGroups: boolean,
): ColumnDef<Channel>[] {
  return [
    {
      id: 'number',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center hover:bg-accent p-0 font-medium hover:text-accent-foreground"
          >
            Ch No
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 size-4" />
            ) : null}
          </Button>
        );
      },
      accessorFn: row => {
        const num =
          typeof row.channel_number === 'string' ? row.channel_number : '';
        return num !== 'N/A' ? num : '';
      },
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <Badge variant="secondary">
            {typeof channel.channel_number === 'string' &&
            channel.channel_number !== 'N/A'
              ? channel.channel_number
              : '-'}
          </Badge>
        );
      },
      sortingFn: (rowA, rowB, columnId) => {
        const aValue = rowA.getValue(columnId) as string;
        const bValue = rowB.getValue(columnId) as string;

        // Extract numeric parts and check if they're purely numeric
        const aNumMatch = aValue.match(/^(\d+)/);
        const bNumMatch = bValue.match(/^(\d+)/);

        const aIsPureNumeric = aValue !== '' && /^\d+$/.test(aValue);
        const bIsPureNumeric = bValue !== '' && /^\d+$/.test(bValue);

        // Get the numeric values (if they exist)
        const aNum = aNumMatch
          ? Number.parseInt(aNumMatch[1], 10)
          : Number.POSITIVE_INFINITY;
        const bNum = bNumMatch
          ? Number.parseInt(bNumMatch[1], 10)
          : Number.POSITIVE_INFINITY;

        // If numeric parts are different, sort by them
        if (aNum !== bNum) {
          return aNum - bNum;
        }

        // If numeric parts are the same, but one is pure numeric and one has suffix
        if (aIsPureNumeric !== bIsPureNumeric) {
          return aIsPureNumeric ? -1 : 1; // Pure numeric comes first
        }

        // If both have the same numeric part and both have suffixes or both don't
        if (aValue !== bValue) {
          return aValue.localeCompare(bValue);
        }

        return 0;
      },
    },
    {
      id: 'logo',
      header: 'Logo',
      cell: ({ row }) => {
        const channel = row.original;
        return channel.chlogo === 'N/A' ? (
          <div className="flex justify-center items-center bg-muted rounded-md size-12">
            <span className="text-muted-foreground text-xs">No logo</span>
          </div>
        ) : (
          <div>
            <img
              className="dark:hidden block max-h-full size-12 object-contain"
              src={channel.channel_logo.light || '/placeholder.svg'}
              alt={decodeHtml(
                channel.channel_names?.real || channel.channel_name || '',
              )}
            />
            <img
              className="hidden dark:block max-h-full size-12 object-contain"
              src={channel.channel_logo.dark || '/placeholder.svg'}
              alt={decodeHtml(
                channel.channel_names?.real || channel.channel_name || '',
              )}
            />
          </div>
        );
      },
    },
    {
      id: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center hover:bg-accent p-0 font-medium hover:text-accent-foreground"
          >
            Channel Name
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 size-4" />
            ) : null}
          </Button>
        );
      },
      accessorFn: row =>
        decodeHtml(row.channel_names?.real || row.channel_name || ''),
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <div>
            {decodeHtml(
              channel.channel_names?.real || channel.channel_name || '',
            )}
          </div>
        );
      },
    },
    {
      id: 'group',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center hover:bg-accent p-0 font-medium hover:text-accent-foreground"
          >
            Channel Operator
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 size-4" />
            ) : null}
          </Button>
        );
      },
      accessorKey: 'channel_group',
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <Badge variant="secondary" className="mr-2">
            {channel.channel_group === 'N/A' ? '-' : channel.channel_group}
          </Badge>
        );
      },
    },
    {
      id: 'type',
      header: 'Channel Type',
      accessorFn: row => row.other_data.channel_type,
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <Badge variant="secondary" className="mr-2">
            {channel.other_data.channel_type === 'N/A'
              ? '-'
              : channel.other_data.channel_type}
          </Badge>
        );
      },
    },
    {
      id: 'specs',
      header: 'Specs',
      accessorFn: row => row.other_data.channel_specs,
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <Badge variant="secondary" className="mr-2">
            {channel.other_data.channel_specs === 'N/A'
              ? '-'
              : channel.other_data.channel_specs}
          </Badge>
        );
      },
    },
    ...(hasNameGroups
      ? [
          {
            id: 'nameGroup',
            header: 'Name Group',
            accessorFn: row => row.other_data.channel_name_group || '',
            cell: ({ row }) => {
              const channel = row.original;
              return (
                <Badge variant="secondary" className="mr-2">
                  {channel.other_data.channel_name_group || '-'}
                </Badge>
              );
            },
          } as ColumnDef<Channel>,
        ]
      : []),
    {
      id: 'programs',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center hover:bg-accent p-0 font-medium hover:text-accent-foreground"
          >
            Programs
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 size-4" />
            ) : null}
          </Button>
        );
      },
      accessorKey: 'program_count',
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <Badge variant="secondary" className="mr-2">
            {typeof channel.program_count === 'number'
              ? channel.program_count.toString()
              : '-'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <div className="text-right">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
                className="inline-flex items-center font-medium hover:text-primary"
              >
                View
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];
}

// New TableView component using TanStack Table
function TableView({
  filteredChannels,
  xmltvDataSource,
  hasNameGroups,
}: {
  filteredChannels: Channel[];
  xmltvDataSource: string;
  hasNameGroups: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'number', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    number: true,
    logo: true,
    name: true,
    group: true,
    type: true,
    specs: true,
    nameGroup: true,
    programs: true,
    actions: true,
  });

  const columns = useMemo(
    () => getColumns(xmltvDataSource, hasNameGroups),
    [xmltvDataSource, hasNameGroups],
  );

  const table = useReactTable({
    data: filteredChannels,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Sliders className="w-4 h-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id === 'number'
                      ? 'Ch No'
                      : column.id === 'nameGroup'
                        ? 'Name Group'
                        : column.id.charAt(0).toUpperCase() +
                          column.id.slice(1)}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader className="top-0 z-20 sticky bg-muted shadow-xs">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className={header.id === 'logo' ? 'w-[100px]' : ''}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

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
    setFilteredChannels(filtered);
  }, [
    searchTerm,
    channels,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
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
  const { groupCounts, typeCounts, specsCounts, nameGroupCounts } =
    useMemo(() => {
      const groupCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      const specsCounts: Record<string, number> = {};
      const nameGroupCounts: Record<string, number> = {};

      // Create base filter function
      const baseFilter = (channel: Channel) =>
        (!hideNoPrograms || channel.program_count > 0) &&
        (searchTerm === '' ||
          (channel.channel_names?.real || channel.channel_name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (typeof channel.channel_number === 'string' &&
            channel.channel_number.includes(searchTerm)));

      // Create filter functions for each category
      const filterWithoutGroup = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group,
            )));

      const filterWithoutType = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group,
            )));

      const filterWithoutSpecs = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group,
            )));

      const filterWithoutNameGroup = (channel: Channel) =>
        baseFilter(channel) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs));

      // Count channels for each group
      uniqueGroups.forEach(group => {
        groupCounts[group] = channels.filter(
          c => c.channel_group === group && filterWithoutGroup(c),
        ).length;
      });

      uniqueTypes.forEach(type => {
        typeCounts[type] = channels.filter(
          c => c.other_data.channel_type === type && filterWithoutType(c),
        ).length;
      });

      uniqueSpecs.forEach(spec => {
        specsCounts[spec] = channels.filter(
          c => c.other_data.channel_specs === spec && filterWithoutSpecs(c),
        ).length;
      });

      uniqueNameGroups.forEach(nameGroup => {
        nameGroupCounts[nameGroup] = channels.filter(
          c =>
            c.other_data.channel_name_group === nameGroup &&
            filterWithoutNameGroup(c),
        ).length;
      });

      return { groupCounts, typeCounts, specsCounts, nameGroupCounts };
    }, [
      channels,
      uniqueGroups,
      uniqueTypes,
      uniqueSpecs,
      uniqueNameGroups,
      selectedGroups,
      selectedTypes,
      selectedSpecs,
      selectedNameGroups,
      hideNoPrograms,
      searchTerm,
    ]);

  // Define header actions
  const headerActions = (
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
            <DropdownMenuItem onSelect={() => setGroupBy('channel_group')}>
              Group
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGroupBy('channel_type')}>
              Type
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGroupBy('channel_specs')}>
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

      <Button
        onClick={handleRefresh}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search channels..."
        />
      </SidebarHeader>
      <SidebarContent>
        {/* Options section */}
        <div className="border-b">
          <div className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Options</span>
            </div>
          </div>
          <div className="px-4 pb-3">
            <label className="flex items-center py-1 cursor-pointer">
              <div className="flex items-center">
                <Checkbox
                  id="hide-no-programs"
                  checked={hideNoPrograms}
                  onCheckedChange={checked =>
                    setHideNoPrograms(checked as boolean)
                  }
                  className="mr-2"
                />
                <span className="text-sm">Hide channels with no programs</span>
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
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-xs"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredChannels.length} of {channels.length} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
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
    <SidebarLayout
      title="Channel List"
      sidebar={sidebar}
      actions={headerActions}
    >
      <div className="p-4 pb-24">
        {' '}
        {/* Added extra padding at bottom to prevent content being cut off */}
        {loading ? (
          <div className="flex flex-col space-y-4">
            <LoadingState text="Loading channels..." />
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {viewMode === 'card' ? (
              <CardView
                filteredChannels={filteredChannels}
                groupBy={groupBy}
                xmltvDataSource={xmltvDataSource}
              />
            ) : (
              <TableView
                filteredChannels={filteredChannels}
                xmltvDataSource={xmltvDataSource}
                hasNameGroups={hasNameGroups}
              />
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function ChannelListPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <ErrorBoundaryComponent
        fallback={
          <div className="flex justify-center items-center h-full">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="size-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                An error occurred while rendering the channel list. Please try
                refreshing the page.
              </AlertDescription>
              <Button onClick={() => window.location.reload()} className="mt-4">
                <RefreshCw className="mr-2 size-4" />
                Refresh Page
              </Button>
            </Alert>
          </div>
        }
      >
        <Suspense fallback={<LoadingSpinner />}>
          <ChannelListContent />
        </Suspense>
      </ErrorBoundaryComponent>
    </div>
  );
}
