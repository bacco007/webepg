"use client";

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
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Command,
  Filter,
  RefreshCw,
  RotateCw,
  Sliders,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterSection } from "@/components/filter-section";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

// Regex patterns for channel number parsing
const CHANNEL_NUMBER_REGEX = /^(\d+)([a-zA-Z]*)$/;

// Helper function to sort channel numbers properly
function sortChannelNumbers(a: string, b: string): number {
  // Handle edge cases
  if (!(a || b)) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }

  // Handle "N/A" or other non-numeric values
  if (a === "N/A" && b === "N/A") {
    return 0;
  }
  if (a === "N/A") {
    return 1;
  }
  if (b === "N/A") {
    return -1;
  }

  // Extract numeric and alphabetic parts from channel numbers
  const aMatch = a.match(CHANNEL_NUMBER_REGEX);
  const bMatch = b.match(CHANNEL_NUMBER_REGEX);

  // Default values if no match
  const aNum = aMatch
    ? Number.parseInt(aMatch[1], 10)
    : Number.POSITIVE_INFINITY;
  const aLetter = aMatch ? aMatch[2] : "";
  const bNum = bMatch
    ? Number.parseInt(bMatch[1], 10)
    : Number.POSITIVE_INFINITY;
  const bLetter = bMatch ? bMatch[2] : "";

  // First sort by numeric part
  if (aNum !== bNum) {
    return aNum - bNum;
  }

  // Then sort by alphabetic part
  if (aLetter !== bLetter) {
    return aLetter.localeCompare(bLetter);
  }

  // If both parts are the same, sort by the original string
  return a.localeCompare(b);
}

// Helper function to render sorting icons
function getSortingIcon(isSorted: false | "asc" | "desc") {
  if (isSorted === "asc") {
    return <ArrowUp className="h-4 w-4" />;
  }
  if (isSorted === "desc") {
    return <ArrowDown className="h-4 w-4" />;
  }
  return <ArrowUpDown className="h-4 w-4" />;
}

