/**
 * Timeline Header Component
 * Renders the timeline axis header with year ticks
 */

import React from "react";
import type { TimelineHeaderProps } from "./types";
import { formatYearMonth, toPx, yearMonthToDecimal } from "./utils";

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  axis,
  style,
  labelWidth,
}) => {
  const totalYears = Number(axis.end) - Number(axis.start);
  const trackWidth = totalYears * style.pxPerYear;

  const ticks = React.useMemo(() => {
    const step = axis.tickEvery ?? 1;
    const arr: number[] = [];
    for (let y = Number(axis.start); y <= Number(axis.end); y += step) {
      arr.push(Number(y.toFixed(6)));
    }
    return arr;
  }, [axis.start, axis.end, axis.tickEvery]);

  return (
    <div
      className="sticky top-0 z-20 flex border-b bg-background shadow-sm"
      style={{ willChange: "transform" }}
    >
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center justify-center border-r bg-background font-semibold text-sm"
        style={{
          height: 40,
          width: labelWidth,
          willChange: "transform",
        }}
      >
        <span className="flex items-center gap-2">
          <span>Channel</span>
        </span>
      </div>
      <div className="relative flex-1">
        <div
          className="relative bg-gradient-to-r from-muted/30 to-transparent"
          style={{ height: 40, marginLeft: 20, width: toPx(trackWidth + 20) }}
        >
          {ticks.map((year) => {
            // Use the same decimal conversion as events and spans for consistent alignment
            const yearDecimal = yearMonthToDecimal(year);
            const startDecimal = yearMonthToDecimal(axis.start);
            const x = (yearDecimal - startDecimal) * style.pxPerYear + 20;
            return (
              <div
                className="absolute top-0 h-full border-border/60 border-l"
                key={`tick-${year}`}
                style={{ left: toPx(x) }}
              >
                <div className="-translate-x-1/2 absolute top-2 rounded border bg-background px-2 py-0.5 font-medium text-muted-foreground text-xs">
                  {formatYearMonth(year)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
