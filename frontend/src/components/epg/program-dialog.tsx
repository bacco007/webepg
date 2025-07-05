"use client";

import { Calendar, Circle, Clock, Tag, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Program } from "@/components/epg/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  differenceInMinutes,
  formatDate,
  parseISODate,
} from "@/lib/date-utils";
// Add import for decodeHtml at the top of the file
import { decodeHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";
import type { ProgramStatus } from "./program-tooltip";
import { getProgramStatus } from "./utils";

// Helper function to determine header styling
const getHeaderStyling = (status: ProgramStatus) => {
  if (status === "now-playing") {
    return "bg-primary text-primary-foreground";
  }
  if (status === "ended") {
    return "bg-muted text-foreground";
  }
  return "bg-accent text-accent-foreground";
};

interface ProgramDialogProps {
  program: Program;
  trigger: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function ProgramDialog({
  program,
  trigger,
  onOpenChange,
}: ProgramDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // Parse times
  const startTime = parseISODate(program.start_time);
  const endTime = parseISODate(program.end_time);
  const now = new Date();

  // Determine program status
  const isLive = now > startTime && now < endTime;
  const hasEnded = now > endTime;

  const status = getProgramStatus(isLive, hasEnded);

  // Format date and calculate duration
  const formattedDate = formatDate(startTime, "EEEE, MMMM d, yyyy");
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

  // Calculate progress percentage if currently airing
  const progressPercentage = isLive
    ? Math.min(
        100,
        ((now.getTime() - startTime.getTime()) /
          (endTime.getTime() - startTime.getTime())) *
          100
      )
    : 0;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md border-0 p-0 shadow-lg">
        <div className="overflow-hidden rounded-md">
          {/* Header with status indicator - improved contrast */}
          <div
            className={cn("relative border-b p-4", getHeaderStyling(status))}
          >
            <DialogClose className="absolute top-2 right-2 rounded-full p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="mb-2 flex items-start justify-between pr-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {status === "now-playing" && (
                    <Badge
                      className="bg-white px-2 py-0.5 font-bold text-[10px] text-[hsl(var(--primary))]"
                      variant="secondary"
                    >
                      NOW PLAYING
                    </Badge>
                  )}
                  {isPremiere && (
                    <Badge
                      className="bg-white px-2 py-0.5 font-bold text-[10px] text-[hsl(var(--program-premiere))]"
                      variant="secondary"
                    >
                      PREMIERE
                    </Badge>
                  )}
                  {isNew && !isPremiere && (
                    <Badge
                      className="bg-white px-2 py-0.5 font-bold text-[10px] text-[hsl(var(--program-new))]"
                      variant="secondary"
                    >
                      NEW
                    </Badge>
                  )}
                </div>
                {/* Update the title display */}
                <h4 className="font-bold text-xl leading-tight">
                  {decodeHtml(program.title)}
                </h4>
                {/* Update the subtitle display */}
                {hasValidSubtitle && (
                  <p className="font-medium text-sm opacity-90">
                    {decodeHtml(program.subtitle || "")}
                  </p>
                )}
              </div>
              {program.rating && program.rating !== "N/A" && (
                <Badge
                  className="border-2 bg-white px-2 py-1 font-bold text-[hsl(var(--foreground))] text-xs"
                  variant="outline"
                >
                  {program.rating}
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 bg-card p-4">
            {/* Time and duration */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4 text-[hsl(var(--primary))]" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
                <span className="font-medium">{duration}</span>
                <span className="text-muted-foreground">
                  ({durationMinutes} min)
                </span>
              </div>
              {program.categories && program.categories.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Tag className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <span className="font-medium">
                    {program.categories.join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar for currently airing */}
            {status === "now-playing" && progressPercentage > 0 && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[hsl(var(--primary))]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}

            {/* Description */}
            {/* Update the description display */}
            {program.description && program.description !== "N/A" && (
              <div className="border-t pt-2">
                <p className="text-[hsl(var(--foreground))] text-sm">
                  {decodeHtml(program.description || "")}
                </p>
              </div>
            )}

            {/* Channel info if available */}
            {program.channel && (
              <div className="flex items-center gap-2 border-t pt-2">
                <Circle className="h-4 w-4 text-[hsl(var(--primary))]" />
                <span className="font-medium text-sm">{program.channel}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
