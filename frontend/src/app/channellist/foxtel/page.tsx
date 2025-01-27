'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
// eslint-disable-next-line import/named
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch('/api/py/channels/xmlepg_FOXHD');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setChannels(data.data.channels);
        setIsLoading(false);
      } catch {
        setError('Error loading channels');
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const columns: ColumnDef<Channel>[] = [
    {
      accessorKey: 'channel_number',
      header: () => <div className="text-center">Ch No</div>,
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
      header: () => <div className="text-center">EPG Name</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.original.channel_names.real}</div>
      ),
    },
    {
      accessorKey: 'channel_logo',
      header: () => <div className="text-center">Logo</div>,
      cell: ({ row }) => (
        <div className="relative mx-auto size-14">
          <Image
            src={row.original.channel_logo.light || '/placeholder.svg'}
            alt={`${row.original.channel_name} logo`}
            fill
            className="object-contain"
          />
        </div>
      ),
    },
    {
      accessorKey: 'channel_name',
      header: () => <div className="text-center">Channel Name</div>,
      cell: ({ row }) => (
        <div className="text-center font-bold">
          {row.getValue('channel_name')}
        </div>
      ),
    },
    {
      accessorKey: 'channel_group',
      header: () => <div className="text-center">Channel Operator</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('channel_group')}</div>
      ),
    },
    {
      accessorKey: 'other_data.channel_type',
      header: () => <div className="text-center">Channel Type</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.other_data.channel_type}
        </div>
      ),
    },
    {
      accessorKey: 'other_data.channel_specs',
      header: () => <div className="text-center">Specs</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.other_data.channel_specs}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: channels,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Foxtel</h1>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Filter channels..."
            value={globalFilter ?? ''}
            onChange={event => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
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
                      onCheckedChange={value =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-4rem)] max-w-full flex-1">
          <div className="space-y-6 p-6">
            <div className="mx-auto w-3/5">
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-muted">
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                          const isSorted = header.column.getIsSorted();
                          return (
                            <TableHead
                              key={header.id}
                              className="cursor-pointer"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center justify-center gap-2">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                {header.column.getCanSort() && (
                                  <span>
                                    {header.column.getIsSorted() === 'asc' ? (
                                      <ChevronUp className="size-4" />
                                    ) : header.column.getIsSorted() ===
                                      'desc' ? (
                                      <ChevronDown className="size-4" />
                                    ) : null}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, index) => (
                        <TableRow key={index}>
                          {columns.map((column, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <Skeleton className="h-6 w-full" />
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
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