// Define the Channel interface that all pages will use
export interface Channel {
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

// Define the props for the ChannelDataTable component
interface ChannelDataTableProps {
  title: string;
  fetchUrl: string;
  dataExtractor?: (data: unknown) => Channel[];
  initialSorting?: SortingState;
  defaultColumnVisibility?: VisibilityState;
  renderCustomActions?: () => React.ReactNode;
  showChannelTypeFilter?: boolean;
  showChannelGroupFilter?: boolean;
  showChannelSpecsFilter?: boolean;
}

// Default column definitions that will be used across all tables
const defaultColumns: ColumnDef<Channel>[] = [
  {
    accessorKey: "channel_number",
    header: ({ column }) => (
      <Button
        className="flex w-full items-center justify-center gap-1 p-0 font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Ch No
        {getSortingIcon(column.getIsSorted())}
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.getValue("channel_number")}
      </div>
    ),
    sortingFn: (a, b) =>
      sortChannelNumbers(
        a.getValue("channel_number"),
        b.getValue("channel_number")
      ),
  },
  {
    accessorKey: "channel_names.real",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          className="p-0 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          EPG Name
          <span className="ml-2">{getSortingIcon(column.getIsSorted())}</span>
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.original.channel_names.real}</div>
    ),
  },
  {
    accessorKey: "channel_logo",
    header: () => <div className="text-center">Logo</div>,
    cell: ({ row }) => (
      <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted/50 p-1">
        {row.original.channel_logo.light ? (
          <img
            alt={`${row.original.channel_name} logo`}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=40&width=40";
            }}
            src={row.original.channel_logo.light || "/placeholder.svg"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            No logo
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "channel_name",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          className="p-0 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Channel Name
          <span className="ml-2">{getSortingIcon(column.getIsSorted())}</span>
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center font-bold hover:text-primary hover:underline">
        <Link href={`/channel/${row.original.channel_slug}`}>
          {row.getValue("channel_name")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "channel_group",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          className="p-0 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Channel Operator
          <span className="ml-2">{getSortingIcon(column.getIsSorted())}</span>
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("channel_group")}</div>
    ),
  },
  {
    accessorKey: "other_data.channel_type",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          className="p-0 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Channel Type
          <span className="ml-2">{getSortingIcon(column.getIsSorted())}</span>
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Badge className="font-normal" variant="outline">
          {row.original.other_data.channel_type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "other_data.channel_specs",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          className="p-0 font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Specs
          <span className="ml-2">{getSortingIcon(column.getIsSorted())}</span>
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
];

// Column display names mapping
const columnDisplayNames = {
  channel_number: "Ch No",
  "channel_names.real": "EPG Name",
  channel_logo: "Logo",
  channel_name: "Channel Name",
  channel_group: "Channel Operator",
  "other_data.channel_type": "Channel Type",
  "other_data.channel_specs": "Specs",
};

export function ChannelDataTable({
  title,
  fetchUrl,
  dataExtractor = (data: unknown) =>
    (data as { data: { channels: Channel[] } }).data.channels,
  initialSorting = [{ id: "channel_number", desc: false }],
  defaultColumnVisibility = {},
  renderCustomActions,
  showChannelTypeFilter = true,
  showChannelGroupFilter = true,
  showChannelSpecsFilter = true,
}: ChannelDataTableProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    defaultColumnVisibility
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  // Search state for filter sections
  const [typeSearch, setTypeSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [specsSearch, setSpecsSearch] = useState("");

  const debouncedGlobalSearch = useDebounce(globalFilter, 300);

  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useHotkeys("cmd+k,ctrl+k", (e) => {
    e.preventDefault();
    setShowCommandMenu(true);
  });

  useHotkeys("esc", () => {
    setShowCommandMenu(false);
    setSelectedRowIndex(null);
  });

  useHotkeys("up,down", (e) => {
    e.preventDefault();
    if (selectedRowIndex === null) {
      setSelectedRowIndex(0);
      return;
    }

    const newIndex =
      e.key === "ArrowUp"
        ? Math.max(0, selectedRowIndex - 1)
        : Math.min(filteredData.length - 1, selectedRowIndex + 1);

    setSelectedRowIndex(newIndex);

    // Scroll into view
    const row = tableRef.current?.querySelector(
      `[data-row-index="${newIndex}"]`
    );
    row?.scrollIntoView({ block: "nearest" });
  });

  // Memoize unique values for filters to prevent recalculation
  const channelTypes = useMemo(
    () => [...new Set(channels.map((c) => c.other_data.channel_type))].sort(),
    [channels]
  );

  const channelGroups = useMemo(
    () => [...new Set(channels.map((c) => c.channel_group))].sort(),
    [channels]
  );

  const channelSpecs = useMemo(
    () => [...new Set(channels.map((c) => c.other_data.channel_specs))].sort(),
    [channels]
  );

  // Fetch data only once on component mount
  const dataExtractorRef = useRef(dataExtractor);
  dataExtractorRef.current = dataExtractor;

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const extractedChannels = dataExtractorRef.current(data);
      setChannels(extractedChannels);
      setTotalCount(extractedChannels.length);
      setIsLoading(false);
    } catch (_err) {
      setError("Error loading channels");
      setIsLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Apply filters in a memoized function to prevent recalculation
  const filteredData = useMemo(() => {
    return channels.filter((channel) => {
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
      (debouncedGlobalSearch === "" ||
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
    for (const type of channelTypes) {
      counts[type] = channels.filter(
        (c) => c.other_data.channel_type === type && filterWithoutType(c)
      ).length;
    }

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
      (debouncedGlobalSearch === "" ||
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
    for (const group of channelGroups) {
      counts[group] = channels.filter(
        (c) => c.channel_group === group && filterWithoutGroup(c)
      ).length;
    }

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
      (debouncedGlobalSearch === "" ||
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
    for (const spec of channelSpecs) {
      counts[spec] = channels.filter(
        (c) => c.other_data.channel_specs === spec && filterWithoutSpecs(c)
      ).length;
    }

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
    columns: defaultColumns,
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

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filterType: "type" | "group" | "specs", value: string) => {
      switch (filterType) {
        case "type": {
          setSelectedTypes((previous) =>
            previous.includes(value)
              ? previous.filter((v) => v !== value)
              : [...previous, value]
          );
          break;
        }
        case "group": {
          setSelectedGroups((previous) =>
            previous.includes(value)
              ? previous.filter((v) => v !== value)
              : [...previous, value]
          );
          break;
        }
        case "specs": {
          setSelectedSpecs((previous) =>
            previous.includes(value)
              ? previous.filter((v) => v !== value)
              : [...previous, value]
          );
          break;
        }
        default: {
          // No action needed for unknown filter types
          break;
        }
      }
    },
    []
  );

  // Clear filters with useCallback
  const clearFilters = useCallback(() => {
    setGlobalFilter("");
    setSelectedTypes([]);
    setSelectedGroups([]);
    setSelectedSpecs([]);
    setColumnFilters([]);
    setTypeSearch("");
    setGroupSearch("");
    setSpecsSearch("");
  }, []);

  // Render loading skeleton rows
  const renderLoadingRows = () => {
    return Array.from({ length: 10 }).map(() => (
      <tr key={`skeleton-${crypto.randomUUID()}`}>
        {defaultColumns.map((column, columnIndex) => (
          <td className="p-2" key={`skeleton-cell-${column.id || columnIndex}`}>
            <Skeleton
              className={`h-8 w-full ${columnIndex === 2 ? "h-12" : ""}`}
            />
          </td>
        ))}
      </tr>
    ));
  };

  // Render data rows
  const renderDataRows = () => {
    if (!table.getRowModel().rows?.length) {
      return (
        <tr>
          <td className="h-24 text-center" colSpan={defaultColumns.length}>
            <div className="flex flex-col items-center gap-2">
              <p className="text-muted-foreground text-sm">No results found</p>
              <Button onClick={clearFilters} size="sm" variant="outline">
                Clear Filters
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    return table.getRowModel().rows.map((row, index) => (
      <tr
        className={cn(
          "border-b",
          selectedRowIndex === index ? "bg-muted/50" : ""
        )}
        data-row-index={index}
        data-state={row.getIsSelected() && "selected"}
        key={row.id}
      >
        {row.getVisibleCells().map((cell) => (
          <td className="h-10 px-3 text-sm" key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ));
  };

  // Command menu items
  const commandItems = useMemo(() => {
    return [
      {
        heading: "Quick Actions",
        items: [
          {
            name: "Refresh Data",
            icon: RefreshCw,
            action: fetchChannels,
          },
          {
            name: "Clear Filters",
            icon: X,
            action: clearFilters,
          },
          {
            name: showFilters ? "Hide Filters" : "Show Filters",
            icon: showFilters ? ChevronUp : ChevronDown,
            action: () => setShowFilters(!showFilters),
          },
        ],
      },
      {
        heading: "Filter by Type",
        items: channelTypes.map((type) => ({
          name: type,
          action: () => handleFilterChange("type", type),
        })),
      },
    ];
  }, [
    channelTypes,
    showFilters,
    fetchChannels,
    clearFilters,
    handleFilterChange,
  ]);

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="gap-1"
              disabled={isLoading}
              onClick={fetchChannels}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh data (⌘R)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="gap-1"
              onClick={() => setShowCommandMenu(true)}
              size="sm"
              variant="outline"
            >
              <Command className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search (⌘K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-1" size="sm" variant="outline">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Columns</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              const displayName =
                Object.entries(columnDisplayNames).find(
                  ([key]) => key === column.id
                )?.[1] || column.id;

              return (
                <DropdownMenuCheckboxItem
                  checked={column.getIsVisible()}
                  className="capitalize"
                  key={column.id}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {displayName}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      {renderCustomActions?.()}
    </div>
  );

  // Prepare sidebar content
  const sidebar = showFilters ? (
    <SidebarContainer>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <SidebarSearch
            onValueChange={setGlobalFilter}
            placeholder="Search channels..."
            searchValue={globalFilter}
          />
          <Button
            onClick={() => setShowFilters(false)}
            size="sm"
            variant="ghost"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          {showChannelTypeFilter && (
            <FilterSection
              counts={typeCounts}
              filters={selectedTypes}
              onFilterChange={(value) => handleFilterChange("type", value)}
              onSearchChange={setTypeSearch}
              options={channelTypes}
              searchValue={typeSearch}
              showSearch={channelTypes.length > 10}
              title="Channel Type"
            />
          )}
          {showChannelGroupFilter && (
            <FilterSection
              counts={groupCounts}
              filters={selectedGroups}
              onFilterChange={(value) => handleFilterChange("group", value)}
              onSearchChange={setGroupSearch}
              options={channelGroups}
              searchValue={groupSearch}
              showSearch={channelGroups.length > 10}
              title="Channel Operator"
            />
          )}
          {showChannelSpecsFilter && (
            <FilterSection
              counts={specsCounts}
              filters={selectedSpecs}
              onFilterChange={(value) => handleFilterChange("specs", value)}
              onSearchChange={setSpecsSearch}
              options={channelSpecs}
              searchValue={specsSearch}
              showSearch={channelSpecs.length > 10}
              title="Channel Specs"
            />
          )}
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter>
        <Button
          className="w-full text-xs"
          onClick={clearFilters}
          size="sm"
          variant="outline"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {filteredData.length} of {totalCount} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  ) : (
    <div className="flex h-full items-center justify-center">
      <Button onClick={() => setShowFilters(true)} size="sm" variant="ghost">
        <Filter className="mr-2 h-4 w-4" />
        Show Filters
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-destructive text-xl">Error</h2>
          <p>{error}</p>
          <Button className="mt-4" onClick={fetchChannels}>
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="p-0 overflow-auto"
      sidebar={sidebar}
      title={title}
    >
      <div className="flex h-full flex-col" ref={tableRef}>
        <div className="flex-1 overflow-auto">
          <div className="relative">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr className="border-b bg-muted/50" key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        className={cn(
                          "h-10 px-3 text-left font-medium text-muted-foreground text-sm",
                          header.column.getCanSort() &&
                            "cursor-pointer select-none"
                        )}
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? renderLoadingRows() : renderDataRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CommandDialog onOpenChange={setShowCommandMenu} open={showCommandMenu}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commandItems.map((group) => (
            <CommandGroup heading={group.heading} key={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.name}
                  onSelect={() => {
                    item.action();
                    setShowCommandMenu(false);
                  }}
                >
                  {"icon" in item && <item.icon className="mr-2 h-4 w-4" />}
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </SidebarLayout>
  );
}

export default ChannelDataTable;
