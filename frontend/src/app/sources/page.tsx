'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SidebarLayout } from '@/components/layouts/sidebar-layout';
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
    <div className="border-b last:border-b-0">
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

export default function XmltvSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSubgroups, setSelectedSubgroups] = useState<string[]>([]);

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

  const handleRefresh = async () => {
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
    } catch {
      setError(
        'An error occurred while fetching the sources. Please try again later.',
      );
    } finally {
      setIsLoading(false);
    }
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

  // Create sidebar component
  const sidebar = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="top-2.5 left-2 absolute size-4 text-muted-foreground" />
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
              className="top-1 right-1 absolute p-0 w-7 h-7"
              onClick={() => setFilterText('')}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
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
      </div>

      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-xs"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredSources.length} of {sources.length} sources
        </div>
      </div>
    </div>
  );

  // Create header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleRefresh}
        variant="outline"
        size="sm"
        disabled={isLoading}
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center p-4 h-full">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <SidebarLayout
      title="XMLTV Sources"
      sidebar={sidebar}
      actions={headerActions}
      contentClassName="p-0"
      sidebarClassName="p-0"
    >
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 xl:grid-cols-5">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-card p-3 border rounded-lg animate-pulse"
              >
                <div className="bg-muted mb-2 rounded w-24 h-8"></div>
                <div className="bg-muted mb-2 rounded w-full h-4"></div>
                <div className="flex gap-1 mb-2">
                  <div className="bg-muted rounded-full w-16 h-6"></div>
                  <div className="bg-muted rounded-full w-20 h-6"></div>
                </div>
                <div className="bg-muted rounded w-full h-8"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 xl:grid-cols-5">
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
                <div className="flex justify-start items-start mb-2 h-10">
                  {source.logo ? (
                    <>
                      <img
                        className="dark:hidden block w-auto h-8 object-contain"
                        src={source.logo.light || '/placeholder.svg'}
                        alt={source.location}
                      />
                      <img
                        className="hidden dark:block w-auto h-8 object-contain"
                        src={source.logo.dark || '/placeholder.svg'}
                        alt={source.location}
                      />
                    </>
                  ) : (
                    <div className="flex justify-center items-center bg-primary/10 rounded-full w-8 h-8">
                      <span className="font-bold text-primary text-lg">
                        {source.location.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="mb-2 font-semibold text-sm text-left line-clamp-1">
                  {source.location}
                </h3>

                <div className="flex flex-wrap gap-1 mb-2">
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

            {filteredSources.length === 0 && (
              <div className="flex justify-center items-center col-span-full h-40">
                <p className="text-muted-foreground text-center">
                  No sources found matching your filters. Try adjusting your
                  search criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
