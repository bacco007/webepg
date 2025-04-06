'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Menu,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getCookie, setCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo?: {
    light: string;
    dark: string;
  };
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

export default function XmltvSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const data: Source[] = await response.json();
        const sortedSources = data.sort((a, b) => {
          if (a.group !== b.group) return a.group.localeCompare(b.group);
          if (a.subgroup !== b.subgroup)
            return a.subgroup.localeCompare(b.subgroup);
          return a.location.localeCompare(b.location);
        });
        setSources(sortedSources);
        const currentSourceId = await getCookie('xmltvdatasource');
        setSelectedSourceId(currentSourceId || null);
      } catch {
        setError(
          'An error occurred while fetching the sources. Please try again later.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, []);

  const handleSourceSelect = async (sourceId: string) => {
    await setCookie('xmltvdatasource', sourceId);
    setSelectedSourceId(sourceId);
  };

  const groupedSources = useMemo(() => {
    return sources.reduce(
      (accumulator, source) => {
        if (!accumulator[source.group]) {
          accumulator[source.group] = {};
        }
        if (!accumulator[source.group][source.subgroup]) {
          accumulator[source.group][source.subgroup] = [];
        }
        accumulator[source.group][source.subgroup].push(source);
        return accumulator;
      },
      {} as Record<string, Record<string, Source[]>>,
    );
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter(
      source =>
        source.location.toLowerCase().includes(filterText.toLowerCase()) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(source.group)) &&
        (selectedSubgroups.length === 0 ||
          selectedSubgroups.includes(source.subgroup)),
    );
  }, [sources, filterText, selectedGroups, selectedSubgroups]);

  const groups = useMemo(
    () => Object.keys(groupedSources).sort(),
    [groupedSources],
  );

  const uniqueSubgroups = useMemo(() => {
    const subgroups = new Set<string>();
    sources.forEach(source => subgroups.add(source.subgroup));
    return [...subgroups].sort();
  }, [sources]);

  const handleGroupFilter = (group: string) => {
    setSelectedGroups(previous =>
      previous.includes(group)
        ? previous.filter(g => g !== group)
        : [...previous, group],
    );
  };

  const handleSubgroupFilter = (subgroup: string) => {
    setSelectedSubgroups(previous =>
      previous.includes(subgroup)
        ? previous.filter(s => s !== subgroup)
        : [...previous, subgroup],
    );
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedGroups([]);
    setSelectedSubgroups([]);
  };

  // Calculate counts for filter options
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groups.forEach(group => {
      counts[group] = sources.filter(
        source =>
          source.group === group &&
          source.location.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedSubgroups.length === 0 ||
            selectedSubgroups.includes(source.subgroup)),
      ).length;
    });
    return counts;
  }, [sources, groups, filterText, selectedSubgroups]);

  const subgroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueSubgroups.forEach(subgroup => {
      counts[subgroup] = sources.filter(
        source =>
          source.subgroup === subgroup &&
          source.location.toLowerCase().includes(filterText.toLowerCase()) &&
          (selectedGroups.length === 0 ||
            selectedGroups.includes(source.group)),
      ).length;
    });
    return counts;
  }, [sources, uniqueSubgroups, filterText, selectedGroups]);

  // Sidebar content component to avoid duplication
  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
          <Input
            placeholder="Search sources..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="pl-8 text-sm"
            aria-label="Search sources"
          />
          {filterText && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-7 w-7 p-0"
              onClick={() => setFilterText('')}
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
            title="Groups"
            options={groups}
            filters={selectedGroups}
            onFilterChange={handleGroupFilter}
            counts={groupCounts}
          />

          <FilterSection
            title="Subgroups"
            options={uniqueSubgroups}
            filters={selectedSubgroups}
            onFilterChange={handleSubgroupFilter}
            counts={subgroupCounts}
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
          Showing {filteredSources.length} of {sources.length} sources
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on small screens */}
      <div className="bg-background hidden w-64 shrink-0 flex-col overflow-hidden border-r lg:flex">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content header with view controls */}
        <div className="bg-background flex items-center justify-between border-b p-2">
          <div className="flex items-center space-x-2">
            {/* Mobile sidebar trigger - only visible on small screens */}
            <div className="lg:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>
            <span className="text-sm font-medium">Guide Sources</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search sources..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-[200px]"
            />
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredSources.map(source => (
              <div
                key={source.id}
                className={cn(
                  'bg-card relative flex flex-col rounded-lg p-3 transition-all hover:shadow-md',
                  selectedSourceId === source.id
                    ? 'ring-primary ring-2'
                    : 'border',
                )}
              >
                <div className="mb-2 flex h-10 items-start justify-start">
                  {source.logo ? (
                    <>
                      <img
                        className="block h-8 w-auto object-contain dark:hidden"
                        src={source.logo.light || '/placeholder.svg'}
                        alt={source.location}
                      />
                      <img
                        className="hidden h-8 w-auto object-contain dark:block"
                        src={source.logo.dark || '/placeholder.svg'}
                        alt={source.location}
                      />
                    </>
                  ) : (
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                      <span className="text-primary text-lg font-bold">
                        {source.location.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="mb-2 line-clamp-1 text-left text-sm font-semibold">
                  {source.location}
                </h3>

                <div className="mb-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {source.group}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {source.subgroup}
                  </Badge>
                </div>

                <div className="mt-auto">
                  <Button
                    variant={
                      selectedSourceId === source.id ? 'default' : 'outline'
                    }
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleSourceSelect(source.id)}
                  >
                    {selectedSourceId === source.id
                      ? 'Selected'
                      : 'Select Source'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
