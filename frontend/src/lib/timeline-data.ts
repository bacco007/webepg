/**
 * Timeline Provider Data Structure
 * Defines different TV providers and their historical timeline data
 */

export type TimelineProvider = {
  id: string;
  name: string;
  description: string;
  country: string;
  category: "Subscription" | "Free-to-Air" | "Satellite" | "Streaming";
  data: TimelineData;
};

export type TimelineData = {
  title: string;
  description: string;
  axis: {
    unit: "year";
    start: number;
    end: number;
  };
  events: TimelineEvent[];
  channels: Record<string, ChannelSpan[]>;
};

export type TimelineEvent = {
  when: number | string; // Support string for dates like "2010.10" (October)
  type: string;
  label: string;
  note?: string;
};

export type ChannelSpan = {
  from: number | string; // Support string for dates like "2010.10" (October)
  to?: number | string; // Support string for dates like "2010.10" (October)
  channel_name: string;
  channel_genre?: string;
  channel_notes?: string;
};

// Import individual providers
import { austar } from "./timeline-providers/austar";
import { foxtelanalogue } from "./timeline-providers/foxtelanalogue";
import { foxteldigital } from "./timeline-providers/foxteldigital";
import { galaxy } from "./timeline-providers/galaxy";
import { optus } from "./timeline-providers/optus";

// Export all providers
export const timelineProviders: Record<string, TimelineProvider> = {
  austar,
  foxtelanalogue,
  foxteldigital,
  galaxy,
  optus,
};

// Helper function to get providers grouped by category
export function getProvidersByCategory(): Record<string, TimelineProvider[]> {
  const grouped: Record<string, TimelineProvider[]> = {};

  for (const provider of Object.values(timelineProviders)) {
    if (!grouped[provider.category]) {
      grouped[provider.category] = [];
    }
    grouped[provider.category].push(provider);
  }

  return grouped;
}

// Helper function to get all provider IDs
export function getAllProviderIds(): string[] {
  return Object.keys(timelineProviders);
}

// Helper function to get a specific provider
export function getProvider(id: string): TimelineProvider | undefined {
  return timelineProviders[id];
}
