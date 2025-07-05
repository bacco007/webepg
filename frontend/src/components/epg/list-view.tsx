"use client";

import { ChevronDown, Circle, Film, Music, Star, Tv } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  differenceInMinutes,
  formatDate,
  isAfter,
  isBefore,
  parseISODate,
} from "@/lib/date-utils";
import { decodeHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";
import { type ProgramStatus, ProgramTooltip } from "./program-tooltip";
import type { Channel, Program } from "./types";
import {
  getChannelName,
  getDesktopProgramStyling,
  getMobileProgramStyling,
  getProgramIndicators,
  getSpecialTitleClass,
  hasValidLCN,
  isPlaceholderProgram,
} from "./utils";

// Regex for numeric validation - defined at top level for performance
const NUMERIC_REGEX = /^\d+$/;

interface ListViewProps {
  channels: Channel[];
  currentTime: Date;
  displayNameType?: "clean" | "location" | "real";
  className?: string;
  showProgramDetails?: boolean;
  dataSource?: string;
  onProgramSelect?: (program: Program) => void;
}

// Get program category icon helper function
function getProgramCategoryIcon(categories?: string[]) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const category = categories[0]?.toLowerCase() || "";

  if (category.includes("music")) {
    return <Music className="h-3 w-3" />;
  }
  if (category.includes("movie") || category.includes("film")) {
    return <Film className="h-3 w-3" />;
  }
  if (category.includes("series") || category.includes("show")) {
    return <Tv className="h-3 w-3" />;
  }

  return null;
}

// Mobile program item component
interface MobileProgramItemProps {
  program: Program;
  status: ProgramStatus;
  categoryIcon: React.ReactNode;
  isPremiere: boolean;
  isNew: boolean;
  isPlaceholder: boolean;
  specialTitleClass: string | null;
  progressPercentage: number;
  onProgramClick: (program: Program) => void;
  channelId: string;
  channelLcn: string;
}

