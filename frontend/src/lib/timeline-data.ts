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
  colorBy?: "channel_genre" | "channel_network"; // Which attribute to use for coloring (defaults to channel_genre)
  colorMap?: Record<string, string>; // Optional custom color mapping
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
  channel_network?: string;
  channel_notes?: string;
};

// Import individual providers
import { austar } from "./timeline-providers/austar";
import { ectv } from "./timeline-providers/ectv";
import { fetchtv } from "./timeline-providers/fetchtv";
import { foxtelanalogue } from "./timeline-providers/foxtelanalogue";
import { foxteldigital } from "./timeline-providers/foxteldigital";
import { freeview_metro } from "./timeline-providers/freeview_metro";
import { galaxy } from "./timeline-providers/galaxy";
import { ncable } from "./timeline-providers/ncable";
import { optus } from "./timeline-providers/optus";
import { optusitv } from "./timeline-providers/optusitv";
import { tarbs } from "./timeline-providers/tarbs";
import { transact } from "./timeline-providers/transact";

// Export all providers
export const timelineProviders: Record<string, TimelineProvider> = {
  austar,
  ectv,
  fetchtv,
  foxtelanalogue,
  foxteldigital,
  freeview_metro,
  galaxy,
  ncable,
  optus,
  optusitv,
  tarbs,
  transact,
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
