/**
 * Timeline Utilities
 * Utility functions for the Timeline component
 */

import { TIMELINE_CONSTANTS } from "./constants";
import type {
  TimelineDoc,
  TimelineEvent,
  TimelineEventType,
  TimelineSpan,
  YearNumber,
} from "./types";

/**
 * Convert number to pixel string
 */
export function toPx(x: number): string {
  return `${x}px`;
}

/**
 * Clamp a number between min and max values
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Generate ticks for the timeline axis
 */
export function generateTicks(
  start: YearNumber,
  end: YearNumber,
  tickEvery = 1
): number[] {
  const ticks: number[] = [];
  const startNum = typeof start === "number" ? start : Number.parseFloat(start);
  const endNum = typeof end === "number" ? end : Number.parseFloat(end);
  for (let y = startNum; y <= endNum; y += tickEvery) {
    ticks.push(Number(y.toFixed(6)));
  }
  return ticks;
}

/**
 * Convert year.month format to decimal year
 * e.g., 2002.4 (April 2002) -> 2002 + 4/12 = 2002.333...
 * e.g., 2002.12 (December 2002) -> 2002 + 12/12 = 2003
 * Supports both number and string formats (use string for months like "2010.10")
 */
export function yearMonthToDecimal(yearMonth: number | string): number {
  // Handle string format (e.g., "2010.10" for October)
  if (typeof yearMonth === "string") {
    const parts = yearMonth.split(".");
    const year = Number.parseInt(parts[0], 10);
    const month = parts[1] ? Number.parseInt(parts[1], 10) : 0;
    return year + month / 12;
  }

  // Handle number format
  if (Number.isInteger(yearMonth)) {
    return yearMonth;
  }

  const year = Math.floor(yearMonth);
  const yearStr = yearMonth.toString();
  const parts = yearStr.split(".");
  const month = parts[1] ? Number.parseInt(parts[1], 10) : 0;

  // Convert to decimal year (month/12)
  return year + month / 12;
}

/**
 * Calculate position and width for a span
 */
export function calculateSpanPosition(
  span: TimelineSpan,
  axis: { start: YearNumber; end: YearNumber },
  pxPerYear: number
) {
  // Convert year.month format to decimal years for accurate calculation
  const fromDecimal = yearMonthToDecimal(span.from);
  const startDecimal = yearMonthToDecimal(axis.start);
  const endDecimal = yearMonthToDecimal(axis.end);

  const clampedFrom = clamp(fromDecimal, startDecimal, endDecimal);

  // Use timeline end if no end date is provided
  const endYear = span.to ?? axis.end;
  const toDecimal = yearMonthToDecimal(endYear);
  const clampedTo = clamp(toDecimal, startDecimal, endDecimal);

  const left = (clampedFrom - startDecimal) * pxPerYear + 20; // Add margin for first year visibility

  // Calculate width based on time period only
  const calculatedWidth = (clampedTo - clampedFrom) * pxPerYear;

  // Use the larger of calculated time width or absolute minimum
  const width = Math.max(TIMELINE_CONSTANTS.MIN_SPAN_WIDTH, calculatedWidth);

  // Calculate minimum width needed for text (for hover expansion)
  const textMinWidth = (span.text?.length || 0) * 8 + 20;

  return { left, textMinWidth, width };
}

/**
 * Calculate position for an event
 */
export function calculateEventPosition(
  event: TimelineEvent,
  axis: { start: YearNumber },
  pxPerYear: number
) {
  // Convert year.month format to decimal years for accurate positioning
  const whenDecimal = yearMonthToDecimal(event.when);
  const startDecimal = yearMonthToDecimal(axis.start);
  return (whenDecimal - startDecimal) * pxPerYear + 20; // Add margin for first year visibility
}

/**
 * Validate timeline document structure
 */
export function validateTimelineDoc(doc: unknown): doc is TimelineDoc {
  if (!doc || typeof doc !== "object") {
    return false;
  }

  const d = doc as Record<string, unknown>;

  // Check required properties
  if (!(d.axis && d.rows && Array.isArray(d.rows))) {
    return false;
  }

  // Validate axis
  const axis = d.axis as Record<string, unknown>;
  if (typeof axis.start !== "number" || typeof axis.end !== "number") {
    return false;
  }
  if (axis.start >= axis.end) {
    return false;
  }

  // Validate rows
  for (const row of d.rows as unknown[]) {
    if (!row || typeof row !== "object") {
      return false;
    }
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.label !== "string") {
      return false;
    }
    if (!Array.isArray(r.spans)) {
      return false;
    }
  }

  return true;
}

/**
 * Get default style values
 */
export function getDefaultStyle() {
  return {
    gap: TIMELINE_CONSTANTS.DEFAULT_GAP,
    labelWidth: TIMELINE_CONSTANTS.DEFAULT_LABEL_WIDTH,
    pxPerYear: TIMELINE_CONSTANTS.DEFAULT_PX_PER_YEAR,
    rowHeight: TIMELINE_CONSTANTS.DEFAULT_ROW_HEIGHT,
    spanPadding: TIMELINE_CONSTANTS.DEFAULT_SPAN_PADDING,
  };
}

/**
 * Get responsive style values based on screen size
 */
