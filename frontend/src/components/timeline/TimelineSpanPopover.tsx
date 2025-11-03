/**
 * Timeline Span Popover Component
 * Displays detailed information about a timeline span in a popover
 */

import { Calendar, Presentation, Radio } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TimelineSpan } from "./types";
import { formatYearMonth } from "./utils";

type TimelineSpanPopoverProps = {
  span: TimelineSpan;
  children: React.ReactNode;
};

type ChildProps = {
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
};

export const TimelineSpanPopover: React.FC<TimelineSpanPopoverProps> = ({
  span,
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const fromYear = span.from ? formatYearMonth(span.from) : "Unknown";
  const toYear = span.to ? formatYearMonth(span.to) : "Present";

  // Check if this is a radio channel or interactive channel
  const isRadio = span.genre?.toLowerCase().includes("radio");
  const isInteractive = span.genre?.toLowerCase().includes("interactive");

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        {React.cloneElement(children as React.ReactElement<ChildProps>, {
          onMouseEnter: (e: React.MouseEvent) => {
            setOpen(true);
            // Call original onMouseEnter if it exists
            const originalOnMouseEnter = (
              children as React.ReactElement<ChildProps>
            ).props.onMouseEnter;
            if (originalOnMouseEnter) {
              originalOnMouseEnter(e);
            }
          },
          onMouseLeave: (e: React.MouseEvent) => {
            setOpen(false);
            // Call original onMouseLeave if it exists
            const originalOnMouseLeave = (
              children as React.ReactElement<ChildProps>
            ).props.onMouseLeave;
            if (originalOnMouseLeave) {
              originalOnMouseLeave(e);
            }
          },
        })}
      </PopoverTrigger>
      <PopoverContent
        align="center"
        alignOffset={0}
        className={cn(
          "z-[1000] max-w-md overflow-hidden rounded-md border-0 p-0 shadow-lg"
        )}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        side="top"
        sideOffset={8}
      >
        <div className="overflow-hidden rounded-md">
          {/* Header with genre badge */}
          <div
            className={cn(
              "border-b bg-accent p-3 text-accent-foreground transition-colors"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {span.genre && (
                    <Badge
                      className="bg-background px-2 py-0.5 font-bold text-[10px] text-primary"
                      variant="secondary"
                    >
                      {span.genre.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isRadio && <Radio className="h-4 w-4 shrink-0" />}
                  {isInteractive && (
                    <Presentation className="h-4 w-4 shrink-0" />
                  )}
                  <h4 className="font-bold text-lg leading-tight">
                    {span.text}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 bg-card p-3">
            {/* Time period */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-muted-foreground">
                  {fromYear} - {toYear}
                </span>
              </div>
            </div>

            {/* Additional Notes */}
            {(() => {
              if (!span.note) {
                return null;
              }

              // Extract notes by removing channel name and period info
              const lines = span.note.split("\n\n");
              const notesText = lines.slice(1).join("\n\n").trim();

              // Check if there's actual content beyond the period
              if (!notesText || notesText.startsWith("Period:")) {
                return null;
              }

              return (
                <div className="border-t pt-1">
                  <p className="text-foreground text-sm">{notesText}</p>
                </div>
              );
            })()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