const MobileProgramItem = ({
  program,
  status,
  categoryIcon,
  isPremiere,
  isNew,
  isPlaceholder,
  specialTitleClass,
  progressPercentage,
  onProgramClick,
  channelId,
  channelLcn,
}: MobileProgramItemProps) => (
  <div
    className={cn(
      "relative flex cursor-pointer items-center px-3 py-2 hover:bg-muted/50",
      "border-l-[3px]",
      getMobileProgramStyling(isPlaceholder, specialTitleClass, status)
    )}
    key={`${channelId}-${channelLcn}-${program.guideid}`}
    onClick={() => onProgramClick(program)}
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <div className="mr-2 whitespace-nowrap font-medium text-muted-foreground text-xs">
          {formatDate(program.start_time, "HH:mm")}-
          {formatDate(program.end_time, "HH:mm")}
        </div>

        <div className="flex flex-1 items-center gap-1">
          {status === "now-playing" && !isPlaceholder && (
            <Circle className="mr-0.5 h-2 w-2 flex-shrink-0 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))]" />
          )}
          <span
            className={cn(
              "truncate font-medium text-sm",
              isPlaceholder
                ? "text-white"
                : status === "now-playing" &&
                    "text-[hsl(var(--program-current-foreground))]"
            )}
          >
            {decodeHtml(program.title)}
          </span>
          {!isPlaceholder && isPremiere && (
            <Star className="ml-1 h-3 w-3 text-[hsl(var(--program-premiere))]" />
          )}
          {!isPlaceholder && isNew && (
            <Badge
              className="ml-1 h-4 border-[hsl(var(--program-new))] px-1 font-bold text-[8px] text-[hsl(var(--program-new))]"
              variant="outline"
            >
              NEW
            </Badge>
          )}
          {!isPlaceholder && categoryIcon && (
            <span className="ml-1">{categoryIcon}</span>
          )}
        </div>
      </div>

      {program.subtitle && program.subtitle !== "N/A" && (
        <p className="mt-0.5 truncate pl-12 text-muted-foreground text-xs">
          {decodeHtml(program.subtitle)}
        </p>
      )}
    </div>

    <div className="ml-2 flex items-center gap-2">
      {!isPlaceholder &&
        program.categories &&
        program.categories.length > 0 && (
          <Badge className="text-[10px]" variant="secondary">
            {program.categories[0]}
          </Badge>
        )}
      {!isPlaceholder && progressPercentage > 0 && progressPercentage < 100 && (
        <div className="flex h-1 w-8 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-[hsl(var(--program-current-border))]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  </div>
);

// Placeholder program item component
interface PlaceholderProgramItemProps {
  program: Program;
  specialTitleClass: string | null;
  channelId: string;
  channelLcn: string;
}

const PlaceholderProgramItem = ({
  program,
  specialTitleClass,
  channelId,
  channelLcn,
}: PlaceholderProgramItemProps) => (
  <div
    className={cn(
      "relative flex items-center px-3 py-2",
      "border-l-[3px] border-l-muted",
      specialTitleClass
    )}
    key={`${channelId}-${channelLcn}-${program.guideid}`}
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <div className="mr-2 whitespace-nowrap font-medium text-muted-foreground text-xs">
          {formatDate(program.start_time, "HH:mm")}-
          {formatDate(program.end_time, "HH:mm")}
        </div>

        <div className="flex flex-1 items-center gap-1">
          <span className="truncate font-medium text-sm">
            {decodeHtml(program.title)}
          </span>
        </div>
      </div>

      {program.subtitle && program.subtitle !== "N/A" && (
        <p className="mt-0.5 truncate pl-12 text-muted-foreground text-xs">
          {decodeHtml(program.subtitle)}
        </p>
      )}
    </div>

    <div className="ml-2 flex items-center gap-2">
      <div className="whitespace-nowrap font-medium text-muted-foreground text-xs">
        {differenceInMinutes(
          parseISODate(program.end_time),
          parseISODate(program.start_time)
        )}
        min
      </div>
    </div>
  </div>
);

// Desktop program item component
interface DesktopProgramItemProps {
  program: Program;
  status: ProgramStatus;
  categoryIcon: React.ReactNode;
  isPremiere: boolean;
  isNew: boolean;
  progressPercentage: number;
  onProgramClick: (program: Program) => void;
  showProgramDetails: boolean;
  channelId: string;
  channelLcn: string;
}

const DesktopProgramItem = ({
  program,
  status,
  categoryIcon,
  isPremiere,
  isNew,
  progressPercentage,
  onProgramClick,
  showProgramDetails,
  channelId,
  channelLcn,
}: DesktopProgramItemProps) => (
  <TooltipProvider key={`${channelId}-${channelLcn}-${program.guideid}`}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative flex cursor-pointer items-center px-3 py-2 hover:bg-muted/50",
            "border-l-[3px]",
            getDesktopProgramStyling(status)
          )}
          onClick={() => onProgramClick(program)}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="mr-2 whitespace-nowrap font-medium text-muted-foreground text-xs">
                {formatDate(program.start_time, "HH:mm")}-
                {formatDate(program.end_time, "HH:mm")}
              </div>

              <div className="flex flex-1 items-center gap-1">
                {status === "now-playing" && (
                  <Circle className="mr-0.5 h-2 w-2 flex-shrink-0 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))]" />
                )}
                <span
                  className={cn(
                    "truncate font-medium text-sm",
                    status === "now-playing" &&
                      "text-[hsl(var(--program-current-foreground))]"
                  )}
                >
                  {decodeHtml(program.title)}
                </span>
                {isPremiere && (
                  <Star className="ml-1 h-3 w-3 text-[hsl(var(--program-premiere))]" />
                )}
                {isNew && (
                  <Badge
                    className="ml-1 h-4 border-[hsl(var(--program-new))] px-1 font-bold text-[8px] text-[hsl(var(--program-new))]"
                    variant="outline"
                  >
                    NEW
                  </Badge>
                )}
                {categoryIcon && <span className="ml-1">{categoryIcon}</span>}
              </div>
            </div>

            {program.subtitle && program.subtitle !== "N/A" && (
              <p className="mt-0.5 truncate pl-12 text-muted-foreground text-xs">
                {decodeHtml(program.subtitle)}
              </p>
            )}
          </div>

          <div className="ml-2 flex items-center gap-2">
            {program.categories && program.categories.length > 0 && (
              <Badge className="text-[10px]" variant="secondary">
                {program.categories[0]}
              </Badge>
            )}
            <div className="whitespace-nowrap font-medium text-muted-foreground text-xs">
              {differenceInMinutes(
                parseISODate(program.end_time),
                parseISODate(program.start_time)
              )}
              min
            </div>
          </div>

          {/* Progress indicator for currently playing programs */}
          {status === "now-playing" && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
              <div
                className="absolute right-0 bottom-0 left-0 h-1.5 bg-[hsl(var(--program-current-border))/30]"
                style={{
                  clipPath: `polygon(0 0, ${progressPercentage}% 0, ${progressPercentage}% 100%, 0 100%)`,
                }}
              />
            </div>
          )}
        </div>
      </TooltipTrigger>
      {showProgramDetails && (
        <ProgramTooltip
          program={program}
          progressPercentage={progressPercentage}
          side="right"
          status={status}
        />
      )}
    </Tooltip>
  </TooltipProvider>
);

