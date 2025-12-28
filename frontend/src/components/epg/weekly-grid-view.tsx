"use client";

import { format } from "date-fns";
import React, { useMemo } from "react";
import { ProgramDialog } from "@/components/epg/program-dialog";
import type { Program } from "@/components/epg/types";
import {
  type DensityOption,
  getDensityPadding,
  getGridCellBorderStyle,
  getProgramCategoryIcon,
  getProgramColor,
  getProgramIndicators,
  getSpecialTitleClass,
  isPlaceholderProgram,
} from "@/components/epg/utils";
import { Badge } from "@/components/ui/badge";
import { formatDate, parseISODate } from "@/lib/date-utils";
// Add import for decodeHtml at the top of the file
import { decodeHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";

// Improved layout constants
const timeSlotHeight = 60; // Height of each 30-minute slot in pixels
const timeColumnWidth = 60; // Width of time column in pixels
const gridGap = 4; // Gap between grid items in pixels
const headerHeight = 48; // Height of the sticky header

// Enhanced default colors with better gradients and styling
const defaultColorClasses = [
  "bg-sky-100/75 border border-sky-400 text-sky-900 shadow-xs hover:bg-sky-200 focus:bg-sky-200 dark:bg-sky-900/60 dark:border-sky-600 dark:text-sky-100 dark:hover:bg-sky-800 dark:focus:bg-sky-800",
];
const liveColor =
  "bg-primary/30 border border-primary/40 text-primary-foreground shadow-sm hover:bg-primary/40 focus:bg-primary/40 dark:bg-primary/60 dark:border-primary-300 dark:text-primary-50 dark:hover:bg-primary/70 dark:focus:bg-primary/70";
const pastColor =
  "bg-gray-100 border border-gray-400 text-foreground shadow-xs hover:bg-muted/70 focus:bg-muted/70 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700";
const upNextColor =
  "bg-purple-200 border border-purple-400 text-foreground shadow-xs hover:bg-accent/20 focus:bg-accent/20 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-100 dark:hover:bg-purple-800 dark:focus:bg-purple-800";

// Example category color palette
const softCategoryColors: { [key: string]: string } = {
  Comedy:
    "bg-green-100 border-green-200 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-100",
  Documentary:
    "bg-orange-100 border-orange-200 text-orange-900 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-100",
  Drama:
    "bg-purple-100 border-purple-200 text-purple-900 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-100",
  Kids: "bg-pink-100 border-pink-200 text-pink-900 dark:bg-pink-900 dark:border-pink-700 dark:text-pink-100",
  Music:
    "bg-indigo-100 border-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-100",
  News: "bg-yellow-100 border-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100",
  Sport:
    "bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100",
  // Add more as needed
};

// ProgramItem component to reduce complexity
interface ProgramItemProps {
  program: Program;
  programColor: string;
  density: DensityOption;
  getEventStyle: (program: Program) => React.CSSProperties;
  getProgramStatus: (program: Program) => {
    isLive: boolean;
    hasEnded: boolean;
    isUpNext: boolean;
  };
  isPlaceholder: boolean;
}

// Helper function to determine program color
const getProgramColorForDisplay = (
  programData: Program,
  useCategories: boolean,
  categoryColors: { [key: string]: string },
  getProgramStatusFn: (program: Program) => {
    isLive: boolean;
    hasEnded: boolean;
    isUpNext: boolean;
  }
): string => {
  const specialTitleClass = getSpecialTitleClass(programData.title);
  if (specialTitleClass) {
    return specialTitleClass;
  }

  if (
    useCategories &&
    programData.categories &&
    programData.categories.length > 0
  ) {
    const cat = programData.categories[0];
    return softCategoryColors[cat] || defaultColorClasses[0];
  }

  const { isLive, hasEnded, isUpNext } = getProgramStatusFn(programData);
  if (isLive) {
    return liveColor;
  }
  if (hasEnded) {
    return pastColor;
  }
  if (isUpNext) {
    return upNextColor;
  }

  return getProgramColor(
    programData,
    useCategories,
    categoryColors,
    defaultColorClasses
  );
};

const ProgramItem = ({
  program,
  programColor,
  density,
  getEventStyle,
  getProgramStatus,
  isPlaceholder,
}: ProgramItemProps) => {
  const { isLive, hasEnded, isUpNext } = getProgramStatus(program);

  // Check if program is new or premiere
  const { isPremiere, isNew } = getProgramIndicators(program);

  // Get category icon
  const CategoryIcon = getProgramCategoryIcon(program.categories || []);

  // For placeholder programs, just render a div without the dialog
  if (isPlaceholder) {
    return (
      <div
        className={cn(
          "absolute overflow-hidden rounded-lg p-2 text-white text-xs shadow-md transition-all duration-200",
          programColor,
          "cursor-default",
          getDensityPadding(density),
          // Enhanced styling for placeholder programs
          "border border-muted/30 bg-gradient-to-br from-muted/80 to-muted/60",
          "hover:from-muted/90 hover:to-muted/70 hover:shadow-lg"
        )}
        key={program.guideid}
        style={getEventStyle(program)}
        title={`${decodeHtml(program.title)} from ${formatDate(
          parseISODate(program.start_time),
          "HH:mm"
        )} to ${formatDate(parseISODate(program.end_time), "HH:mm")}`}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="truncate font-semibold">
                {decodeHtml(program.title)}
              </div>
              <div className="ml-1 whitespace-nowrap text-[10px] opacity-90">
                {formatDate(parseISODate(program.start_time), "HH:mm")} -{" "}
                {formatDate(parseISODate(program.end_time), "HH:mm")}
              </div>
            </div>
            {program.subtitle && program.subtitle !== "N/A" && (
              <div className="truncate text-[10px] italic opacity-80">
                {decodeHtml(program.subtitle)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProgramDialog
      key={program.guideid}
      program={program}
      trigger={
        <div
          className={cn(
            "absolute overflow-hidden rounded-lg p-2 text-xs shadow-md transition-all duration-200",
            programColor,
            hasEnded && "opacity-70",
            "cursor-pointer hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
            getDensityPadding(density),
            // Enhanced styling for special programs
            isPremiere &&
              "border-l-[4px] border-l-[hsl(var(--program-premiere))] shadow-[hsl(var(--program-premiere))/0.2] shadow-lg",
            isNew &&
              !isPremiere &&
              "border-l-[4px] border-l-[hsl(var(--program-new))] shadow-[hsl(var(--program-new))/0.2] shadow-lg",
            isLive &&
              "ring-2 ring-[hsl(var(--program-current-border))] ring-offset-1 ring-offset-background"
            // // Add subtle animation for live programs
            // isLive && "animate-pulse"
          )}
          style={getEventStyle(program)}
          title={`${decodeHtml(program.title)} from ${formatDate(
            parseISODate(program.start_time),
            "HH:mm"
          )} to ${formatDate(parseISODate(program.end_time), "HH:mm")}`}
        >
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="truncate font-semibold leading-tight">
                  {decodeHtml(program.title)}
                </div>
                <div className="ml-1 whitespace-nowrap font-medium text-[10px] opacity-90">
                  {formatDate(parseISODate(program.start_time), "HH:mm")} -{" "}
                  {formatDate(parseISODate(program.end_time), "HH:mm")}
                </div>
              </div>
              {program.subtitle && program.subtitle !== "N/A" && (
                <div className="truncate text-[10px] italic opacity-80">
                  {decodeHtml(program.subtitle)}
                </div>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-1">
                {CategoryIcon && (
                  <CategoryIcon className="h-3 w-3 opacity-70" />
                )}
                {program.categories && program.categories.length > 0 && (
                  <Badge className="text-[8px]" variant="secondary">
                    {program.categories[0]}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isLive && (
                  <Badge className="bg-[hsl(var(--program-current-border))] text-[8px] text-white">
                    LIVE
                  </Badge>
                )}
                {isUpNext && (
                  <Badge
                    className="bg-[hsl(var(--program-new))]/20 text-[8px]"
                    variant="outline"
                  >
                    UP NEXT
                  </Badge>
                )}
                {isPremiere && (
                  <Badge className="bg-[hsl(var(--program-premiere))] text-[8px] text-white">
                    PREMIERE
                  </Badge>
                )}
                {isNew && !isPremiere && !isUpNext && (
                  <Badge className="bg-[hsl(var(--program-new))] text-[8px] text-white">
                    NEW
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};

interface WeeklyGridViewProps {
  days: Date[];
  programs: Program[];
  startDayIndex: number;
  visibleDays: number;
  now: Date;
  filteredCategory: string | null;
  showPastPrograms: boolean;
  searchTerm: string;
  useCategories: boolean;
  density: DensityOption;
  categoryColors: { [key: string]: string };
  getProgramStatus: (program: Program) => {
    isLive: boolean;
    hasEnded: boolean;
    isUpNext: boolean;
  };
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function WeeklyGridView({
  days,
  programs,
  startDayIndex,
  visibleDays,
  now,
  filteredCategory,
  showPastPrograms,
  searchTerm,
  useCategories,
  density,
  categoryColors,
  getProgramStatus,
  gridRef,
}: WeeklyGridViewProps) {
  // Deduplicate programs by guideid or fallback key
  const uniquePrograms = useMemo(() => {
    const map = new Map<string, Program>();
    for (const program of programs) {
      const id = program.guideid || `${program.start_time}-${program.title}`;
      if (!map.has(id)) {
        map.set(id, program);
      }
    }
    return Array.from(map.values());
  }, [programs]);

  // Generate time slots array
  const timeSlots = useMemo(
    () => Array.from({ length: 48 }, (_, index) => index * 30),
    []
  );

  // Calculate event style for grid view
  const getEventStyle = (program: Program): React.CSSProperties => {
    if (!days.length) {
      return {};
    }

    const programStartDate = parseISODate(program.start_time);
    const programEndDate = parseISODate(program.end_time);

    // Calculate day index
    const startDay = new Date(days[0]);
    startDay.setHours(0, 0, 0, 0);
    const programDay = new Date(programStartDate);
    programDay.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor(
      (programDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayDiff < startDayIndex || dayDiff >= startDayIndex + visibleDays) {
      return { display: "none" };
    }

    const startMinutes =
      programStartDate.getHours() * 60 + programStartDate.getMinutes();
    const endMinutes =
      programEndDate.getHours() * 60 + programEndDate.getMinutes();
    const duration = endMinutes - startMinutes;
    const startRow = Math.floor(startMinutes / 30) + 2;
    const endRow = Math.ceil(endMinutes / 30) + 2;
    const rowSpan = endRow - startRow;
    const endTime = programEndDate.getMinutes();
    const gG = [0, 30].includes(endTime) ? 0 : -4;

    return {
      gridColumnEnd: dayDiff - startDayIndex + 3,
      gridColumnStart: dayDiff - startDayIndex + 2,
      gridRowEnd: endRow,
      gridRowStart: startRow,
      height: `calc(${duration * (timeSlotHeight / 30)}px + ${(rowSpan - 1) * gridGap + gG}px)`,
      marginTop: `${(startMinutes % 30) * (timeSlotHeight / 30)}px`,
      width: "100%",
    };
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full w-full overflow-auto" ref={gridRef}>
        <div className="min-w-fit p-4">
          <div
            className="relative grid gap-1"
            style={{
              gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays}, minmax(200px, 1fr))`,
            }}
            title="Weekly EPG Grid"
          >
            {/* Time column header */}
            <div
              className="sticky top-0 left-0 z-20 flex items-center justify-center rounded-tl-md border-r border-b bg-background/95 px-2 py-1 font-semibold text-sm"
              style={{
                height: `${headerHeight}px`,
                width: `${timeColumnWidth}px`,
              }}
            >
              Time
            </div>

            {/* Day headers */}
            {days
              .slice(startDayIndex, startDayIndex + visibleDays)
              .map((day, index) => (
                <div
                  className={cn(
                    "sticky top-0 z-10 flex items-center justify-center border-b bg-background/95 px-2 py-1 text-center font-semibold text-sm",
                    index === visibleDays - 1 ? "rounded-tr-md" : "border-r"
                  )}
                  key={day.toISOString()}
                  style={{ height: `${headerHeight}px` }}
                >
                  {format(day, "EEE, MMM d")}
                </div>
              ))}

            {/* Time slots and grid cells */}
            {timeSlots.map((minutes, slotIndex) => (
              <React.Fragment key={minutes}>
                {/* Time label */}
                <div
                  className={cn(
                    "sticky left-0 z-10 flex items-center justify-end border-r bg-background/95 px-2 py-1 text-muted-foreground text-xs",
                    slotIndex === timeSlots.length - 1
                      ? "rounded-bl-md"
                      : "border-b"
                  )}
                  style={{
                    height: `${timeSlotHeight}px`,
                    width: `${timeColumnWidth}px`,
                  }}
                >
                  {formatDate(
                    new Date(0, 0, 0, Math.floor(minutes / 60), minutes % 60),
                    "HH:mm"
                  )}
                </div>

                {/* Grid cells */}
                {Array.from({ length: visibleDays }).map((_, dayIndex) => (
                  <div
                    className={cn(
                      "relative border-t",
                      getGridCellBorderStyle(
                        dayIndex,
                        visibleDays,
                        slotIndex,
                        timeSlots.length
                      )
                    )}
                    key={`timeslot-${dayIndex}-${minutes}`}
                    style={{
                      height: `${timeSlotHeight}px`,
                    }}
                  />
                ))}
              </React.Fragment>
            ))}

            {/* Current time indicator */}
            {(() => {
              const today = new Date(now);
              const currentDayIndex = days.findIndex((day) => {
                const d = new Date(day);
                return (
                  d.getDate() === today.getDate() &&
                  d.getMonth() === today.getMonth() &&
                  d.getFullYear() === today.getFullYear()
                );
              });

              if (
                currentDayIndex >= startDayIndex &&
                currentDayIndex < startDayIndex + visibleDays
              ) {
                const totalMinutes = now.getHours() * 60 + now.getMinutes();
                const topPosition =
                  (totalMinutes / 30) * (timeSlotHeight + gridGap) +
                  headerHeight;

                const gridColumnStart = currentDayIndex - startDayIndex + 2;

                return (
                  <div
                    className="absolute z-20 h-0.5 w-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                    style={{
                      gridColumn: `${gridColumnStart} / span 1`,
                      top: `${topPosition}px`,
                    }}
                  >
                    <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 rounded bg-red-500 px-1.5 py-0.5 font-semibold text-[10px] text-white">
                      {format(now, "HH:mm")}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Program blocks */}
            {(() => {
              // Filter first
              const filtered = uniquePrograms.filter((program) => {
                const { hasEnded } = getProgramStatus(program);
                if (!showPastPrograms && hasEnded) {
                  return false;
                }
                if (
                  filteredCategory &&
                  !program.categories?.includes(filteredCategory)
                ) {
                  return false;
                }
                if (
                  searchTerm &&
                  !program.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  !program.subtitle
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) &&
                  !program.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
                ) {
                  return false;
                }
                return true;
              });
              // Deduplicate by guideid after filtering
              const deduped = Array.from(
                new Map(filtered.map((p) => [p.guideid, p])).values()
              );
              return deduped.map((program) => {
                // Check if program has special styling
                const isPlaceholder = isPlaceholderProgram(program.title);

                // Determine program color based on status and settings
                const programColor = getProgramColorForDisplay(
                  program,
                  useCategories,
                  categoryColors,
                  getProgramStatus
                );

                return (
                  <ProgramItem
                    density={density}
                    getEventStyle={getEventStyle}
                    getProgramStatus={getProgramStatus}
                    isPlaceholder={isPlaceholder}
                    key={program.guideid}
                    program={program}
                    programColor={programColor}
                  />
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
