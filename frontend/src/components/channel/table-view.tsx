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
import { ArrowRight, ChevronDown, ChevronUp, Sliders } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Channel } from "./types";
import {
  getChannelDisplayNameWithAbbreviations,
  getChannelNumber,
} from "./utils";

// Regex patterns for channel number sorting
const CHANNEL_NUMBER_PATTERN = /^(\d+)/;
const PURE_NUMERIC_PATTERN = /^\d+$/;

interface TableViewProps {
  filteredChannels: Channel[];
  xmltvDataSource: string;
  hasNameGroups: boolean;
}

// Define table columns using TanStack Table
function getColumns(
  xmltvDataSource: string,
  hasNameGroups: boolean
): ColumnDef<Channel>[] {
  return [
    {
      accessorFn: (row) => {
        const num = getChannelNumber(row);
        return num !== "N/A" ? num : "";
      },
      cell: ({ row }) => {
        const channel = row.original;
        let displayValue = "-";
        if (
          typeof channel.channel_number === "string" &&
          channel.channel_number !== "N/A"
        ) {
          displayValue = channel.channel_number;
        }

        return <Badge variant="secondary">{displayValue}</Badge>;
      },
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        let sortIcon: React.ReactNode = null;
        if (isSorted === "asc") {
          sortIcon = <ChevronUp className="ml-2 size-4" />;
        } else if (isSorted === "desc") {
          sortIcon = <ChevronDown className="ml-2 size-4" />;
        }

        return (
          <Button
            className="flex items-center p-0 font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            variant="ghost"
          >
            Ch No
            {sortIcon}
          </Button>
        );
      },
      id: "number",
      sortingFn: (rowA, rowB, columnId) => {
        const aValue = rowA.getValue(columnId) as string;
        const bValue = rowB.getValue(columnId) as string;

        // Extract numeric parts and check if they're purely numeric
        const aNumMatch = aValue.match(CHANNEL_NUMBER_PATTERN);
        const bNumMatch = bValue.match(CHANNEL_NUMBER_PATTERN);

        const aIsPureNumeric =
          aValue !== "" && PURE_NUMERIC_PATTERN.test(aValue);
        const bIsPureNumeric =
          bValue !== "" && PURE_NUMERIC_PATTERN.test(bValue);

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
      cell: ({ row }) => {
        const channel = row.original;
        if (channel.chlogo === "N/A") {
          return (
            <div className="flex size-12 items-center justify-center rounded-md bg-muted">
              <span className="text-muted-foreground text-xs">No logo</span>
            </div>
          );
        }

        return (
          <div>
                          <img
                alt={getChannelDisplayNameWithAbbreviations(channel)}
                className="block size-12 max-h-full object-contain dark:hidden"
                src={channel.channel_logo.light || "/placeholder.svg"}
              />
              <img
                alt={getChannelDisplayNameWithAbbreviations(channel)}
                className="hidden size-12 max-h-full object-contain dark:block"
                src={channel.channel_logo.dark || "/placeholder.svg"}
              />
          </div>
        );
      },
      header: "Logo",
      id: "logo",
    },
    {
      accessorFn: (row) => getChannelDisplayNameWithAbbreviations(row),
      cell: ({ row }) => {
        const channel = row.original;
        return <div>{getChannelDisplayNameWithAbbreviations(channel)}</div>;
      },
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        let sortIcon: React.ReactNode = null;
        if (isSorted === "asc") {
          sortIcon = <ChevronUp className="ml-2 size-4" />;
        } else if (isSorted === "desc") {
          sortIcon = <ChevronDown className="ml-2 size-4" />;
        }

        return (
          <Button
            className="flex items-center p-0 font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            variant="ghost"
          >
            Channel Name
            {sortIcon}
          </Button>
        );
      },
      id: "name",
    },
    {
      accessorKey: "channel_group",
      cell: ({ row }) => {
        const channel = row.original;
        const displayValue =
          channel.channel_group === "N/A" ? "-" : channel.channel_group;
        return (
          <Badge className="mr-2" variant="secondary">
            {displayValue}
          </Badge>
        );
      },
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        let sortIcon: React.ReactNode = null;
        if (isSorted === "asc") {
          sortIcon = <ChevronUp className="ml-2 size-4" />;
        } else if (isSorted === "desc") {
          sortIcon = <ChevronDown className="ml-2 size-4" />;
        }

        return (
          <Button
            className="flex items-center p-0 font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            variant="ghost"
          >
            Channel Operator
            {sortIcon}
          </Button>
        );
      },
      id: "group",
    },
    {
      accessorFn: (row) => row.other_data.channel_type,
      cell: ({ row }) => {
        const channel = row.original;
        const displayValue =
          channel.other_data.channel_type === "N/A"
            ? "-"
            : channel.other_data.channel_type;
        return (
          <Badge className="mr-2" variant="secondary">
            {displayValue}
          </Badge>
        );
      },
      header: "Channel Type",
      id: "type",
    },
    {
      accessorFn: (row) => row.other_data.channel_specs,
      cell: ({ row }) => {
        const channel = row.original;
        const displayValue =
          channel.other_data.channel_specs === "N/A"
            ? "-"
            : channel.other_data.channel_specs;
        return (
          <Badge className="mr-2" variant="secondary">
            {displayValue}
          </Badge>
        );
      },
      header: "Specs",
      id: "specs",
    },
    ...(hasNameGroups
      ? [
          {
            accessorFn: (row) => row.other_data.channel_name_group || "",
            cell: ({ row }) => {
              const channel = row.original;
              return (
                <Badge className="mr-2" variant="secondary">
                  {channel.other_data.channel_name_group || "-"}
                </Badge>
              );
            },
            header: "Name Group",
            id: "nameGroup",
          } as ColumnDef<Channel>,
        ]
      : []),
    {
      accessorKey: "program_count",
      cell: ({ row }) => {
        const channel = row.original;
        let displayValue = "-";
        if (typeof channel.program_count === "number") {
          displayValue = channel.program_count.toString();
        }

        return (
          <Badge className="mr-2" variant="secondary">
            {displayValue}
          </Badge>
        );
      },
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        let sortIcon: React.ReactNode = null;
        if (isSorted === "asc") {
          sortIcon = <ChevronUp className="ml-2 size-4" />;
        } else if (isSorted === "desc") {
          sortIcon = <ChevronDown className="ml-2 size-4" />;
        }

        return (
          <Button
            className="flex items-center p-0 font-medium hover:bg-accent hover:text-accent-foreground"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            variant="ghost"
          >
            Programs
            {sortIcon}
          </Button>
        );
      },
      id: "programs",
    },
    {
      cell: ({ row }) => {
        const channel = row.original;
        return (
          <div className="text-right">
            <Button asChild size="sm" variant="ghost">
              <Link
                className="inline-flex items-center font-medium hover:text-primary"
                href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
              >
                View
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        );
      },
      header: () => <div className="text-right">Actions</div>,
      id: "actions",
    },
  ];
}

export function TableView({
  filteredChannels,
  xmltvDataSource,
  hasNameGroups,
}: TableViewProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { desc: false, id: "number" },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    actions: true,
    group: true,
    logo: true,
    name: true,
    nameGroup: true,
    number: true,
    programs: true,
    specs: true,
    type: true,
  });

  const columns = useMemo(
    () => getColumns(xmltvDataSource, hasNameGroups),
    [xmltvDataSource, hasNameGroups]
  );

  const table = useReactTable({
    columns,
    data: filteredChannels,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      sorting,
    },
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-1" size="sm" variant="outline">
              <Sliders className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                let displayName =
                  column.id.charAt(0).toUpperCase() + column.id.slice(1);
                if (column.id === "number") {
                  displayName = "Ch No";
                } else if (column.id === "nameGroup") {
                  displayName = "Name Group";
                }

                return (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    className="capitalize"
                    key={column.id}
                    onCheckedChange={(value) =>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-muted shadow-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={header.id === "logo" ? "w-[100px]" : ""}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="hover:bg-muted/50"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
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
