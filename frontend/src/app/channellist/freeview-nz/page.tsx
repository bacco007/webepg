'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Menu,
  RefreshCw,
  RotateCw,
  Search,
  Sliders,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';

interface Channel {
  channel_number: string;
  channel_name: string;
  channel_names: {
    real: string;
  };
  channel_group: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  other_data: {
    channel_type: string;
    channel_specs: string;
  };
  channel_slug: string;
}

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

// Create a reusable sidebar content component to avoid duplication
function SidebarContent({
  globalFilter,
  setGlobalFilter,
  channelTypes,
  selectedTypes,
  channelGroups,
  selectedGroups,
  channelSpecs,
  selectedSpecs,
  handleFilterChange,
  typeCounts,
  groupCounts,
  specsCounts,
  clearFilters,
  filteredCount,
  totalCount,
}: {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  channelTypes: string[];
  selectedTypes: string[];
  channelGroups: string[];
  selectedGroups: string[];
  channelSpecs: string[];
  selectedSpecs: string[];
  handleFilterChange: (
    filterType: 'type' | 'group' | 'specs',
    value: string,
  ) => void;
  typeCounts: Record<string, number>;
  groupCounts: Record<string, number>;
  specsCounts: Record<string, number>;
  clearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <>
      <div className="border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
          <Input
            placeholder="Search channels..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8 text-sm"
            aria-label="Search channels"
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-7 w-7 p-0"
              onClick={() => setGlobalFilter('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="thin-scrollbar h-full">
          <FilterSection
            title="Channel Type"
            options={channelTypes}
            filters={selectedTypes}
            onFilterChange={value => handleFilterChange('type', value)}
            counts={typeCounts}
          />

          <FilterSection
            title="Channel Operator"
            options={channelGroups}
            filters={selectedGroups}
            onFilterChange={value => handleFilterChange('group', value)}
            counts={groupCounts}
          />

          <FilterSection
            title="Channel Specs"
            options={channelSpecs}
            filters={selectedSpecs}
            onFilterChange={value => handleFilterChange('specs', value)}
            counts={specsCounts}
          />
        </ScrollArea>
      </div>

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
          Showing {filteredCount} of {totalCount} channels
        </div>
      </div>
    </>
  );
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'channel_number', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedGlobalSearch = useDebounce(globalFilter, 300);

  // Fetch data only once on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/py/channels/nzxmltv_freeview');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setChannels(data.data.channels);
        setTotalCount(data.data.channels.length);
        setIsLoading(false);
      } catch {
        setError('Error loading channels');
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Memoize unique values for filters to prevent recalculation
  const channelTypes = useMemo(
    () => [...new Set(channels.map(c => c.other_data.channel_type))].sort(),
    [channels],
  );

  const channelGroups = useMemo(
    () => [...new Set(channels.map(c => c.channel_group))].sort(),
    [channels],
  );

  const channelSpecs = useMemo(
    () => [...new Set(channels.map(c => c.other_data.channel_specs))].sort(),
    [channels],
  );

  // Column display names mapping
  const columnDisplayNames = {
    channel_number: 'Ch No',
    'channel_names.real': 'EPG Name',
    channel_logo: 'Logo',
    channel_name: 'Channel Name',
    channel_group: 'Channel Operator',
    'other_data.channel_type': 'Channel Type',
    'other_data.channel_specs': 'Specs',
  };

  // Memoize columns definition to prevent recreation on each render
  const columns = useMemo<ColumnDef<Channel>[]>(
    () => [
      {
        accessorKey: 'channel_number',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex w-full items-center justify-center gap-1 p-0 font-medium"
          >
            Ch No
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.getValue('channel_number')}
          </div>
        ),
        sortingFn: (a, b) =>
          Number.parseInt(a.getValue('channel_number')) -
          Number.parseInt(b.getValue('channel_number')),
      },
      {
        accessorKey: 'channel_names.real',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0 font-medium"
            >
              EPG Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.original.channel_names.real}</div>
        ),
      },
      {
        accessorKey: 'channel_logo',
        header: () => <div className="text-center">Logo</div>,
        cell: ({ row }) => (
          <div className="bg-muted/50 mx-auto flex size-12 items-center justify-center rounded-md p-1">
            {row.original.channel_logo.light ? (
              <img
                src={row.original.channel_logo.light || '/placeholder.svg'}
                alt={`${row.original.channel_name} logo`}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
                onError={e => {
                  e.currentTarget.src = '/placeholder.svg?height=40&width=40';
                }}
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                No logo
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'channel_name',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0 font-medium"
            >
              Channel Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="hover:text-primary text-center font-bold hover:underline">
            <Link href={`/channel/${row.original.channel_slug}`}>
              {row.getValue('channel_name')}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'channel_group',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0 font-medium"
            >
              Channel Operator
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue('channel_group')}</div>
        ),
      },
      {
        accessorKey: 'other_data.channel_type',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0 font-medium"
            >
              Channel Type
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="outline" className="font-normal">
              {row.original.other_data.channel_type}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'other_data.channel_specs',
        header: ({ column }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0 font-medium"
            >
              Specs
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="secondary">
              {row.original.other_data.channel_specs}
            </Badge>
          </div>
        ),
      },
    ],
    [],
  );

  // Apply filters in a memoized function to prevent recalculation
  const filteredData = useMemo(() => {
    return channels.filter(channel => {
      // Apply type filter
      if (
        selectedTypes.length > 0 &&
        !selectedTypes.includes(channel.other_data.channel_type)
      ) {
        return false;
      }

      // Apply group filter
      if (
        selectedGroups.length > 0 &&
        !selectedGroups.includes(channel.channel_group)
      ) {
        return false;
      }

      // Apply specs filter
      if (
        selectedSpecs.length > 0 &&
        !selectedSpecs.includes(channel.other_data.channel_specs)
      ) {
        return false;
      }

      // Apply global filter (search)
      if (debouncedGlobalSearch) {
        const searchTerm = debouncedGlobalSearch.toLowerCase();
        return (
          channel.channel_name.toLowerCase().includes(searchTerm) ||
          channel.channel_names.real.toLowerCase().includes(searchTerm) ||
          channel.channel_number.toLowerCase().includes(searchTerm) ||
          channel.channel_group.toLowerCase().includes(searchTerm) ||
          channel.other_data.channel_type.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }, [
    channels,
    selectedTypes,
    selectedGroups,
    selectedSpecs,
    debouncedGlobalSearch,
  ]);

  // Calculate counts for each filter option
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes type filter
    const filterWithoutType = (channel: Channel) =>
      (selectedGroups.length === 0 ||
        selectedGroups.includes(channel.channel_group)) &&
      (selectedSpecs.length === 0 ||
        selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (debouncedGlobalSearch === '' ||
        channel.channel_name
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_names.real
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_number
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_group
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.other_data.channel_type
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()));

    // Count only channels that match all other filters
    channelTypes.forEach(type => {
      counts[type] = channels.filter(
        c => c.other_data.channel_type === type && filterWithoutType(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    channelTypes,
    selectedGroups,
    selectedSpecs,
    debouncedGlobalSearch,
  ]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes group filter
    const filterWithoutGroup = (channel: Channel) =>
      (selectedTypes.length === 0 ||
        selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedSpecs.length === 0 ||
        selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (debouncedGlobalSearch === '' ||
        channel.channel_name
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_names.real
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_number
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_group
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.other_data.channel_type
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()));

    // Count only channels that match all other filters
    channelGroups.forEach(group => {
      counts[group] = channels.filter(
        c => c.channel_group === group && filterWithoutGroup(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    channelGroups,
    selectedTypes,
    selectedSpecs,
    debouncedGlobalSearch,
  ]);

  const specsCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Create a version of the filter function that excludes specs filter
    const filterWithoutSpecs = (channel: Channel) =>
      (selectedTypes.length === 0 ||
        selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedGroups.length === 0 ||
        selectedGroups.includes(channel.channel_group)) &&
      (debouncedGlobalSearch === '' ||
        channel.channel_name
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_names.real
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_number
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_group
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.other_data.channel_type
          .toLowerCase()
          .includes(debouncedGlobalSearch.toLowerCase()));

    // Count only channels that match all other filters
    channelSpecs.forEach(spec => {
      counts[spec] = channels.filter(
        c => c.other_data.channel_specs === spec && filterWithoutSpecs(c),
      ).length;
    });

    return counts;
  }, [
    channels,
    channelSpecs,
    selectedTypes,
    selectedGroups,
    debouncedGlobalSearch,
  ]);

  // Create table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: debouncedGlobalSearch,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Memoize the filtered count
  const filteredCount = useMemo(() => filteredData.length, [filteredData]);

  // Handle refresh with useCallback to prevent recreation
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/py/channels/nzxmltv_freeview');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setChannels(data.data.channels);
      setTotalCount(data.data.channels.length);
    } catch {
      setError('Error refreshing channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear filters with useCallback
  const clearFilters = useCallback(() => {
    setGlobalFilter('');
    setSelectedTypes([]);
    setSelectedGroups([]);
    setSelectedSpecs([]);
    setColumnFilters([]);
  }, []);

  // Handle filter changes
  const handleFilterChange = (
    filterType: 'type' | 'group' | 'specs',
    value: string,
  ) => {
    switch (filterType) {
      case 'type': {
        setSelectedTypes(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
      case 'group': {
        setSelectedGroups(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
      case 'specs': {
        setSelectedSpecs(previous =>
          previous.includes(value)
            ? previous.filter(v => v !== value)
            : [...previous, value],
        );
        break;
      }
    }
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-6">
          <h2 className="text-destructive mb-4 text-xl font-bold">Error</h2>
          <p>{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="bg-background hidden w-64 shrink-0 flex-col overflow-hidden border-r lg:flex">
        <SidebarContent
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          channelTypes={channelTypes}
          selectedTypes={selectedTypes}
          channelGroups={channelGroups}
          selectedGroups={selectedGroups}
          channelSpecs={channelSpecs}
          selectedSpecs={selectedSpecs}
          handleFilterChange={handleFilterChange}
          typeCounts={typeCounts}
          groupCounts={groupCounts}
          specsCounts={specsCounts}
          clearFilters={clearFilters}
          filteredCount={filteredCount}
          totalCount={totalCount}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Banner with mobile sidebar trigger and controls */}
        <div className="bg-background flex items-center justify-between border-b p-2">
          <div className="flex items-center space-x-2">
            {/* Mobile sidebar trigger - only visible on small screens */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="mr-2 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent
                  globalFilter={globalFilter}
                  setGlobalFilter={setGlobalFilter}
                  channelTypes={channelTypes}
                  selectedTypes={selectedTypes}
                  channelGroups={channelGroups}
                  selectedGroups={selectedGroups}
                  channelSpecs={channelSpecs}
                  selectedSpecs={selectedSpecs}
                  handleFilterChange={handleFilterChange}
                  typeCounts={typeCounts}
                  groupCounts={groupCounts}
                  specsCounts={specsCounts}
                  clearFilters={clearFilters}
                  filteredCount={filteredCount}
                  totalCount={totalCount}
                />
              </SheetContent>
            </Sheet>
            <span className="text-lg font-medium">Freeview (NZ) Channels</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search channels..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-[200px]"
            />
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Sliders className="h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => {
                    // Use a proper lookup instead of direct access to handle keys with dots
                    const displayName =
                      Object.entries(columnDisplayNames).find(
                        ([key]) => key === column.id,
                      )?.[1] || column.id;

                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {displayName}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table content - scrollable */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-20 shadow-sm">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
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
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column, cellIndex) => (
                      <TableCell key={cellIndex} className="p-2">
                        <Skeleton
                          className={`h-8 w-full ${cellIndex === 2 ? 'h-12' : ''}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
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
    </div>
  );
}
