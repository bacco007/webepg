/**
 * Timeline Span Component
 * Renders individual timeline spans with text and styling
 */

import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GENRE_COLORS } from "./constants";
import { TimelineSpanPopover } from "./TimelineSpanPopover";
import type { TimelineSpanProps } from "./types";
import { calculateSpanPosition, isSpanClickable, toPx } from "./utils";

export const TimelineSpan: React.FC<TimelineSpanProps> = ({
  span,
  axis,
  style,
  onSpanClick,
}) => {
  const { left, width, textMinWidth } = calculateSpanPosition(
    span,
    axis,
    style.pxPerYear
  );
  const isClickable = isSpanClickable(span);

  const handleClick = (e: React.MouseEvent) => {
    if (onSpanClick) {
      onSpanClick(span);
    }

    if (span.href && span.href !== "#") {
      // Let the browser handle the navigation
      return;
    }

    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  // Get genre-based styling
  const genreStyle =
    span.genre && GENRE_COLORS[span.genre]
      ? GENRE_COLORS[span.genre]
      : GENRE_COLORS.Default;

  return (
    <TimelineSpanPopover span={span}>
      <Button
        aria-describedby={span.note ? `span-${span.from}-desc` : undefined}
        aria-label={`Timeline span: ${span.text}`}
        className={cn(
          "-translate-y-1/2 absolute top-1/2 transition-all duration-300",
          "hover:z-30 hover:shadow-md",
          "border-t-0 border-r-0 border-b-0", // Only left border to prevent overlaps
          genreStyle,
          isClickable && "cursor-pointer"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={(e) => {
          // Expand width on hover
          e.currentTarget.style.width = toPx(Math.max(width, textMinWidth));
        }}
        onMouseLeave={(e) => {
          // Return to original width
          e.currentTarget.style.width = toPx(width);
        }}
        size="sm"
        style={{
          left: toPx(left),
          overflow: "hidden",
          padding: toPx(style.spanPadding / 2),
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: toPx(width),
        }}
        variant="outline"
      >
        <span className="block truncate">{span.text}</span>
        {span.note && (
          <div className="sr-only" id={`span-${span.from}-desc`}>
            {span.note}
          </div>
        )}
      </Button>
    </TimelineSpanPopover>
  );
};
