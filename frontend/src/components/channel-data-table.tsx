"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
} from "@tanstack/react-table"
import { ArrowUpDown, RefreshCw, RotateCw, Sliders } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { FilterSection } from "@/components/filter-section"
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout"

// Define the Channel interface that all pages will use
export interface Channel {
  channel_number: string
  channel_name: string
  channel_names: {
    real: string
  }
  channel_group: string
  channel_logo: {
    light: string
    dark: string
  }
  other_data: {
    channel_type: string
    channel_specs: string
  }
  channel_slug: string
}

// Define the props for the ChannelDataTable component
interface ChannelDataTableProps {
  title: string
  fetchUrl: string
  dataExtractor?: (data: any) => Channel[]
  initialSorting?: SortingState
  defaultColumnVisibility?: VisibilityState
  renderCustomActions?: () => React.ReactNode
  showChannelTypeFilter?: boolean
  showChannelGroupFilter?: boolean
  showChannelSpecsFilter?: boolean
}

// Default column definitions that will be used across all tables
const defaultColumns: ColumnDef<Channel>[] = [
  {
    accessorKey: "channel_number",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex justify-center items-center gap-1 p-0 w-full font-medium"
      >
        Ch No
        <ArrowUpDown className="w-4 h-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-center">{row.getValue("channel_number")}</div>,
    sortingFn: (a, b) => Number.parseInt(a.getValue("channel_number")) - Number.parseInt(b.getValue("channel_number")),
  },
  {
    accessorKey: "channel_names.real",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          EPG Name
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-center">{row.original.channel_names.real}</div>,
  },
  {
    accessorKey: "channel_logo",
    header: () => <div className="text-center">Logo</div>,
    cell: ({ row }) => (
      <div className="flex justify-center items-center bg-muted/50 mx-auto p-1 rounded-md size-12">
        {row.original.channel_logo.light ? (
          <img
            src={row.original.channel_logo.light || "/placeholder.svg"}
            alt={`${row.original.channel_name} logo`}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg?height=40&width=40"
            }}
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full text-muted-foreground text-xs">No logo</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "channel_name",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Channel Name
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="font-bold hover:text-primary text-center hover:underline">
        <Link href={`/channel/${row.original.channel_slug}`}>{row.getValue("channel_name")}</Link>
      </div>
    ),
  },
  {
    accessorKey: "channel_group",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Channel Operator
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("channel_group")}</div>,
  },
  {
    accessorKey: "other_data.channel_type",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Channel Type
          <ArrowUpDown className="ml-2 w-4 h-4" />
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
    accessorKey: "other_data.channel_specs",
    header: ({ column }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 font-medium"
        >
          Specs
          <ArrowUpDown className="ml-2 w-4 h-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="secondary">{row.original.other_data.channel_specs}</Badge>
      </div>
    ),
  },
]

// Column display names mapping
const columnDisplayNames = {
  channel_number: "Ch No",
  "channel_names.real": "EPG Name",
  channel_logo: "Logo",
  channel_name: "Channel Name",
  channel_group: "Channel Operator",
  "other_data.channel_type": "Channel Type",
  "other_data.channel_specs": "Specs",
}