export function ListView({
  channels,
  currentTime,
  displayNameType = "clean",
  className,
  showProgramDetails = true,
  dataSource = "xmlepg_FTASYD",
  onProgramSelect,
}: ListViewProps) {
  const [expandedChannels, setExpandedChannels] = useState<
    Record<string, boolean>
  >({});
  const isMobile = useIsMobile();

  // Sort channels by channel number then name
  const sortedChannels = [...channels].sort((a, b) => {
    // Check if both channels have valid LCNs
    const aHasLCN = hasValidLCN(a);
    const bHasLCN = hasValidLCN(b);

    // If both have LCNs, sort by LCN
    if (aHasLCN && bHasLCN) {
      // Extract the numeric part for proper numeric sorting
      const aLCN = a.channel.lcn;
      const bLCN = b.channel.lcn;

      // Check if both LCNs are purely numeric
      const aIsNumeric = NUMERIC_REGEX.test(aLCN);
      const bIsNumeric = NUMERIC_REGEX.test(bLCN);

      // If both are numeric, sort numerically
      if (aIsNumeric && bIsNumeric) {
        return Number.parseInt(aLCN, 10) - Number.parseInt(bLCN, 10);
      }

      // If only one is numeric, prioritize numeric values
      if (aIsNumeric) {
        return -1;
      }
      if (bIsNumeric) {
        return 1;
      }

      // If both are non-numeric, sort alphabetically
      return aLCN.localeCompare(bLCN);
    }

    // If only one has LCN, prioritize the one with LCN
    if (aHasLCN) {
      return -1;
    }
    if (bHasLCN) {
      return 1;
    }

    // If neither has LCN, sort by name
    return getChannelName(a, displayNameType).localeCompare(
      getChannelName(b, displayNameType)
    );
  });

  // Get current program for each channel
  const getCurrentProgram = (channelId: string) => {
    const channelData = channels.find((c) => c.channel.id === channelId);
    if (!channelData) {
      return null;
    }

    const now = currentTime;
    return channelData.programs.find((program) => {
      const startTime = parseISODate(program.start_time);
      const endTime = parseISODate(program.end_time);
      return isAfter(now, startTime) && isBefore(now, endTime);
    });
  };

  // Get all programs for a channel
  const getChannelPrograms = (channelId: string, channelLcn: string) => {
    const channelData = channels.find(
      (c) => c.channel.id === channelId && c.channel.lcn === channelLcn
    );
    if (!channelData) {
      return [];
    }

    // Create a map to track unique programs by guideid
    const uniquePrograms = new Map<string, Program>();

    // Process each program
    for (const program of channelData.programs) {
      // If guideid is missing, generate one based on start time
      const programId =
        program.guideid || `${program.start_time}-${program.title}`;

      // Only add if we haven't seen this program before
      if (!uniquePrograms.has(programId)) {
        uniquePrograms.set(programId, program);
      }
    }

    // Convert back to array and sort by start time
    return Array.from(uniquePrograms.values()).sort(
      (a, b) =>
        parseISODate(a.start_time).getTime() -
        parseISODate(b.start_time).getTime()
    );
  };

  // Get program status
  const getProgramStatus = (program: Program): ProgramStatus => {
    const startTime = parseISODate(program.start_time);
    const endTime = parseISODate(program.end_time);

    if (isAfter(currentTime, startTime) && isBefore(currentTime, endTime)) {
      return "now-playing";
    }
    if (isBefore(currentTime, startTime)) {
      return "upcoming";
    }
    return "ended";
  };

  // Toggle channel expansion
  const toggleChannel = (channelId: string, channelNumber: string) => {
    const key = `${channelId}-${channelNumber}`;
    setExpandedChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle program selection
  const handleProgramClick = (program: Program) => {
    if (onProgramSelect && !isPlaceholderProgram(program.title)) {
      onProgramSelect(program);
    }
  };

  return (
    <ScrollArea className={cn("pr-4", className)}>
      {sortedChannels.map((channel) => {
        const currentProgram = getCurrentProgram(channel.channel.id);
        const allPrograms = getChannelPrograms(
          channel.channel.id,
          channel.channel.lcn
        );
        const channelKey = `${channel.channel.id}-${channel.channel.lcn}`;

        return (
          <div
            className="mb-4 overflow-hidden rounded-md border shadow-sm"
            key={channelKey}
          >
            <div
              className="flex cursor-pointer items-center bg-muted/20 p-3 hover:bg-muted/30"
              onClick={() =>
                toggleChannel(channel.channel.id, channel.channel.lcn)
              }
            >
              <div className="mr-3 h-10 w-10 flex-shrink-0">
                <img
                  alt=""
                  className="h-full w-full rounded-sm object-contain dark:hidden"
                  src={channel.channel.icon.light || "/placeholder.svg"}
                />
                <img
                  alt=""
                  className="hidden h-full w-full rounded-sm object-contain dark:block"
                  src={channel.channel.icon.dark || "/placeholder.svg"}
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <Link
                    className={cn(
                      "max-w-[200px] break-words font-medium text-sm hover:underline"
                    )}
                    href={`/channel/${channel.channel.slug}?source=${dataSource}`}
                    onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking the link
                  >
                    {getChannelName(channel, displayNameType)}
                  </Link>
                  {channel.channel.lcn && channel.channel.lcn !== "N/A" && (
                    <Badge className="h-5 text-xs" variant="outline">
                      {channel.channel.lcn}
                    </Badge>
                  )}
                </div>

                {currentProgram && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1">
                      <Circle className="h-2 w-2 flex-shrink-0 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))]" />
                      <span className="truncate font-medium text-sm">
                        {decodeHtml(currentProgram.title)}
                      </span>
                    </div>
                    {currentProgram.subtitle &&
                      currentProgram.subtitle !== "N/A" && (
                        <p className="truncate pl-3 text-muted-foreground text-xs">
                          {decodeHtml(currentProgram.subtitle)}
                        </p>
                      )}
                  </div>
                )}

                {!currentProgram && (
                  <div className="mt-1 text-muted-foreground text-xs">
                    No program currently airing
                  </div>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform",
                  expandedChannels[channelKey] ? "rotate-180" : ""
                )}
              />
            </div>

            {expandedChannels[channelKey] && (
              <div className="divide-y">
                {allPrograms.length > 0 ? (
                  allPrograms.map((program) => {
                    const status = getProgramStatus(program);
                    const categoryIcon = getProgramCategoryIcon(
                      program.categories
                    );
                    const { isPremiere, isNew } = getProgramIndicators(program);

                    // Check if program has special styling
                    const specialTitleClass = getSpecialTitleClass(
                      program.title
                    );
                    const isPlaceholder = isPlaceholderProgram(program.title);

                    // Calculate progress percentage for currently playing programs
                    const progressPercentage =
                      status === "now-playing"
                        ? Math.min(
                            100,
                            (differenceInMinutes(
                              currentTime,
                              parseISODate(program.start_time)
                            ) /
                              differenceInMinutes(
                                parseISODate(program.end_time),
                                parseISODate(program.start_time)
                              )) *
                              100
                          )
                        : 0;

                    // For mobile, we'll use a direct click handler instead of tooltips
                    if (isMobile) {
                      return (
                        <MobileProgramItem
                          categoryIcon={categoryIcon}
                          channelId={channel.channel.id}
                          channelLcn={channel.channel.lcn}
                          isNew={Boolean(isNew)}
                          isPlaceholder={isPlaceholder}
                          isPremiere={Boolean(isPremiere)}
                          key={`${channel.channel.id}-${channel.channel.lcn}-${program.guideid}`}
                          onProgramClick={handleProgramClick}
                          program={program}
                          progressPercentage={progressPercentage}
                          specialTitleClass={specialTitleClass}
                          status={status}
                        />
                      );
                    }

                    // For placeholder programs, render without tooltip
                    if (isPlaceholder) {
                      return (
                        <PlaceholderProgramItem
                          channelId={channel.channel.id}
                          channelLcn={channel.channel.lcn}
                          key={`${channel.channel.id}-${channel.channel.lcn}-${program.guideid}`}
                          program={program}
                          specialTitleClass={specialTitleClass}
                        />
                      );
                    }

                    // For desktop, use tooltips for non-placeholder programs
                    return (
                      <DesktopProgramItem
                        categoryIcon={categoryIcon}
                        channelId={channel.channel.id}
                        channelLcn={channel.channel.lcn}
                        isNew={Boolean(isNew)}
                        isPremiere={Boolean(isPremiere)}
                        key={`${channel.channel.id}-${channel.channel.lcn}-${program.guideid}`}
                        onProgramClick={handleProgramClick}
                        program={program}
                        progressPercentage={progressPercentage}
                        showProgramDetails={showProgramDetails}
                        status={status}
                      />
                    );
                  })
                ) : (
                  <div className="p-3 text-muted-foreground text-sm italic">
                    No programs available for this channel
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </ScrollArea>
  );
}
