/**
 * Timeline Component Exports
 * Main exports for the Timeline component system
 */

// Export constants
export {
  CHANNEL_STYLES,
  EVENT_TYPE_BADGES,
  EVENT_TYPE_COLORS,
  TIMELINE_CONSTANTS,
  TIMELINE_STYLES,
} from "./constants";
export { Timeline } from "./Timeline";
export { TimelineEvent } from "./TimelineEvent";
export { TimelineEventPopover } from "./TimelineEventPopover";
export { TimelineHeader } from "./TimelineHeader";
export { TimelineRow } from "./TimelineRow";
export { TimelineSpan } from "./TimelineSpan";
export { TimelineSpanPopover } from "./TimelineSpanPopover";
export { TimelineUnified } from "./TimelineUnified";
// Export types
export type {
  TimelineAxis,
  TimelineDoc,
  TimelineEvent as TimelineEventType,
  TimelineEventProps,
  TimelineEventType as TimelineEventTypeEnum,
  TimelineHeaderProps,
  TimelineProps,
  TimelineRow as TimelineRowType,
  TimelineRowProps,
  TimelineSpan as TimelineSpanType,
  TimelineSpanProps,
  TimelineStyle,
  YearNumber,
} from "./types";
// Export utilities
export {
  calculateEventPosition,
  calculateSpanPosition,
  clamp,
  convertSimplifiedToRows,
  formatYear,
  formatYearMonth,
  generateTicks,
  getDefaultStyle,
  getResponsiveStyle,
  isEventClickable,
  isSpanClickable,
  toPx,
  validateTimelineDoc,
} from "./utils";
