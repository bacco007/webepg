"use client";

import { ProgramDialog } from "@/components/epg/program-dialog";
import type { Program } from "@/components/epg/types";
import {
  type DensityOption,
  getDensityPadding,
  getDensityTextSize,
  getProgramIndicators,
  getSpecialTitleClass,
  isCompactMode,
  isPlaceholderProgram,
} from "@/components/epg/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, parseISODate } from "@/lib/date-utils";
// Add import for decodeHtml at the top of the file
import { decodeHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";

// Extracted ProgramItem component
interface ProgramItemProps {
  program: Program;
  density: DensityOption;
  filteredCategory: string | null;
  getProgramStatus: (program: Program) => {
    isLive: boolean;
    hasEnded: boolean;
    isUpNext: boolean;
  };
}

function ProgramItem({
  program,
  density,
  filteredCategory,
  getProgramStatus,
}: ProgramItemProps) {
  const { isLive, hasEnded, isUpNext } = getProgramStatus(program);

  // Check if program has special styling
  const specialTitleClass = getSpecialTitleClass(program.title);
  const isPlaceholder = isPlaceholderProgram(program.title);

  // For placeholder programs, render a div without the dialog
  if (isPlaceholder) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-md p-3",
          specialTitleClass,
          getDensityPadding(density)
        )}
        key={program.guideid}
      >
        {/* Time column */}
        <div className="flex w-16 flex-col items-center text-center">
          <div className="font-medium text-sm">
            {formatDate(parseISODate(program.start_time), "HH:mm")}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatDate(parseISODate(program.end_time), "HH:mm")}
          </div>
        </div>

        {/* Program content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("font-semibold", getDensityTextSize(density))}>
              {decodeHtml(program.title)}
            </h3>
          </div>

          {program.subtitle && program.subtitle !== "N/A" && (
            <div className="text-muted-foreground text-sm italic">
              {decodeHtml(program.subtitle)}
            </div>
          )}

          <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground text-xs">
            <span>
              {Math.round(
                (parseISODate(program.end_time).getTime() -
                  parseISODate(program.start_time).getTime()) /
                  (1000 * 60)
              )}{" "}
              min
            </span>
          </div>
        </div>
      </div>
    );
  }

  const { isPremiere, isNew } = getProgramIndicators(program);

  return (
    <ProgramDialog
      key={program.guideid}
      program={program}
      trigger={
        <div
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-muted/50",
            isLive && "bg-[hsl(var(--program-current))]/10",
            isUpNext && "bg-[hsl(var(--program-new))]/10",
            hasEnded && "bg-[hsl(var(--program-past))]/10",
            getDensityPadding(density)
          )}
        >
          {/* Time column with status indicator */}
          <div className="relative flex w-16 flex-col items-center text-center">
            {isLive && (
              <div className="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-[hsl(var(--program-current-border))]" />
            )}
            {isUpNext && (
              <div className="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-[hsl(var(--program-new))]" />
            )}
            {hasEnded && (
              <div className="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-[hsl(var(--program-past-foreground))]/30" />
            )}
            <div className="font-medium text-sm">
              {formatDate(parseISODate(program.start_time), "HH:mm")}
            </div>
            <div className="text-muted-foreground text-xs">
              {formatDate(parseISODate(program.end_time), "HH:mm")}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {isLive && (
                <Badge className="bg-[hsl(var(--program-current-border))] text-[10px] text-white">
                  LIVE
                </Badge>
              )}
              {isUpNext && (
                <Badge
                  className="bg-[hsl(var(--program-new))]/20 text-[10px]"
                  variant="outline"
                >
                  UP NEXT
                </Badge>
              )}
              {isPremiere && (
                <Badge className="bg-[hsl(var(--program-premiere))] text-[10px] text-white">
                  PREMIERE
                </Badge>
              )}
              {isNew && !isPremiere && !isUpNext && (
                <Badge className="bg-[hsl(var(--program-new))] text-[10px] text-white">
                  NEW
                </Badge>
              )}
            </div>
          </div>

          {/* Program content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn("font-semibold", getDensityTextSize(density))}>
                {decodeHtml(program.title)}
              </h3>
              <div className="flex flex-wrap gap-1">
                {program.categories?.map((category, _i) => (
                  <Badge
                    className={cn(
                      "text-[10px]",
                      filteredCategory === category && "bg-primary/20",
                      isCompactMode(density) && "hidden sm:inline-flex"
                    )}
                    key={category}
                    variant="secondary"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {program.subtitle && program.subtitle !== "N/A" && (
              <div className="text-muted-foreground text-sm italic">
                {decodeHtml(program.subtitle)}
              </div>
            )}

            <div className="mt-1 flex flex-wrap gap-2 text-muted-foreground text-xs">
              <span>
                {Math.round(
                  (parseISODate(program.end_time).getTime() -
                    parseISODate(program.start_time).getTime()) /
                    (1000 * 60)
                )}{" "}
                min
              </span>
              {program.rating && program.rating !== "N/A" && (
                <span className="rounded bg-muted px-1.5 py-0.5">
                  {program.rating}
                </span>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}

interface WeeklyListViewProps {
  days: Date[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  groupedPrograms: Record<string, Program[]>;
  showTimeBlocks: boolean;
  getProgramStatus: (program: Program) => {
    isLive: boolean;
    hasEnded: boolean;
    isUpNext: boolean;
  };
  calculateProgress: (start: string, end: string) => number;
  density: DensityOption;
  filteredCategory: string | null;
  showPastPrograms: boolean;
  setShowPastPrograms: (show: boolean) => void;
}

export function WeeklyListView({
  days,
  selectedDay,
  setSelectedDay,
  groupedPrograms,
  showTimeBlocks,
  getProgramStatus,
  density,
  filteredCategory,
  showPastPrograms,
  setShowPastPrograms,
}: WeeklyListViewProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Day selector tabs */}
      <div className="border-b bg-background px-4">
        <ScrollArea className="w-full">
          <div className="flex">
            {days.map((day, index) => (
              <Button
                className="rounded-none border-transparent border-b-2 px-4 py-2 font-medium"
                key={day.toISOString()}
                onClick={() => setSelectedDay(index)}
                style={{
                  borderBottomColor:
                    selectedDay === index
                      ? "hsl(var(--primary))"
                      : "transparent",
                }}
                variant={selectedDay === index ? "default" : "ghost"}
              >
                {formatDate(day, "EEE, MMM d")}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Program list */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {Object.entries(groupedPrograms).length > 0 ? (
            Object.entries(groupedPrograms).map(([blockName, programs]) => (
              <div className="mb-6" key={blockName}>
                {showTimeBlocks && (
                  <h3 className="mb-2 border-b pb-1 font-semibold text-lg">
                    {blockName}
                  </h3>
                )}
                <div className="divide-y">
                  {programs.map((program) => (
                    <ProgramItem
                      density={density}
                      filteredCategory={filteredCategory}
                      getProgramStatus={getProgramStatus}
                      key={program.guideid}
                      program={program}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="font-medium text-lg">No programs found</div>
              <p className="text-muted-foreground">
                {filteredCategory
                  ? `No ${filteredCategory} programs found for this day.`
                  : "No programs found for this day."}
              </p>
              {!showPastPrograms && (
                <Button
                  className="mt-2"
                  onClick={() => setShowPastPrograms(true)}
                  variant="link"
                >
                  Show past programs
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
