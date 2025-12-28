/**
 * Timeline Event Component
 * Renders individual timeline events with badges and labels
 */

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TimelineEventProps } from "./types";
import { calculateEventPosition, isEventClickable, toPx } from "./utils";

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  axis,
  style,
  eventTypeBadge,
  onEventClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const x = calculateEventPosition(event, axis, style.pxPerYear);
  const badge = eventTypeBadge[event.type];
  const isClickable = isEventClickable(event);

  const handleClick = (e: React.MouseEvent) => {
    if (onEventClick) {
      onEventClick(event);
    }

    if (event.href && event.href !== "#") {
      // Let the browser handle the navigation
      return;
    }

    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onEventClick) {
        onEventClick(event);
      }
    }
  };

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <button
          aria-describedby={event.note ? `event-${event.when}-desc` : undefined}
          aria-label={`${event.type} event: ${event.label || event.note || "No description"}`}
          className="group absolute top-1/2 z-10 flex -translate-x-1/2 translate-y-[-50%] flex-col items-center"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          style={{ left: toPx(x) }}
          tabIndex={isClickable ? 0 : -1}
          type="button"
        >
          <div className="h-4 w-px bg-muted-foreground/40 transition-colors group-hover:bg-primary" />
          <div className="mt-1 select-none rounded-full border border-muted-foreground/40 bg-muted p-1.5 text-xs leading-none shadow-sm transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            {badge || "?"}
          </div>
          {event.note && (
            <div className="sr-only" id={`event-${event.when}-desc`}>
              {event.note}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        side="bottom"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded border bg-muted px-2 py-0.5 text-xs">
              {badge || "?"}
            </div>
            <div className="font-semibold text-sm">{event.type}</div>
          </div>
          {event.label && (
            <div className="font-medium text-sm">{event.label}</div>
          )}
          {event.note && (
            <div className="text-muted-foreground text-xs">{event.note}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
