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
  | "anti-siphoning"
  | "industry"
  | "legal"
  | "business"
  | "super-league-war"
  | "piracy"
  | "subscribers"
  | "other";

export type VerticalTimelineEvent = {
  id: string;
  date: number | string; // Format: 1995 or 1995.8 (August 1995)
  title: string;
  description?: string;
  providers: string[]; // IDs of providers this event relates to
  event_type: VerticalTimelineEventType[]; // Array of event types
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
