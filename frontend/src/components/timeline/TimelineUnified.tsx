/**
 * Timeline Component for Simplified Data Structure
 * Works with the ultra-simplified data structure
 */

import type React from "react";
import { Timeline } from "./Timeline";
import type { TimelineEvent, TimelineSpan } from "./types";
import { convertSimplifiedToRows } from "./utils";

type ChannelItem = {
  from?: number | string;
  to?: number | string;
  channel_name: string;
  channel_genre?: string;
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
};

export const TimelineUnified: React.FC<TimelineUnifiedProps> = ({
  doc,
  onEventClick,
  onSpanClick,
  className,
  pxPerYear,
}) => {
  // Convert simplified data to row-based structure
  const rowBasedDoc = convertSimplifiedToRows(doc);

  // Apply custom pxPerYear if provided
  if (pxPerYear && rowBasedDoc.style) {
    rowBasedDoc.style.pxPerYear = pxPerYear;
  } else if (pxPerYear) {
    rowBasedDoc.style = { pxPerYear };
  }

  return (
    <Timeline
      className={className}
      doc={rowBasedDoc}
      onEventClick={onEventClick}
      onSpanClick={onSpanClick}
    />
  );
};
