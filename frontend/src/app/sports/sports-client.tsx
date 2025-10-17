"use client";

import { FilterIcon, RefreshCw, X } from "lucide-react";
import { Suspense } from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import LoadingSpinner from "@/components/loading-spinner";
import LoadingState from "@/components/loading-state";
import {
  ChannelCard,
  FilterSection,
  ProgramPageErrorBoundary,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProgramPage } from "@/hooks/use-program-page";
import { ErrorAlert } from "@/lib/error-handling";

function SportsPageContent() {
  const {
    data,
    isLoading,
    error,
    noData,
    filterText,
    selectedGroups,
    selectedCategories,
    isFilterMenuOpen,
    days,
    filteredAndSortedChannels,
    uniqueGroups,
    uniqueCategories,
    groupCounts,
    categoryCounts,
    setFilterText,
    setIsFilterMenuOpen,
    fetchData,
    navigateToNext24Hours,
    navigateToFullWeek,
    handleGroupFilter,
    handleCategoryFilter,
    clearFilters,
  } = useProgramPage({ endpoint: "sports", pageName: "sports" });

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        className="gap-1"
        onClick={() => window.location.reload()}
        size="sm"
        variant="outline"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <Popover onOpenChange={setIsFilterMenuOpen} open={isFilterMenuOpen}>
        <PopoverTrigger asChild>
          <Button className="gap-1 lg:hidden" size="sm" variant="outline">
            <FilterIcon className="h-4 w-4" />
            <span>Filters</span>
            {(selectedGroups.length > 0 || selectedCategories.length > 0) && (
              <Badge className="ml-1" variant="secondary">
                {selectedGroups.length + selectedCategories.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search filters..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Groups">
                {uniqueGroups.map((group) => (
                  <CommandItem
                    key={group}
                    onSelect={() => handleGroupFilter(group)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        checked={selectedGroups.includes(group)}
                        readOnly
                        type="checkbox"
                      />
                      <Label>{group}</Label>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Categories">
                {uniqueCategories.map((category) => (
                  <CommandItem
                    key={category}
                    onSelect={() => handleCategoryFilter(category)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        checked={selectedCategories.includes(category)}
                        readOnly
                        type="checkbox"
                      />
                      <Label>{category}</Label>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-2">
              <Button
                className="w-full"
                onClick={clearFilters}
                variant="outline"
              >
                <X className="mr-2 size-4" />
                Clear Filters
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setFilterText}
          placeholder="Search channels..."
          searchValue={filterText}
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          counts={groupCounts}
          filters={selectedGroups}
          onFilterChange={handleGroupFilter}
          options={uniqueGroups}
          title="Channel Groups"
        />
        <FilterSection
          counts={categoryCounts}
          filters={selectedCategories}
          onFilterChange={handleCategoryFilter}
          options={uniqueCategories}
          title="Categories"
        />
      </SidebarContent>
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
          Showing {filteredAndSortedChannels.length} of{" "}
          {data?.channels.length || 0} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (isLoading) {
    return <LoadingState text="Loading sports..." />;
  }

  if (error) {
    return (
      <div className="m-4">
        <ErrorAlert message={error} onRetry={fetchData} />
      </div>
    );
  }

  if (noData) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mb-4 max-w-md">
          <div className="flex items-center">
            <span className="mr-2 size-4">🏆</span>
            <span className="font-bold">No Sports Programming</span>
          </div>
          <div className="mt-2 text-sm">
            No sports programming found for the next {days} days. <br />
            Try adjusting your search parameters or check back later.
          </div>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>
    );
  }

  if (!data || filteredAndSortedChannels.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mb-4 max-w-md">
          <div className="flex items-center">
            <span className="mr-2 size-4">🏆</span>
            <span className="font-bold">No Results</span>
          </div>
          <div className="mt-2 text-sm">
            No channels match your current filter. <br />
            Try adjusting your search or clear the filter.
          </div>
        </div>
        <Button aria-label="Clear All Filters" onClick={clearFilters}>
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="overflow-auto"
      sidebar={sidebar}
      title="Upcoming Sports Programming"
    >
      <div className="p-4 pb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredAndSortedChannels.map((channelData) => (
            <ChannelCard
              channelData={channelData}
              key={channelData.channel.slug}
              onNavigate={navigateToNext24Hours}
              onNavigateToFullWeek={navigateToFullWeek}
            />
          ))}
        </div>
        <div aria-hidden="true" className="h-24" /> {/* Spacer element */}
      </div>
    </SidebarLayout>
  );
}

export default function SportsPageClient() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ProgramPageErrorBoundary pageName="sports">
        <Suspense fallback={<LoadingSpinner />}>
          <SportsPageContent />
        </Suspense>
      </ProgramPageErrorBoundary>
    </div>
  );
}
