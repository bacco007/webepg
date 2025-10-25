/**
 * Timeline Span Component
 * Renders individual timeline spans with text and styling
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GENRE_COLORS } from "./constants";
import { TimelineSpanPopover } from "./TimelineSpanPopover";
import type { TimelineSpanProps } from "./types";
import { calculateSpanPosition, isSpanClickable, toPx } from "./utils";

// Regex patterns for special channel tags
const FOUR_K_UHD_REGEX = /4K|Ultra HD|UHD/i;
const HD_REGEX = /(?<!Ultra\s)HD(?!.*(?:4K|Ultra HD|UHD))/i; // HD but not Ultra HD, UHD, or 4K
const PLUS_TWO_REGEX = /\+2/i;
const INTERACTIVE_REGEX = /Interactive|interactive/i;

// Get border style for special channels
const getChannelBorderStyle = (
  channelName: string,
  channelGenre?: string
): { borderColor?: string; borderWidth?: string } => {
  if (FOUR_K_UHD_REGEX.test(channelName)) {
    return { borderColor: "#a855f7", borderWidth: "2px" }; // purple-500 for 4K/UHD/Ultra HD
  }
  if (HD_REGEX.test(channelName)) {
    return { borderColor: "#3b82f6", borderWidth: "2px" }; // blue-500 for regular HD
  }
  if (PLUS_TWO_REGEX.test(channelName)) {
    return { borderColor: "#f97316", borderWidth: "2px" }; // orange-500 for +2
  }
  if (INTERACTIVE_REGEX.test(channelName) || channelGenre === "Interactive") {
    return { borderColor: "#10b981", borderWidth: "2px" }; // green-500 for Interactive
  }
  return {};
};

export const TimelineSpan: React.FC<TimelineSpanProps> = React.memo(
  ({ span, axis, style, onSpanClick, colorMap }) => {
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

    // Get genre-based styling (use colorMap if provided, otherwise use GENRE_COLORS)
    const colors = colorMap || GENRE_COLORS;
    const genreStyle =
      span.genre && colors[span.genre]
        ? colors[span.genre]
        : colors.Default || GENRE_COLORS.Default;

    // Get special border style
    const borderStyle = getChannelBorderStyle(span.text, span.genre);

    return (
      <TimelineSpanPopover span={span}>
        <Button
          aria-describedby={span.note ? `span-${span.from}-desc` : undefined}
          aria-label={`Timeline span: ${span.text}`}
          className={cn(
            "-translate-y-1/2 absolute top-1/2",
            "hover:z-30 hover:shadow-md",
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
            ...borderStyle, // Apply border style inline for higher specificity
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
  }
);

TimelineSpan.displayName = "TimelineSpan";
