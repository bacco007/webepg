"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FilterSection } from "@/components/filter-section";
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
import { CardView, MobileView, TableView } from "@/components/nownext";
import { ViewControls } from "@/components/nownext/view-controls";
import { Button } from "@/components/ui/button";
import { useNowNextData } from "@/hooks/use-nownext-data";
import { useNowNextFilters } from "@/hooks/use-nownext-filters";
import { ErrorAlert, ErrorBoundary } from "@/lib/error-handling";
import type { GroupBy, ViewMode } from "@/lib/nownext-types";

function ChannelGrid() {
  const { channels, isLoading, error, refresh } = useNowNextData();
  const {
    searchTerm,
    selectedGroups,
    hideNoProgramData,
    groupFilterSearch,
    setSearchTerm,
    setHideNoProgramData,
    setGroupFilterSearch,
    filteredChannels,
    uniqueGroups,
    groupCounts,
    handleGroupFilter,
    clearFilters,
  } = useNowNextFilters(channels);

  // View states
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle view mode from URL params
  useEffect(() => {
    const viewModeParameter = searchParams.get("view");
    if (
      viewModeParameter === "card" ||
      viewModeParameter === "table" ||
      viewModeParameter === "mobile"
    ) {
      setViewMode(viewModeParameter as ViewMode);
    } else {
      setViewMode("card"); // Default to card view
    }
  }, [searchParams]);

  const navigateToNext24Hours = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0].replaceAll("-", "");
    router.push(`/epg/${formattedDate}`);
  };

  const navigateToFullWeek = (channelSlug: string) => {
    router.push(`/channel/${channelSlug}`);
  };

  if (error) {
    return <ErrorAlert message={error} onRetry={refresh} />;
  }

  // Create the sidebar content using the template structure
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setSearchTerm}
          placeholder="Search channels..."
          searchValue={searchTerm}
        />
      </SidebarHeader>
      <SidebarContent>
        {/* Options section */}
        <FilterSection
          counts={{ "Hide channels with no programs": channels.length }}
          filters={hideNoProgramData ? ["Hide channels with no programs"] : []}
          onFilterChange={() => setHideNoProgramData(!hideNoProgramData)}
          onSearchChange={() => {
            // No-op function for compatibility
          }}
          options={["Hide channels with no programs"]}
          searchValue=""
          showSearch={false}
          title="Options"
        />

        {/* Channel Groups section */}
        <FilterSection
          counts={groupCounts}
          filters={selectedGroups}
          onFilterChange={handleGroupFilter}
          onSearchChange={setGroupFilterSearch}
          options={uniqueGroups}
          searchValue={groupFilterSearch}
          showSearch={true}
          title="Channel Groups"
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
          Showing {filteredChannels.length} of {channels.length} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // View controls for the header actions
  const viewControls = (
    <ViewControls
      groupBy={groupBy}
      isLoading={isLoading}
      onGroupByChange={setGroupBy}
      onRefresh={refresh}
      onViewModeChange={setViewMode}
      viewMode={viewMode}
    />
  );

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState text="Loading Now & Next..." />;
    }

    if (viewMode === "card") {
      return (
        <>
          <CardView
            filteredChannels={filteredChannels}
            groupBy={groupBy}
            onNavigateToFullWeek={navigateToFullWeek}
            onNavigateToNext24Hours={navigateToNext24Hours}
          />
          <div aria-hidden="true" className="h-24" /> {/* Spacer element */}
        </>
      );
    }

    if (viewMode === "table") {
      return (
        <TableView
          filteredChannels={filteredChannels}
          onNavigateToFullWeek={navigateToFullWeek}
          onNavigateToNext24Hours={navigateToNext24Hours}
        />
      );
    }

    return <MobileView filteredChannels={filteredChannels} />;
  };

  return (
    <SidebarLayout
      actions={viewControls}
      contentClassName="overflow-auto"
      sidebar={sidebar}
      title="Now and Next"
    >
      <div className="p-4 pb-4">{renderContent()}</div>
    </SidebarLayout>
  );
}

export default function NowNextPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <ChannelGrid />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
