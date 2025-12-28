/**
 * Utilities for transforming timeline provider data into vertical timeline events
 */

import type { VerticalTimelineEventCollection } from "@/types/vertical-timeline";
import type { TimelineProvider } from "./timeline-data";

export interface FormattedTimelineEvent {
  date: string;
  description?: string;
  event_type: string[];
  providers: string[];
  sortKey: number;
  tags?: string[];
  title: string;
}

/**
 * Formats a year/decimal date into a readable string
 * @param date - Number like 1995.8 (August 1995), 1985.11 (November 1985), or 2001 (2001)
 * Format: YYYY.M where M is the month number (1-12)
 */
function formatDate(date: number | string): string {
  const numDate = typeof date === "string" ? Number.parseFloat(date) : date;
  const year = Math.floor(numDate);
  const decimal = numDate - year;

  if (decimal === 0) {
    return year.toString();
  }

  // Convert decimal to month number
  // The decimal part represents the month number (1-12)
  // For strings like "1985.11", parse the month directly from the string
  // For numbers, infer from the decimal value
  let month: number;

  if (typeof date === "string") {
    // Parse month from string (e.g., "1985.11" -> 11, "1995.8" -> 8, "1985.08" -> 8)
    const parts = date.split(".");
    const monthStr = parts[1];
    if (monthStr) {
      // Parse the month number from the string (handles "1", "8", "08", "11", etc.)
      month = Number.parseInt(monthStr, 10);
    } else {
      month = Math.round(decimal * 10);
    }
  } else {
    // For numeric input, determine if decimal represents single or double digit month
    const decimalScaled = decimal * 100;
    month =
      decimalScaled >= 10 && decimalScaled <= 12
        ? Math.round(decimalScaled)
        : Math.round(decimal * 10);
  }

  // Ensure month is in valid range
  month = Math.max(1, Math.min(12, month));

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
 * Normalizes months to two-digit decimals (e.g., 1985.1 -> 1985.01, 1985.10 -> 1985.10)
 * to ensure correct sorting (October before November, not before February)
 */
function dateToSortKey(date: number | string): number {
  if (typeof date === "string") {
    const parts = date.split(".");
    const year = Number.parseInt(parts[0] || "0", 10);
    const monthStr = parts[1];

    if (!monthStr) {
      // No month specified, just the year
      return year;
    }

    // Parse the month and normalize to two-digit decimal (01-12)
    const month = Number.parseInt(monthStr, 10);
    return year + month / 100;
  }

  // For numeric input, we need to extract year and month properly
  // The challenge: JavaScript stores 1991.10 as 1991.1 (trailing zero dropped)
  // So 1991.1 could mean January OR October
  // Convention: If the numeric value has 2+ decimal digits that round to 10-12, it's Oct-Dec
  // Otherwise, assume single-digit month (1-9)
  const year = Math.floor(date);
  const decimal = date - year;

  // Calculate what month this decimal represents if treated as month/100
  const monthFromDecimal100 = Math.round(decimal * 100);

  // If decimal * 100 gives us exactly 10, 11, or 12, it's October-December
  // We need to be careful: 0.1 * 100 = 10, but we want to distinguish this from actual 0.10
  // The key is: if decimal * 100 is exactly 10-12 AND the original number had that precision,
  // it's a double-digit month. Otherwise, treat as single-digit.

  // For numbers like 1991.11 or 1991.12, monthFromDecimal100 will be 11 or 12
  // For 1991.1, monthFromDecimal100 will be 10, but we need to check if it was originally 1991.10
  // The way to check: if the decimal is >= 0.10 and <= 0.12, it's Oct-Dec
  // If the decimal is 0.1-0.9, it's Jan-Sep

  if (
    decimal >= 0.1 &&
    decimal <= 0.12 &&
    monthFromDecimal100 >= 10 &&
    monthFromDecimal100 <= 12
  ) {
    // This is October, November, or December
    return year + monthFromDecimal100 / 100;
  }

  // Otherwise, treat as single-digit month (1-9)
  // Multiply decimal by 10 to get the month number
  const singleDigitMonth = Math.round(decimal * 10);
  return year + singleDigitMonth / 100;
}

/**
 * Formats vertical timeline events for display
 */
export function formatVerticalTimelineEvents(
  eventCollection: VerticalTimelineEventCollection,
  selectedProviderIds?: string[],
  selectedEventTypes?: string[]
): FormattedTimelineEvent[] {
  const formattedEvents: FormattedTimelineEvent[] = [];

  for (const event of eventCollection.events) {
    // Filter by selected providers - only filter if selections have been made
    // If array is empty or undefined, show all (don't filter)
    if (selectedProviderIds && selectedProviderIds.length > 0) {
      const hasMatchingProvider = event.providers.some((providerId) =>
        selectedProviderIds.includes(providerId)
      );
      if (!hasMatchingProvider) {
        continue;
      }
    }

    // Filter by selected event types - only filter if selections have been made
    // If array is empty or undefined, show all (don't filter)
    if (selectedEventTypes && selectedEventTypes.length > 0) {
      const hasMatchingEventType = event.event_type.some((eventType) =>
        selectedEventTypes.includes(eventType)
      );
      if (!hasMatchingEventType) {
        continue;
      }
    }

    formattedEvents.push({
      date: formatDate(event.date),
      description: event.description,
      event_type: event.event_type,
      providers: event.providers,
      sortKey: dateToSortKey(event.date),
      tags: event.tags,
      title: event.title,
    });
  }

  // Sort by date (oldest first - chronological order)
  return formattedEvents.sort((a, b) => a.sortKey - b.sortKey);
}

/**
 * Get all unique event types from an event collection
 */
export function getEventTypesFromEvents(
  eventCollection: VerticalTimelineEventCollection
): string[] {
  const eventTypeSet = new Set<string>();

  for (const event of eventCollection.events) {
    for (const eventType of event.event_type) {
      eventTypeSet.add(eventType);
    }
  }

  return Array.from(eventTypeSet).sort();
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
          event_type: [event.type], // Convert single type to array
          providers: [providerId],
          sortKey,
          title: event.label,
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
