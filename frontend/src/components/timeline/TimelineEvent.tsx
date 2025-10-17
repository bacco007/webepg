/**
 * Timeline Event Component
 * Renders individual timeline events with badges and labels
 */

import type React from "react";
import type { TimelineEventProps } from "./types";
import { calculateEventPosition, isEventClickable, toPx } from "./utils";

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  axis,
  style,
  eventTypeBadge,
  onEventClick,
}) => {
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
    <button
      aria-describedby={event.note ? `event-${event.when}-desc` : undefined}
      aria-label={`${event.type} event: ${event.label || event.note || "No description"}`}
      className="-translate-x-1/2 group absolute top-1/2 z-10 flex translate-y-[-50%] flex-col items-center"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ left: toPx(x) }}
      tabIndex={isClickable ? 0 : -1}
      title={event.note ?? event.label}
      type="button"
    >
      <div className="h-4 w-px bg-red-500 transition-colors group-hover:bg-primary" />
      <div className="mt-1 select-none rounded-full border border-red-600 bg-red-500 p-1.5 text-xs leading-none shadow-sm transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
        {badge || "?"}
      </div>
      {event.label && (
        <div className="mt-1 whitespace-nowrap rounded border bg-background/95 px-2 py-0.5 font-medium text-xs shadow-sm backdrop-blur transition-all duration-200 group-hover:bg-background group-hover:shadow-md">
          {event.label}
        </div>
      )}
      {event.note && (
        <div className="sr-only" id={`event-${event.when}-desc`}>
          {event.note}
        </div>
      )}
    </button>
  );
};
