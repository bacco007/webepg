// Regex for channel number parsing - defined at top level for performance
const CHANNEL_NUMBER_REGEX = /^(\d+)([a-zA-Z]*)$/;

interface Channel {
  guidelink: string;
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_url: string;
  channel_number: string;
  channel_group: string;
  chlogo: string;
  program_count: number;
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  other_data: {
    channel_type: string;
    channel_specs: string;
  };
}

type UniqueChannel = Omit<Channel, "channel_number"> & {
  channel_numbers: string[];
  isGrouped: boolean;
};

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo: {
    light: string;
    dark: string;
  };
}

/**
 * Sorts channel numbers properly, handling numeric and alphabetic parts
 */
export function sortChannelNumbers(a: string, b: string): number {
  // Handle edge cases
  if (!(a || b)) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }

  // Handle "N/A" or other non-numeric values
  if (a === "N/A" && b === "N/A") {
    return 0;
  }
  if (a === "N/A") {
    return 1;
  }
  if (b === "N/A") {
    return -1;
  }

  // Extract numeric and alphabetic parts from channel numbers
  const aMatch = a.match(CHANNEL_NUMBER_REGEX);
  const bMatch = b.match(CHANNEL_NUMBER_REGEX);

  // Default values if no match
  const aNum = aMatch
    ? Number.parseInt(aMatch[1], 10)
    : Number.POSITIVE_INFINITY;
  const aLetter = aMatch ? aMatch[2] : "";
  const bNum = bMatch
    ? Number.parseInt(bMatch[1], 10)
    : Number.POSITIVE_INFINITY;
  const bLetter = bMatch ? bMatch[2] : "";

  // First sort by numeric part
  if (aNum !== bNum) {
    return aNum - bNum;
  }

  // Then sort by alphabetic part
  if (aLetter !== bLetter) {
    return aLetter.localeCompare(bLetter);
  }

  // If both parts are the same, sort by the original string
  return a.localeCompare(b);
}

/**
 * Processes raw channel data to create unique channels with grouped channel numbers
 */
export function processChannels(channels: Channel[]): UniqueChannel[] {
  const uniqueChannels = channels.reduce((accumulator, channel) => {
    if (channel.channel_id === "NOEPG" || channel.channel_id.startsWith("R_")) {
      accumulator.push({
        ...channel,
        channel_numbers: [channel.channel_number],
        isGrouped: false,
      });
    } else {
      const existingChannel = accumulator.find(
        (c) =>
          c.channel_id === channel.channel_id &&
          c.other_data.channel_specs === channel.other_data.channel_specs
      );
      if (existingChannel) {
        existingChannel.channel_numbers.push(channel.channel_number);
        existingChannel.isGrouped = true;
      } else {
        accumulator.push({
          ...channel,
          channel_numbers: [channel.channel_number],
          isGrouped: false,
        });
      }
    }
    return accumulator;
  }, [] as UniqueChannel[]);

  // Sort channels by channel number, then by location
  uniqueChannels.sort((a, b) => {
    const result = sortChannelNumbers(
      a.channel_numbers[0],
      b.channel_numbers[0]
    );
    if (result !== 0) {
      return result;
    }
    return a.channel_names.location.localeCompare(b.channel_names.location);
  });

  return uniqueChannels;
}

/**
 * Groups channels by network/group
 */
export function groupChannelsByNetwork(
  channels: UniqueChannel[]
): Record<string, UniqueChannel[]> {
  return channels.reduce(
    (groups, channel) => {
      const group = channel.channel_group;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(channel);
      return groups;
    },
    {} as Record<string, UniqueChannel[]>
  );
}

/**
 * Sorts network names with "Ungrouped" at the end
 */
export function sortNetworks(networks: string[]): string[] {
  return networks.sort((a, b) => {
    if (a === "Ungrouped") {
      return 1;
    }
    if (b === "Ungrouped") {
      return -1;
    }
    return a.localeCompare(b);
  });
}

/**
 * Filters sources for Freeview AU
 */
export function filterFreeviewSources(sources: Source[]): Source[] {
  return sources.filter(
    (source) =>
      source.group === "Australia" &&
      source.subgroup.includes("FTA") &&
      !source.subgroup.includes("Streaming") &&
      !source.subgroup.includes("All Regions") &&
      !source.subgroup.includes("by Network")
  );
}

/**
 * Groups sources by subgroup and sorts them
 */
export function groupAndSortSources(
  sources: Source[]
): Record<string, Source[]> {
  const grouped = sources.reduce(
    (accumulator, source) => {
      if (!accumulator[source.subgroup]) {
        accumulator[source.subgroup] = [];
      }
      accumulator[source.subgroup].push(source);
      return accumulator;
    },
    {} as Record<string, Source[]>
  );

  // Sort sources alphabetically within each subgroup
  for (const subgroup of Object.keys(grouped)) {
    grouped[subgroup].sort((a, b) => a.location.localeCompare(b.location));
  }

  return grouped;
}

/**
 * Creates initial open groups state
 */
export function createInitialOpenGroups(
  groupedSources: Record<string, Source[]>,
  selectedSourceId?: string,
  allSources?: Source[]
): { [key: string]: boolean } {
  const initialOpenGroups = Object.keys(groupedSources).reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as { [key: string]: boolean }
  );

  if (selectedSourceId && allSources) {
    const selectedSource = allSources.find((s) => s.id === selectedSourceId);
    if (selectedSource) {
      return {
        ...initialOpenGroups,
        [selectedSource.subgroup]: true,
      };
    }
  }

  return initialOpenGroups;
}