export function ChannelDataTable({
  title,
  fetchUrl,
  dataExtractor = (data) => data.data.channels,
  initialSorting = [{ id: "channel_number", desc: false }],
  defaultColumnVisibility = {},
  renderCustomActions,
  showChannelTypeFilter = true,
  showChannelGroupFilter = true,
  showChannelSpecsFilter = true,
}: ChannelDataTableProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility)
  const [globalFilter, setGlobalFilter] = useState("")
  const [totalCount, setTotalCount] = useState(0)

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])

  // Search state for filter sections
  const [typeSearch, setTypeSearch] = useState("")
  const [groupSearch, setGroupSearch] = useState("")
  const [specsSearch, setSpecsSearch] = useState("")

  const debouncedGlobalSearch = useDebounce(globalFilter, 300)

  // Fetch data only once on component mount
  useEffect(() => {
    fetchChannels()
  }, [fetchUrl])

  const fetchChannels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()
      const extractedChannels = dataExtractor(data)
      setChannels(extractedChannels)
      setTotalCount(extractedChannels.length)
      setIsLoading(false)
    } catch (err) {
      setError("Error loading channels")
      setIsLoading(false)
    }
  }

  // Memoize unique values for filters to prevent recalculation
  const channelTypes = useMemo(() => [...new Set(channels.map((c) => c.other_data.channel_type))].sort(), [channels])

  const channelGroups = useMemo(() => [...new Set(channels.map((c) => c.channel_group))].sort(), [channels])

  const channelSpecs = useMemo(() => [...new Set(channels.map((c) => c.other_data.channel_specs))].sort(), [channels])

  // Apply filters in a memoized function to prevent recalculation
  const filteredData = useMemo(() => {
    return channels.filter((channel) => {
      // Apply type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(channel.other_data.channel_type)) {
        return false
      }

      // Apply group filter
      if (selectedGroups.length > 0 && !selectedGroups.includes(channel.channel_group)) {
        return false
      }

      // Apply specs filter
      if (selectedSpecs.length > 0 && !selectedSpecs.includes(channel.other_data.channel_specs)) {
        return false
      }

      // Apply global filter (search)
      if (debouncedGlobalSearch) {
        const searchTerm = debouncedGlobalSearch.toLowerCase()
        return (
          channel.channel_name.toLowerCase().includes(searchTerm) ||
          channel.channel_names.real.toLowerCase().includes(searchTerm) ||
          channel.channel_number.toLowerCase().includes(searchTerm) ||
          channel.channel_group.toLowerCase().includes(searchTerm) ||
          channel.other_data.channel_type.toLowerCase().includes(searchTerm)
        )
      }

      return true
    })
  }, [channels, selectedTypes, selectedGroups, selectedSpecs, debouncedGlobalSearch])

  // Calculate counts for each filter option
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    // Create a version of the filter function that excludes type filter
    const filterWithoutType = (channel: Channel) =>
      (selectedGroups.length === 0 || selectedGroups.includes(channel.channel_group)) &&
      (selectedSpecs.length === 0 || selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (debouncedGlobalSearch === "" ||
        channel.channel_name.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_names.real.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_number.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_group.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.other_data.channel_type.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()))

    // Count only channels that match all other filters
    channelTypes.forEach((type) => {
      counts[type] = channels.filter((c) => c.other_data.channel_type === type && filterWithoutType(c)).length
    })

    return counts
  }, [channels, channelTypes, selectedGroups, selectedSpecs, debouncedGlobalSearch])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    // Create a version of the filter function that excludes group filter
    const filterWithoutGroup = (channel: Channel) =>
      (selectedTypes.length === 0 || selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedSpecs.length === 0 || selectedSpecs.includes(channel.other_data.channel_specs)) &&
      (debouncedGlobalSearch === "" ||
        channel.channel_name.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_names.real.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_number.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_group.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.other_data.channel_type.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()))

    // Count only channels that match all other filters
    channelGroups.forEach((group) => {
      counts[group] = channels.filter((c) => c.channel_group === group && filterWithoutGroup(c)).length
    })

    return counts
  }, [channels, channelGroups, selectedTypes, selectedSpecs, debouncedGlobalSearch])

  const specsCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    // Create a version of the filter function that excludes specs filter
    const filterWithoutSpecs = (channel: Channel) =>
      (selectedTypes.length === 0 || selectedTypes.includes(channel.other_data.channel_type)) &&
      (selectedGroups.length === 0 || selectedGroups.includes(channel.channel_group)) &&
      (debouncedGlobalSearch === "" ||
        channel.channel_name.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_names.real.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_number.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.channel_group.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()) ||
        channel.other_data.channel_type.toLowerCase().includes(debouncedGlobalSearch.toLowerCase()))

    // Count only channels that match all other filters
    channelSpecs.forEach((spec) => {
      counts[spec] = channels.filter((c) => c.other_data.channel_specs === spec && filterWithoutSpecs(c)).length
    })

    return counts
  }, [channels, channelSpecs, selectedTypes, selectedGroups, debouncedGlobalSearch])

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
  })

  // Handle filter changes
  const handleFilterChange = (filterType: "type" | "group" | "specs", value: string) => {
    switch (filterType) {
      case "type": {
        setSelectedTypes((previous) =>
          previous.includes(value) ? previous.filter((v) => v !== value) : [...previous, value],
        )
        break
      }
      case "group": {
        setSelectedGroups((previous) =>
          previous.includes(value) ? previous.filter((v) => v !== value) : [...previous, value],
        )
        break
      }
      case "specs": {
        setSelectedSpecs((previous) =>
          previous.includes(value) ? previous.filter((v) => v !== value) : [...previous, value],
        )
        break
      }
    }
  }

  // Clear filters with useCallback
  const clearFilters = useCallback(() => {
    setGlobalFilter("")
    setSelectedTypes([])
    setSelectedGroups([])
    setSelectedSpecs([])
    setColumnFilters([])
    setTypeSearch("")
    setGroupSearch("")
    setSpecsSearch("")
  }, [])

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button onClick={fetchChannels} variant="outline" size="sm" className="gap-1" disabled={isLoading}>
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Columns</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              // Use a proper lookup instead of direct access to handle keys with dots
              const displayName =
                Object.entries(columnDisplayNames).find(([key]) => key === column.id)?.[1] || column.id

              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {displayName}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      {renderCustomActions && renderCustomActions()}
    </div>
  )

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Search channels..." />
      </SidebarHeader>
      <SidebarContent>
        {showChannelTypeFilter && (
          <FilterSection
            title="Channel Type"
            options={channelTypes}
            filters={selectedTypes}
            onFilterChange={(value) => handleFilterChange("type", value)}
            searchValue={typeSearch}
            onSearchChange={setTypeSearch}
            counts={typeCounts}
            showSearch={channelTypes.length > 10}
          />
        )}
        {showChannelGroupFilter && (
          <FilterSection
            title="Channel Operator"
            options={channelGroups}
            filters={selectedGroups}
            onFilterChange={(value) => handleFilterChange("group", value)}
            searchValue={groupSearch}
            onSearchChange={setGroupSearch}
            counts={groupCounts}
            showSearch={channelGroups.length > 10}
          />
        )}
        {showChannelSpecsFilter && (
          <FilterSection
            title="Channel Specs"
            options={channelSpecs}
            filters={selectedSpecs}
            onFilterChange={(value) => handleFilterChange("specs", value)}
            searchValue={specsSearch}
            onSearchChange={setSpecsSearch}
            counts={specsCounts}
            showSearch={channelSpecs.length > 10}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full text-xs">
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredData.length} of {totalCount} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  )

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-destructive text-xl">Error</h2>
          <p>{error}</p>
          <Button onClick={fetchChannels} className="mt-4">
            <RotateCw className="mr-2 w-4 h-4" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout title={title} sidebar={sidebar} contentClassName="p-0 overflow-auto" actions={headerActions}>
      <div className="flex flex-col h-full">
        {/* Table content - scrollable */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="top-0 z-20 sticky bg-muted shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {defaultColumns.map((_, cellIndex) => (
                      <TableCell key={cellIndex} className="p-2">
                        <Skeleton className={`h-8 w-full ${cellIndex === 2 ? "h-12" : ""}`} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={defaultColumns.length} className="h-24 text-center">
                    No results found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="h-24" aria-hidden="true"></div> {/* Spacer element */}
        </div>
      </div>
    </SidebarLayout>
  )
}

export default ChannelDataTable;