export function getResponsiveStyle(isMobile: boolean) {
  if (isMobile) {
    return {
      gap: TIMELINE_CONSTANTS.MOBILE_GAP,
      labelWidth: TIMELINE_CONSTANTS.MOBILE_LABEL_WIDTH,
      pxPerYear: TIMELINE_CONSTANTS.MOBILE_PX_PER_YEAR,
      rowHeight: TIMELINE_CONSTANTS.MOBILE_ROW_HEIGHT,
      spanPadding: TIMELINE_CONSTANTS.DEFAULT_SPAN_PADDING,
    };
  }

  return getDefaultStyle();
}

/**
 * Format year for display
 */
export function formatYear(year: YearNumber): string {
  const yearNum = typeof year === "number" ? year : Number.parseFloat(year);
  return Number.isInteger(yearNum) ? yearNum.toString() : yearNum.toFixed(1);
}

/**
 * Format year with month (from decimal notation) for display
 * e.g., 2000.8 -> "August 2000", 2000.12 -> "December 2000", 2004.3 -> "March 2004"
 * Format: year.month where month is 1-12 (e.g., .1 = January, .11 = November, .12 = December)
 */
export function formatYearMonth(yearDecimal: number | string): string {
  // Convert to string for parsing
  const yearStr = yearDecimal.toString();

  // Check if it's an integer (no decimal part)
  if (!yearStr.includes(".")) {
    return yearStr;
  }

  // Parse the decimal part as the month number from string representation
  // This handles the format where .1 = Jan, .2 = Feb, ... .11 = Nov, .12 = Dec
  const parts = yearStr.split(".");
  const year = Number.parseInt(parts[0], 10);
  const month = parts[1] ? Number.parseInt(parts[1], 10) : 0;

  if (month < 1 || month > 12) {
    const numValue =
      typeof yearDecimal === "number"
        ? yearDecimal
        : Number.parseFloat(yearDecimal);
    return numValue.toFixed(2);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${monthNames[month - 1]} ${year}`;
}

/**
 * Check if a span is clickable
 */
export function isSpanClickable(span: TimelineSpan): boolean {
  return Boolean(span.href);
}

/**
 * Check if an event is clickable
 */
export function isEventClickable(event: TimelineEvent): boolean {
  return Boolean(event.href);
}

/**
 * Convert grouped timeline data to row-based structure
 */
interface ChannelItem {
  from?: number | string;
  to?: number | string;
  channel_name: string;
  channel_genre?: string;
  channel_network?: string;
  channel_notes?: string;
}

interface TimelineRow {
  id: string;
  label: string;
  spans: TimelineSpan[];
  events?: TimelineEvent[];
}

interface EventData {
  when: number | string;
  type: string;
  label?: string;
  note?: string;
  href?: string;
}

interface GroupedDoc {
  title: string;
  axis: { start: number; end: number; unit: "year" };
  channels: Record<string, ChannelItem[]>;
  events?: EventData[];
}

export function convertSimplifiedToRows(
  groupedDoc: GroupedDoc,
  colorBy: "channel_genre" | "channel_network" = "channel_genre"
): TimelineDoc {
  // Convert grouped channels to row structure
  const rows: TimelineRow[] = [];

  for (const [channelNumber, items] of Object.entries(groupedDoc.channels)) {
    // Sort items by from date to maintain chronological order
    const sortedItems = [...items].sort((a, b) => {
      let aFrom = 0;
      if (a.from) {
        aFrom = typeof a.from === "number" ? a.from : Number.parseFloat(a.from);
      }

      let bFrom = 0;
      if (b.from) {
        bFrom = typeof b.from === "number" ? b.from : Number.parseFloat(b.from);
      }

      return aFrom - bFrom;
    });

    // Convert grouped items to spans with enhanced tooltips
    const spans: TimelineSpan[] = sortedItems.map((item) => {
      const fromYear = item.from ? formatYearMonth(item.from) : "Unknown";
      const toYear = item.to ? formatYearMonth(item.to) : "Present";

      // Build tooltip text with channel name and dates
      let tooltipText = `${item.channel_name}\n\nPeriod: ${fromYear} - ${toYear}`;

      // Add notes if available
      if (item.channel_notes) {
        tooltipText = `${item.channel_name}\n\n${item.channel_notes}\n\nPeriod: ${fromYear} - ${toYear}`;
      }

      // Get color value based on configured colorBy field
      const colorValue =
        colorBy === "channel_network"
          ? item.channel_network
          : item.channel_genre;

      return {
        from: item.from || 0,
        genre: colorValue, // Use the configured field for coloring
        note: tooltipText,
        text: item.channel_name,
        to: item.to || groupedDoc.axis.end, // Use timeline end if no 'to' date provided
      };
    });

    // Don't generate automatic rename events - only use events from data
    rows.push({
      events: undefined,
      id: `ch-${channelNumber}`,
      label: channelNumber,
      spans,
    });
  }

  // Sort rows by channel number
  rows.sort((a, b) => {
    const aNum = Number.parseInt(a.label, 10);
    const bNum = Number.parseInt(b.label, 10);
    return aNum - bNum;
  });

  // Add standalone events as a special "Events" row if they exist
  if (groupedDoc.events && groupedDoc.events.length > 0) {
    rows.unshift({
      events: groupedDoc.events.map(
        (event) =>
          ({
            href: event.href,
            label: event.label,
            note: event.note,
            type: event.type as TimelineEventType,
            when: event.when,
          }) as TimelineEvent
      ),
      id: "standalone-events",
      label: "Events",
      spans: [],
    });
  }

  return {
    axis: groupedDoc.axis,
    rows,
    title: groupedDoc.title,
  };
}
