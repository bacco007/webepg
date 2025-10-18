/**
 * Timeline Types
 * Type definitions for the Timeline component
 */

export type YearNumber = number | string; // Support string for dates like "2010.10" (October)

export type TimelineEventType =
  | "Launch"
  | "Added"
  | "Removal"
  | "Rename"
  | "Move"
  | "Split"
  | "Merge"
  | "News";

export type TimelineEventBase = {
  when: YearNumber; // decimal year allowed (e.g., 2001.5 = mid-2001)
  type: TimelineEventType;
  label?: string; // short text for display
  note?: string; // longer description (tooltip/popover)
  href?: string; // optional link to more details
};

export type RenameEvent = TimelineEventBase & {
  type: "Rename";
  fromName: string;
  toName: string;
  genre?: string;
};

export type MoveEvent = TimelineEventBase & {
  type: "Move";
  fromNumber: number | string;
  toNumber: number | string;
  genre?: string;
};

export type SplitEvent = TimelineEventBase & {
  type: "Split";
  children: string[]; // new channel names
  genre?: string;
};

export type MergeEvent = TimelineEventBase & {
  type: "Merge";
  parents: string[]; // names that merged
  genre?: string;
};

export type SimpleEvent = TimelineEventBase & {
  type: "Launch" | "Added" | "Removal";
  genre?: string;
};

export type TimelineEvent =
  | RenameEvent
  | MoveEvent
  | SplitEvent
  | MergeEvent
  | SimpleEvent;

export type TimelineSpan = {
  from: YearNumber; // inclusive
  to?: YearNumber; // exclusive, if not provided, assumes timeline end year
  text: string;
  href?: string;
  note?: string;
  class?: string; // CSS token for styling
  genre?: string; // Channel genre for color coding
};

export type TimelineRow = {
  id: string; // unique key
  label: string; // e.g., "Channel number 5"
  spans: TimelineSpan[];
  events?: TimelineEvent[];
};

// Unified timeline item that can be either a span or event
export type TimelineItem = {
  id: string;
  type: "span" | "event";
  when: YearNumber;
  to?: YearNumber; // Only for spans
  text: string;
  eventType?: TimelineEventType; // Only for events
  label?: string;
  note?: string;
  href?: string;
  genre?: string;
  class?: string;
  // Channel information
  channelId: string;
  channelLabel: string;
};

// Single unified timeline document
export type TimelineDocV2 = {
  title: string;
  description: string;
  axis: TimelineAxis;
  eventTypes?: Record<TimelineEventType, string>;
  items: TimelineItem[]; // Single flat array of all items
  style?: {
    gap: number;
    labelWidth: number;
    pxPerYear: number;
    rowHeight: number;
    spanPadding: number;
  };
};

export type TimelineAxis = {
  unit: "year";
  start: YearNumber;
  end: YearNumber; // exclusive upper bound
  tickEvery?: number;
};

export type TimelineStyle = {
  rowHeight?: number; // px
  labelWidth?: number; // px
  gap?: number; // px between rows
  spanPadding?: number; // px inner padding
  pxPerYear?: number; // px per year (controls overall width)
};

export type TimelineDoc = {
  title?: string;
  axis: TimelineAxis;
  eventTypes?: Record<TimelineEventType, string>; // dictionary for legend/tooltip
  rows: TimelineRow[];
  style?: TimelineStyle;
};

export type TimelineProps = {
  doc: TimelineDoc;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onEventClick?: (event: TimelineEvent) => void;
  onSpanClick?: (span: TimelineSpan) => void;
};

export type TimelineHeaderProps = {
  axis: TimelineAxis;
  style: Required<TimelineStyle>;
  labelWidth: number;
};

export type TimelineRowProps = {
  row: TimelineRow;
  axis: TimelineAxis;
  style: Required<TimelineStyle>;
  labelWidth: number;
  trackWidth: number;
  ticks: number[];
  eventTypeBadge: Record<TimelineEventType, string>;
  onEventClick?: (event: TimelineEvent) => void;
  onSpanClick?: (span: TimelineSpan) => void;
};

export type TimelineEventProps = {
  event: TimelineEvent;
  axis: TimelineAxis;
  style: Required<TimelineStyle>;
  eventTypeBadge: Record<TimelineEventType, string>;
  onEventClick?: (event: TimelineEvent) => void;
};

export type TimelineSpanProps = {
  span: TimelineSpan;
  axis: TimelineAxis;
  style: Required<TimelineStyle>;
  onSpanClick?: (span: TimelineSpan) => void;
};
