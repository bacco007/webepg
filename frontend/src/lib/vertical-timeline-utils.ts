/**
 * Utilities for transforming timeline provider data into vertical timeline events
 */

import type { VerticalTimelineEventCollection } from "@/types/vertical-timeline";
import type { TimelineProvider } from "./timeline-data";

export type FormattedTimelineEvent = {
  date: string;
  description?: string;
  providers: string[];
  sortKey: number;
  tags?: string[];
  title: string;
  type: string;
};

/**
 * Formats a year/decimal date into a readable string
 * @param date - Number like 1995.8 (August 1995) or 2001 (2001)
 */
function formatDate(date: number | string): string {
  const numDate = typeof date === "string" ? Number.parseFloat(date) : date;
  const year = Math.floor(numDate);
  const decimal = numDate - year;

  if (decimal === 0) {
    return year.toString();
  }

  // Convert decimal to month (0.1 = Jan, 0.2 = Feb, etc.)
  const month = Math.round(decimal * 10);
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

  return `${monthNames[month - 1] || ""} ${year}`;
}

/**
 * Converts a date to a sortable number
 */
function dateToSortKey(date: number | string): number {
  return typeof date === "string" ? Number.parseFloat(date) : date;
}

/**
 * Formats vertical timeline events for display
 */
export function formatVerticalTimelineEvents(
  eventCollection: VerticalTimelineEventCollection,
  selectedProviderIds?: string[]
): FormattedTimelineEvent[] {
  const formattedEvents: FormattedTimelineEvent[] = [];

  for (const event of eventCollection.events) {
    // Filter by selected providers if specified
    if (selectedProviderIds && selectedProviderIds.length > 0) {
      const hasMatchingProvider = event.providers.some((providerId) =>
        selectedProviderIds.includes(providerId)
      );
      if (!hasMatchingProvider) {
        continue;
      }
    }

    formattedEvents.push({
      date: formatDate(event.date),
      description: event.description,
      providers: event.providers,
      sortKey: dateToSortKey(event.date),
      tags: event.tags,
      title: event.title,
      type: event.type,
    });
  }

  // Sort by date (newest first)
  return formattedEvents.sort((a, b) => b.sortKey - a.sortKey);
}

/**
 * Get all unique provider IDs from an event collection
 */
export function getProvidersFromEvents(
  eventCollection: VerticalTimelineEventCollection
): string[] {
  const providerSet = new Set<string>();

  for (const event of eventCollection.events) {
    for (const provider of event.providers) {
      providerSet.add(provider);
    }
  }

  return Array.from(providerSet).sort();
}

/**
 * LEGACY: Extracts all events from timeline providers and combines them
 * This is kept for backward compatibility but not recommended for vertical timeline
 */
export function extractTimelineEvents(
  providers: Record<string, TimelineProvider>,
  selectedProviderIds?: string[]
): FormattedTimelineEvent[] {
  const eventMap = new Map<string, FormattedTimelineEvent>();

  const providerList = selectedProviderIds
    ? Object.entries(providers).filter(([id]) =>
        selectedProviderIds.includes(id)
      )
    : Object.entries(providers);

  for (const [providerId, provider] of providerList) {
    for (const event of provider.data.events) {
      const sortKey = dateToSortKey(event.when);
      const dateStr = formatDate(event.when);
      const eventKey = `${sortKey}-${event.label}`;

      if (eventMap.has(eventKey)) {
        // Event already exists, add this provider to it
        const existingEvent = eventMap.get(eventKey);
        if (existingEvent && !existingEvent.providers.includes(providerId)) {
          existingEvent.providers.push(providerId);
        }
      } else {
        // New event
        eventMap.set(eventKey, {
          date: dateStr,
          description: event.note,
          providers: [providerId],
          sortKey,
          title: event.label,
          type: event.type,
        });
      }
    }
  }

  // Convert map to array and sort by date (newest first)
  return Array.from(eventMap.values()).sort((a, b) => b.sortKey - a.sortKey);
}

/**
 * Get all unique provider IDs from timeline providers
 */
export function getAllProviderIds(
  providers: Record<string, TimelineProvider>
): string[] {
  return Object.keys(providers);
}

/**
 * Get subscription providers only
 */
export function getSubscriptionProviders(
  providers: Record<string, TimelineProvider>
): Record<string, TimelineProvider> {
  const filtered: Record<string, TimelineProvider> = {};

  for (const [id, provider] of Object.entries(providers)) {
    if (provider.category === "Subscription") {
      filtered[id] = provider;
    }
  }

  return filtered;
}

/**
 * Group events by year
 */
export function groupEventsByYear(
  events: FormattedTimelineEvent[]
): Record<number, FormattedTimelineEvent[]> {
  const grouped: Record<number, FormattedTimelineEvent[]> = {};

  for (const event of events) {
    const year = Math.floor(event.sortKey);
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(event);
  }

  return grouped;
}
