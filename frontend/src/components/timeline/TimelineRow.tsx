/**
 * Timeline Row Component
 * Renders a single timeline row with spans and events
 */

import React from "react";
import { TimelineEvent } from "./TimelineEvent";
import { TimelineEventPopover } from "./TimelineEventPopover";
import { TimelineSpan } from "./TimelineSpan";
import type { TimelineRowProps } from "./types";
import { toPx, yearMonthToDecimal } from "./utils";

export const TimelineRow: React.FC<TimelineRowProps> = React.memo(
  ({
    row,
    axis,
    style,
    labelWidth,
    trackWidth,
    ticks,
    eventTypeBadge,
    onEventClick,
    onSpanClick,
    colorMap,
  }) => {
    return (
      <TimelineEventPopover events={row.events || []}>
        <div
          className="relative flex w-full border-border/50 border-b last:border-b-0 hover:bg-muted/20"
          style={{
            contain: "layout style paint",
            height: style.rowHeight,
          }}
        >
          {/* Left label */}
          <div
            className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r bg-background px-2 font-medium text-sm"
            style={{
              height: style.rowHeight,
              width: labelWidth,
              willChange: "transform",
            }}
            title={row.label}
          >
            <span className="flex items-center justify-center gap-2 truncate">
              {row.label === "Events" ? (
                <span>📅</span>
              ) : (
                <>
                  {row.label}
                  {row.events && row.events.length > 0 && (
                    <span
                      className="text-muted-foreground text-xs"
                      title={`${row.events.length} events`}
                    >
                      📅
                    </span>
                  )}
                </>
              )}
            </span>
          </div>

          {/* Right track */}
          <div className="relative" style={{ width: "100%" }}>
            <div
              className="relative bg-linear-to-r from-transparent via-muted/5 to-transparent"
              style={{
                height: style.rowHeight,
                marginLeft: 20,
                width: toPx(trackWidth + 20),
              }}
            >
              {/* Grid lines */}
              {ticks.map((year) => {
                // Use the same decimal conversion as events and spans for consistent alignment
                const yearDecimal = yearMonthToDecimal(year);
                const startDecimal = yearMonthToDecimal(axis.start);
                const x = (yearDecimal - startDecimal) * style.pxPerYear + 20;
                return (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 border-border/30 border-l border-dashed"
                    key={`grid-${row.id}-${year}`}
                    style={{ left: toPx(x) }}
                  />
                );
              })}

              {/* Spans */}
              {row.spans.map((span, index) => (
                <TimelineSpan
                  axis={axis}
                  colorMap={colorMap}
                  key={`${row.id}-span-${index}`}
                  onSpanClick={onSpanClick}
                  span={span}
                  style={style}
                />
              ))}

              {/* Events */}
              {row.events?.map((event, index) => (
                <TimelineEvent
                  axis={axis}
                  event={event}
                  eventTypeBadge={eventTypeBadge}
                  key={`${row.id}-event-${index}`}
                  onEventClick={onEventClick}
                  style={style}
                />
              ))}
            </div>
          </div>
        </div>
      </TimelineEventPopover>
    );
  }
);

TimelineRow.displayName = "TimelineRow";
