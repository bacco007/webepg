"use client";

import { Calendar, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TooltipContent } from "@/components/ui/tooltip";
import {
  differenceInMinutes,
  formatDate,
  parseISODate,
} from "@/lib/date-utils";
import { decodeHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";
import type { Program } from "./types";

export type ProgramStatus = "now-playing" | "upcoming" | "ended";

interface ProgramTooltipProps {
  program: Program;
  status: ProgramStatus;
  progressPercentage?: number;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}

export function ProgramTooltip({
  program,
  status,
  progressPercentage = 0,
  side = "top",
  sideOffset = 5,
  className,
}: ProgramTooltipProps) {
  // Parse times
  const startTime = parseISODate(program.start_time);
  const endTime = parseISODate(program.end_time);

  // Format date and calculate duration
  const formattedDate = formatDate(startTime, "EEE, MMM do");
  const duration = `${formatDate(startTime, "HH:mm")}-${formatDate(endTime, "HH:mm")}`;
  const durationMinutes = Math.round(differenceInMinutes(endTime, startTime));

  // Check if program is new or premiere
  const isPremiere =
    program.premiere ||
    program.categories?.some((cat) => cat.toLowerCase().includes("premiere"));
  const isNew =
    program.new ||
    program.categories?.some((cat) => cat.toLowerCase().includes("new"));

  // Check if subtitle is valid
  const hasValidSubtitle = program.subtitle && program.subtitle !== "N/A";

  // Get header styling based on status
  const getHeaderStyling = () => {
    if (status === "now-playing") {
      return "bg-primary text-primary-foreground";
    }
    if (status === "ended") {
      return "bg-muted text-muted-foreground";
    }
    return "bg-accent text-accent-foreground";
  };

  return (
    <TooltipContent
      className={cn(
        "z-[1000] max-w-md overflow-hidden rounded-md border-0 p-0 shadow-lg",
        className
      )}
      side={side}
      sideOffset={sideOffset}
    >
      <div className="overflow-hidden rounded-md">
        {/* Header with status indicator */}
        <div
          className={cn("border-b p-3 transition-colors", getHeaderStyling())}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {status === "now-playing" && (
                  <Badge
                    className="bg-background px-2 py-0.5 font-bold text-[10px] text-primary"
                    variant="secondary"
                  >
                    NOW PLAYING
                  </Badge>
                )}
                {isPremiere && (
                  <Badge
                    className="bg-background px-2 py-0.5 font-bold text-[10px] text-[oklch(var(--program-premiere))]"
                    variant="secondary"
                  >
                    PREMIERE
                  </Badge>
                )}
                {isNew && !isPremiere && (
                  <Badge
                    className="bg-background px-2 py-0.5 font-bold text-[10px] text-[oklch(var(--program-new))]"
                    variant="secondary"
                  >
                    NEW
                  </Badge>
                )}
              </div>
              <h4 className="font-bold text-lg leading-tight">
                {decodeHtml(program.title)}
              </h4>
              {hasValidSubtitle && (
                <p className="font-medium text-sm opacity-90">
                  {decodeHtml(program.subtitle || "")}
                </p>
              )}
            </div>
            {program.rating && program.rating !== "N/A" && (
              <Badge
                className="border-2 bg-background px-2 py-1 font-bold text-foreground text-xs"
                variant="outline"
              >
                {program.rating}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 bg-card p-3">
          {/* Time and duration */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-muted-foreground">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-muted-foreground">
                {duration}
              </span>
              <span className="text-muted-foreground">
                ({durationMinutes} min)
              </span>
            </div>
            {program.categories && program.categories.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-muted-foreground">
                  {program.categories.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar for currently airing */}
          {status === "now-playing" && progressPercentage > 0 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}

          {/* Description */}
          {program.description && program.description !== "N/A" && (
            <div className="border-t pt-1">
              <p className="text-foreground text-sm">
                {decodeHtml(program.description)}
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipContent>
  );
}
