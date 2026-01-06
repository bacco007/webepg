"use client";

import { Circle, Star, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate, parseISODate } from "@/lib/date-utils";
import { decodeHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";
import { type ProgramStatus, ProgramTooltip } from "./program-tooltip";
import type { Program } from "./types";
import {
  getProgramColors,
  getProgramIndicators,
  getProgramStatus,
  getSpecialTitleClass,
  getZIndex,
  isPlaceholderProgram,
} from "./utils";

// Program content component
interface ProgramContentProps {
  program: Program;
  isVeryNarrow: boolean;
  isHovered: boolean;
  showMobileTooltip: boolean;
  isCurrentlyAiring: boolean;
  isPlaceholder: boolean;
  isPremiere: boolean;
  isNew: boolean;
  hasValidSubtitle: boolean;
  isNarrow: boolean;
  isPast: boolean;
  duration: string;
  textOffset: number;
  titleRef: React.RefObject<HTMLDivElement | null>;
  timeRef: React.RefObject<HTMLDivElement | null>;
  closeMobileTooltip: (e: React.MouseEvent) => void;
  left?: number;
}

const ProgramContent = ({
  program,
  isVeryNarrow,
  isHovered,
  showMobileTooltip,
  isCurrentlyAiring,
  isPlaceholder,
  isPremiere,
  isNew,
  hasValidSubtitle,
  isNarrow,
  isPast,
  duration,
  textOffset,
  titleRef,
  timeRef,
  closeMobileTooltip,
  left,
}: ProgramContentProps & { left?: number }) => {
  // Determine if the program is off-screen to the left
  const isOffscreenLeft = typeof left === "number" && left < 0;
  // Calculate sticky style if off-screen
  const stickyStyle = isOffscreenLeft
    ? {
        background: "inherit",
        bottom: 0,
        left: `${-left}px`,
        paddingLeft: 0,
        paddingRight: 0,
        position: "absolute" as const,
        top: 0, // inherit background for seamless look
        width: `calc(100% + ${left}px)`,
        zIndex: 2,
      }
    : { paddingLeft: `${textOffset}px` };

  return (
    <div className="flex h-full flex-col justify-between" style={stickyStyle}>
      {/* Title with indicators */}
      <div className="flex items-center gap-1">
        {/* Show a dot for currently airing programs */}
        {isCurrentlyAiring && !isVeryNarrow && !isPlaceholder && (
          <Circle className="mr-0.5 h-2 w-2 shrink-0 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))]" />
        )}

        <div className="flex-1 truncate text-xs" ref={titleRef}>
          {isVeryNarrow && !isHovered && !showMobileTooltip
            ? "..."
            : decodeHtml(program.title)}
        </div>

        {/* Show indicators for new/premiere if there's space */}
        {!(isVeryNarrow || isPlaceholder) && (
          <>
            {isPremiere && (
              <Star className="h-3 w-3 shrink-0 text-[hsl(var(--program-premiere))]" />
            )}
            {isNew && !isPremiere && (
              <Badge
                className="ml-1 h-4 shrink-0 border-[hsl(var(--program-new))] px-1 font-bold text-[8px] text-[hsl(var(--program-new))]"
                variant="outline"
              >
                NEW
              </Badge>
            )}
          </>
        )}

        {/* Close button for mobile expanded view */}
        {showMobileTooltip && (
          <button
            className="absolute top-1 right-1 rounded-full bg-muted/80 p-0.5 text-muted-foreground"
            onClick={closeMobileTooltip}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Show subtitle if valid and enough space */}
      {(!isNarrow || isHovered || showMobileTooltip) && hasValidSubtitle && (
        <div
          className={`text-[10px] ${
            isPast ? "text-muted-foreground/70" : "text-muted-foreground"
          } truncate`}
        >
          {decodeHtml(program.subtitle || "")}
        </div>
      )}

      {/* Show time */}
      <div className="mt-auto flex items-center text-[10px]" ref={timeRef}>
        <span className="truncate">{duration}</span>
        {program.rating && program.rating !== "N/A" && (
          <span className="ml-1 shrink-0 rounded bg-muted px-1 text-[9px]">
            {program.rating}
          </span>
        )}
      </div>
    </div>
  );
};

interface ProgramItemProps {
  program: Program & {
    left: number;
    width: number;
    isPast?: boolean;
    isCurrentlyAiring?: boolean;
    progressPercentage?: number;
  };
  left: number;
  width: number;
  isPast?: boolean;
  isCurrentlyAiring?: boolean;
  progressPercentage?: number;
  showDetails?: boolean;
  onSelect?: (program: Program) => void;
  isSelected?: boolean;
}

// Helper function to handle program click
const handleProgramClickHelper = (
  isMobile: boolean,
  onSelectCallback: ((program: Program) => void) | undefined,
  isPlaceholder: boolean,
  setShowMobileTooltip: (show: boolean) => void,
  showMobileTooltip: boolean,
  programData: Program
) => {
  if (isMobile) {
    if (onSelectCallback && !isPlaceholder) {
      onSelectCallback(programData);
    } else {
      setShowMobileTooltip(!showMobileTooltip);
    }
  }
};

// Helper function to close mobile tooltip
const closeMobileTooltipHelper = (
  e: React.MouseEvent,
  setShowMobileTooltip: (show: boolean) => void
) => {
  e.stopPropagation();
  setShowMobileTooltip(false);
};

// Helper function to determine if tooltip should be used
const shouldUseTooltipHelper = (
  isMobile: boolean,
  showDetails: boolean,
  isPlaceholder: boolean
) => !isMobile && showDetails && !isPlaceholder;

// Helper function to render mobile tooltip
const renderMobileTooltipHelper = (
  isMobile: boolean,
  showMobileTooltip: boolean,
  useTooltip: boolean,
  showDetails: boolean,
  isPlaceholder: boolean,
  left: number,
  program: Program,
  progressPercentage: number,
  programStatus: ProgramStatus
) => {
  if (
    !(isMobile && showMobileTooltip) ||
    useTooltip ||
    !showDetails ||
    isPlaceholder
  ) {
    return null;
  }

  return (
    <div
      className="absolute top-full left-0 z-[1000] mt-2 w-[280px] max-w-[95vw]"
      style={{
        left: left + 280 > window.innerWidth ? "auto" : left,
        right: left + 280 > window.innerWidth ? "0" : "auto",
      }}
    >
      <ProgramTooltip
        className="shadow-xl"
        program={program}
        progressPercentage={progressPercentage}
        side="top"
        status={programStatus}
      />
    </div>
  );
};

export function ProgramItem({
  program,
  left,
  width,
  isPast = false,
  isCurrentlyAiring = false,
  progressPercentage = 0,
  showDetails = true,
  onSelect,
  isSelected = false,
}: ProgramItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [isTimeTruncated, setIsTimeTruncated] = useState(false);
  const [textOffset, setTextOffset] = useState(0);
  const [showMobileTooltip, setShowMobileTooltip] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const startTime = parseISODate(program.start_time);
  const endTime = parseISODate(program.end_time);

  const formattedStartTime = formatDate(startTime, "HH:mm");
  const formattedEndTime = formatDate(endTime, "HH:mm");
  const duration = `${formattedStartTime} - ${formattedEndTime}`;

  // Determine program status for tooltip
  const programStatus = getProgramStatus(isCurrentlyAiring, isPast);

  // Determine if the program is too narrow to show full content
  const isNarrow = width < 100;
  const isVeryNarrow = width < 50;

  // Check if subtitle is "N/A" and should be omitted
  const hasValidSubtitle = Boolean(
    program.subtitle && program.subtitle !== "N/A"
  );

  // Check if program is new or premiere
  const { isPremiere, isNew } = getProgramIndicators(program);

  // Check if program has special styling
  const specialTitleClass = getSpecialTitleClass(program.title);
  const isPlaceholder = isPlaceholderProgram(program.title);

  // Calculate text offset when program overlaps with channel sidebar
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Check if the program starts before the visible area (negative left position)
    if (left < 0) {
      // Calculate how much of the program is hidden
      const hiddenWidth = Math.abs(left);

      // Set text offset to make it visible in the visible portion
      setTextOffset(Math.min(hiddenWidth, width / 2));
    } else {
      setTextOffset(0);
    }
  }, [left, width]);

  // Check if title or time is truncated
  useEffect(() => {
    if (!(titleRef.current && timeRef.current)) {
      return;
    }

    // Check if title is truncated
    setIsTitleTruncated(
      titleRef.current.scrollWidth > titleRef.current.clientWidth
    );

    // Check if time is truncated
    setIsTimeTruncated(
      timeRef.current.scrollWidth > timeRef.current.clientWidth
    );
  }, []);

  // Determine background color based on program status
  const { bgColor, textColor, hoverBgColor, backgroundStyle } = getProgramColors(
    specialTitleClass,
    isPast,
    isCurrentlyAiring
  );

  // Determine if we should show expanded view on hover
  const shouldExpandOnHover =
    isTitleTruncated ||
    isTimeTruncated ||
    isVeryNarrow ||
    (hasValidSubtitle && isNarrow);

  // Determine if we should use tooltip or direct click
  const useTooltip = shouldUseTooltipHelper(
    isMobile,
    showDetails,
    isPlaceholder
  );

  // Determine if the program is partially off-screen to the left
  const isOffscreenLeft = left < 0;
  // Calculate the visible width of the program block
  const visibleWidth = Math.max(0, Math.min(width + left, width));

  // Render the sticky overlay if the program is off-screen to the left
  const stickyTextOverlay =
    isOffscreenLeft && visibleWidth > 0 ? (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-30 flex h-full items-center"
        style={{ width: `${visibleWidth}px` }}
      >
        <div
          className="truncate bg-background/80 px-2 py-1 font-semibold text-xs shadow"
          style={{ width: "100%" }}
        >
          {decodeHtml(program.title)}
        </div>
      </div>
    ) : null;

  // Render the program item
  const programItem = (
    <div
      className={cn(
        "absolute top-0 h-full cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-1"
      )}
      data-program-id={program.guideid}
      data-program-title={program.title}
      onClick={() =>
        handleProgramClickHelper(
          isMobile,
          onSelect,
          isPlaceholder,
          setShowMobileTooltip,
          showMobileTooltip,
          program
        )
      }
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      ref={containerRef}
      style={{
        height: "calc(100% - 2px)",
        left: `${left}px`, // Subtract 2px for horizontal gap
        padding: "1px 1px",
        width: `${Math.max(width - 2, 10)}px`, // 1px padding on all sides (halved from 2px)
        zIndex: getZIndex(
          isHovered,
          isSelected,
          showMobileTooltip,
          isPast,
          isCurrentlyAiring
        ), // Adjust height to account for padding
      }}
    >
      {/* Sticky overlay for offscreen-left programs */}
      {stickyTextOverlay}
      <Card
        className={cn(
          "relative h-full overflow-hidden p-2 shadow-sm transition-all",
          bgColor,
          textColor,
          !(isMobile || isPlaceholder) && hoverBgColor,
          // Add a subtle left border for new or premiere programs
          isPremiere &&
            "border-l-[3px] border-l-[hsl(var(--program-premiere))]",
          isNew &&
            !isPremiere &&
            "border-l-[3px] border-l-[hsl(var(--program-new))]",
          isCurrentlyAiring &&
            !isPlaceholder &&
            "ring-1 ring-[hsl(var(--program-current-border))]",
          // Add active state for mobile
          isMobile && showMobileTooltip && "bg-accent text-accent-foreground"
        )}
        ref={cardRef}
        style={{
          ...(backgroundStyle || {}),
          ...((isHovered && shouldExpandOnHover) ||
          (isMobile && showMobileTooltip && shouldExpandOnHover)
            ? {
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                height: "auto",
                minHeight: "100%", // Much higher z-index to ensure it's always on top
                position: "absolute",
                width: "200px",
                zIndex: 999,
              }
            : {}),
        }}
      >
        <ProgramContent
          closeMobileTooltip={(e) =>
            closeMobileTooltipHelper(e, setShowMobileTooltip)
          }
          duration={duration}
          hasValidSubtitle={hasValidSubtitle}
          isCurrentlyAiring={isCurrentlyAiring}
          isHovered={isHovered}
          isNarrow={isNarrow}
          isNew={!!isNew}
          isPast={isPast}
          isPlaceholder={!!isPlaceholder}
          isPremiere={!!isPremiere}
          isVeryNarrow={isVeryNarrow}
          left={left}
          program={program}
          showMobileTooltip={showMobileTooltip}
          textOffset={textOffset}
          timeRef={timeRef}
          titleRef={titleRef}
          // Hide normal text if sticky overlay is shown
          // (ProgramContent will use textOffset but will be visually hidden by overlay)
        />

        {/* Progress bar for currently airing programs - don't show for placeholder programs */}
        {isCurrentlyAiring && !isPlaceholder && (
          <div className="absolute right-0 bottom-0 left-0 h-1.5 overflow-hidden rounded-b-md">
            <div
              className="h-full bg-[hsl(var(--program-current-border))]"
              style={{
                opacity: 0.5,
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        )}
      </Card>

      {/* Mobile tooltip - shown directly in the UI instead of as a hover tooltip */}
      {renderMobileTooltipHelper(
        isMobile,
        showMobileTooltip,
        useTooltip,
        showDetails,
        isPlaceholder,
        left,
        program,
        progressPercentage,
        programStatus
      )}
    </div>
  );

  // For non-mobile or when not showing mobile tooltip, wrap in Tooltip
  if (useTooltip && showDetails) {
    return (
      <TooltipProvider>
        <Tooltip open={isHovered}>
          <TooltipTrigger asChild>{programItem}</TooltipTrigger>
          <ProgramTooltip
            program={program}
            progressPercentage={progressPercentage}
            side="top"
            status={programStatus}
          />
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Otherwise just return the program item
  return programItem;
}
