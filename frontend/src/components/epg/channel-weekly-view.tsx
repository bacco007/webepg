"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChannelSidebar } from "@/components/epg/channel-sidebar";
import { HeaderActions } from "@/components/epg/header-actions";
import { NavigationControls } from "@/components/epg/navigation-controls";
import { WeeklyGridView } from "@/components/epg/weekly-grid-view";
import { WeeklyListView } from "@/components/epg/weekly-list-view";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useChannelWeeklyData } from "@/hooks/use-channel-weekly-data";

// Enhanced category colors with better contrast and accessibility
const categoryColors: { [key: string]: string } = {
  Comedy:
    "text-white from-cyan-600/90 to-cyan-500/80 hover:from-cyan-500/95 hover:to-cyan-400/85",
  Documentary:
    "text-white from-teal-600/90 to-teal-500/80 hover:from-teal-500/95 hover:to-teal-400/85",
  Drama:
    "text-white from-rose-600/90 to-rose-500/80 hover:from-rose-500/95 hover:to-rose-400/85",
  Kids: "text-white from-pink-600/90 to-pink-500/80 hover:from-pink-500/95 hover:to-pink-400/85",
  Movie:
    "text-white from-purple-600/90 to-purple-500/80 hover:from-purple-500/95 hover:to-purple-400/85",
  Music:
    "text-white from-indigo-600/90 to-indigo-500/80 hover:from-indigo-500/95 hover:to-indigo-400/85",
  News: "text-white from-blue-600/90 to-blue-500/80 hover:from-blue-500/95 hover:to-blue-400/85",
  Reality:
    "text-white from-orange-600/90 to-orange-500/80 hover:from-orange-500/95 hover:to-orange-400/85",
  Series:
    "text-white from-amber-600/90 to-amber-500/80 hover:from-amber-500/95 hover:to-amber-400/85",
  Sports:
    "text-white from-emerald-600/90 to-emerald-500/80 hover:from-emerald-500/95 hover:to-emerald-400/85",
};

interface ChannelWeeklyViewProps {
  channelSlug: string;
  dataSource?: string;
  onNoProgrammingData?: (
    channelSlug: string,
    dataSource: string
  ) => React.ReactNode;
}

export function ChannelWeeklyView({
  channelSlug,
  dataSource = "xmlepg_FTASYD",
  onNoProgrammingData,
}: ChannelWeeklyViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    // Data
    allPrograms,
    channelData,
    days,
    daysLength,

    // State
    isLoading,
    error,
    now,
    visibleDays,
    startDayIndex,
    useCategories,
    viewMode,
    selectedDay,
    filteredCategory,
    showPastPrograms,
    searchTerm,
    debouncedSearchTerm,
    density,
    showTimeBlocks,

    // Computed data
    groupedPrograms,
    uniqueCategories,

    // Actions
    setUseCategories,
    setViewMode,
    setSelectedDay,
    setFilteredCategory,
    setShowPastPrograms,
    setSearchTerm,
    setDensity,
    setShowTimeBlocks,
    fetchData,

    // Utility functions
    getProgramStatus,
    calculateProgress,
    handlePreviousDay,
    handleNextDay,
  } = useChannelWeeklyData({ channelSlug, dataSource });

  // Update visible days based on container width
  useEffect(() => {
    const updateVisibleDays = () => {
      if (containerRef.current) {
        // Note: We can't directly set visibleDays here as it's managed by the hook
        // This would need to be handled differently or moved to the hook
      }
    };

    updateVisibleDays();
    window.addEventListener("resize", updateVisibleDays);

    return () => window.removeEventListener("resize", updateVisibleDays);
  }, []);

  // Scroll to current time
  const scrollToCurrentTime = () => {
    // Find the current time position
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinute;
    const timeSlotHeight = 60; // Height of each 30-minute slot in pixels
    const scrollPosition = (totalMinutes / 30) * timeSlotHeight - 100;

    // Use setTimeout to ensure the scroll happens after render
    setTimeout(() => {
      if (gridRef.current) {
        gridRef.current.scrollTop = scrollPosition;
      }
    }, 0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="mr-2 animate-spin">
          <RefreshCw className="h-5 w-5" />
        </div>
        <span>Loading channel data...</span>
      </div>
    );
  }

  // Check for no programming data error
  const isNoProgrammingDataError =
    error &&
    (error.includes("No programming or channel metadata found") ||
      error.includes("No program data available") ||
      error.includes("404"));

  // Error state
  if (error) {
    // If it's a no programming data error and we have a custom handler, use it
    if (isNoProgrammingDataError && onNoProgrammingData) {
      return (
        <>{onNoProgrammingData(channelSlug, dataSource || "xmlepg_FTASYD")}</>
      );
    }

    return (
      <div className="flex h-full items-center justify-center">
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button className="mt-4" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  const channelTitle = channelData
    ? channelData.channel.name.real
    : channelSlug;

  return (
    <SidebarLayout
      actions={
        <HeaderActions
          channelSlug={channelSlug}
          isLoading={isLoading}
          onRefresh={fetchData}
          onScrollToCurrentTime={scrollToCurrentTime}
          viewMode={viewMode}
        />
      }
      sidebar={
        <ChannelSidebar
          channelData={channelData}
          days={days}
          daysLength={daysLength}
          density={density}
          filteredCategory={filteredCategory}
          searchTerm={searchTerm}
          setDensity={setDensity}
          setFilteredCategory={setFilteredCategory}
          setSearchTerm={setSearchTerm}
          setShowPastPrograms={setShowPastPrograms}
          setShowTimeBlocks={setShowTimeBlocks}
          setUseCategories={setUseCategories}
          setViewMode={setViewMode}
          showPastPrograms={showPastPrograms}
          showTimeBlocks={showTimeBlocks}
          startDayIndex={startDayIndex}
          uniqueCategories={uniqueCategories}
          useCategories={useCategories}
          viewMode={viewMode}
          visibleDays={visibleDays}
        />
      }
      title={`Weekly EPG - ${channelTitle}`}
    >
      <div className="flex h-full flex-col">
        <NavigationControls
          days={days}
          daysLength={daysLength}
          onNext={handleNextDay}
          onPrevious={handlePreviousDay}
          startDayIndex={startDayIndex}
          visibleDays={visibleDays}
        />

        {/* Content area */}
        <div className="flex-1 overflow-hidden" ref={containerRef}>
          {viewMode === "grid" ? (
            <WeeklyGridView
              categoryColors={categoryColors}
              days={days}
              density={density}
              filteredCategory={filteredCategory}
              getProgramStatus={getProgramStatus}
              gridRef={gridRef}
              now={now}
              programs={allPrograms}
              searchTerm={debouncedSearchTerm}
              showPastPrograms={showPastPrograms}
              startDayIndex={startDayIndex}
              useCategories={useCategories}
              visibleDays={visibleDays}
            />
          ) : (
            <WeeklyListView
              calculateProgress={calculateProgress}
              days={days}
              density={density}
              filteredCategory={filteredCategory}
              getProgramStatus={getProgramStatus}
              groupedPrograms={groupedPrograms}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              setShowPastPrograms={setShowPastPrograms}
              showPastPrograms={showPastPrograms}
              showTimeBlocks={showTimeBlocks}
            />
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
