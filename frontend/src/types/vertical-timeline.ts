/**
 * Type definitions for vertical timeline events
 * These are separate from the horizontal timeline channel events
 */

export type VerticalTimelineEventType =
  | "launch"
  | "closure"
  | "merger"
  | "acquisition"
  | "rebrand"
  | "expansion"
  | "technology"
  | "milestone"
  | "partnership"
  | "regulation"
  | "other";

export type VerticalTimelineEvent = {
  id: string;
  date: number | string; // Format: 1995 or 1995.8 (August 1995)
  title: string;
  description?: string;
  providers: string[]; // IDs of providers this event relates to
  type: VerticalTimelineEventType;
  tags?: string[]; // Additional custom tags
};

export type VerticalTimelineEventCollection = {
  events: VerticalTimelineEvent[];
  metadata?: {
    title?: string;
    description?: string;
    lastUpdated?: string;
  };
};
