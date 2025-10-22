/**
 * Timeline Component for Simplified Data Structure
 * Works with the ultra-simplified data structure
 */

import React from "react";
import { Timeline } from "./Timeline";
import type { TimelineEvent, TimelineSpan } from "./types";
import { convertSimplifiedToRows } from "./utils";

type ChannelItem = {
  from?: number | string;
  to?: number | string;
  channel_name: string;
  channel_genre?: string;
  channel_network?: string;
  channel_notes?: string;
};

type EventData = {
  when: number | string;
  type: string;
  label?: string;
  note?: string;
  href?: string;
};

type SimplifiedTimelineDoc = {
  title: string;
  axis: { start: number; end: number; unit: "year" };
  channels: Record<string, ChannelItem[]>;
  events?: EventData[];
  style?: Record<string, unknown>;
};

type TimelineUnifiedProps = {
  doc: SimplifiedTimelineDoc;
  onEventClick?: (event: TimelineEvent) => void;
  onSpanClick?: (span: TimelineSpan) => void;
  className?: string;
  pxPerYear?: number; // Custom spacing override
  colorBy?: "channel_genre" | "channel_network"; // Which attribute to use for coloring
  colorMap?: Record<string, string>; // Custom color mapping
};

export const TimelineUnified: React.FC<TimelineUnifiedProps> = React.memo(
  ({
    doc,
    onEventClick,
    onSpanClick,
    className,
    pxPerYear,
    colorBy,
    colorMap,
  }) => {
    // Convert simplified data to row-based structure (memoized)
    const rowBasedDoc = React.useMemo(
      () => convertSimplifiedToRows(doc, colorBy),
      [doc, colorBy]
    );

    // Apply custom pxPerYear and colorMap if provided (memoized)
    const finalDoc = React.useMemo(() => {
      let result = rowBasedDoc;

      // Add custom pxPerYear if provided
      if (pxPerYear) {
        result = {
          ...result,
          style: result.style ? { ...result.style, pxPerYear } : { pxPerYear },
        };
      }

      // Add colorMap if provided
      result = {
        ...result,
        colorMap,
      };

      return result;
    }, [rowBasedDoc, pxPerYear, colorMap]);

    return (
      <Timeline
        className={className}
        doc={finalDoc}
        onEventClick={onEventClick}
        onSpanClick={onSpanClick}
      />
    );
  }
);

TimelineUnified.displayName = "TimelineUnified";
