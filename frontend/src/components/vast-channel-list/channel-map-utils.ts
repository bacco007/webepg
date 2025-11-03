import type { ChannelData, ChannelMap } from "./types";

// Helper function to check if a channel should be excluded from a state
function shouldExcludeChannelFromState(
  network: string,
  stateCode: string
): boolean {
  // For West Digital Television, ensure they only appear in WA
  if (network.includes("West Digital Television") && stateCode !== "WA") {
    return true;
  }

  // For other networks that might have state-specific naming
  if (network.includes("Southern Cross")) {
    if (network.includes("WA") && stateCode !== "WA") {
      return true;
    }
    if (network.includes("NT") && stateCode !== "NT") {
      return true;
    }
    if (network.includes("QLD") && stateCode !== "QLD") {
      return true;
    }
  }

  return false;
}

// Collect all unique channel numbers by network
function collectChannelNumbers(
  channelData: Record<string, ChannelData[]>
): Record<string, Set<string>> {
  const networks: Record<string, Set<string>> = {};

  for (const channels of Object.values(channelData)) {
    for (const channel of channels) {
      const network = channel.channel_group || "Other";
      if (!networks[network]) {
        networks[network] = new Set();
      }

      // Use channel number as the identifier
      if (channel.channel_number) {
        networks[network].add(channel.channel_number);
      }
    }
  }

  return networks;
}

// Group channels by network and channel number
export function getChannelMap(
  channelData: Record<string, ChannelData[]>
): ChannelMap {
  const channelMap: ChannelMap = {};
  const networks = collectChannelNumbers(channelData);

  // Organize channels by network, channel number, and state
  for (const [network, channelNumbers] of Object.entries(networks)) {
    channelMap[network] = {};

    for (const channelNumber of channelNumbers) {
      channelMap[network][channelNumber] = {};

      // Find this channel number in each state
      for (const [stateCode, channels] of Object.entries(channelData)) {
        // Skip if this channel should be excluded from this state
        if (shouldExcludeChannelFromState(network, stateCode)) {
          continue;
        }

        // Find channels with matching number and network
        const matchingChannels = channels.filter(
          (c) =>
            c.channel_number === channelNumber && c.channel_group === network
        );

        // If multiple channels match, use the first one
        if (matchingChannels.length > 0) {
          channelMap[network][channelNumber][stateCode] = matchingChannels[0];
        }
      }
    }
  }

  return channelMap;
}

// Get a representative channel name for display in the first column
export function getChannelDisplayName(
  stateChannels: Record<string, ChannelData>
): string {
  // Get the first available channel
  const firstChannel = Object.values(stateChannels)[0];
  if (!firstChannel) {
    return "Unknown Channel";
  }

  // Use the clean name as it's usually the most generic
  return firstChannel.channel_names.clean;
}

// Check if a channel matches the current filters
export function channelMatchesFilters(
  channel: ChannelData,
  filters: {
    globalFilter: string;
    selectedNetworks: string[];
    selectedChannelTypes: string[];
    selectedChannelSpecs: string[];
  }
): boolean {
  const {
    globalFilter,
    selectedNetworks,
    selectedChannelTypes,
    selectedChannelSpecs,
  } = filters;

  // Filter by network
  if (
    selectedNetworks.length > 0 &&
    !selectedNetworks.includes(channel.channel_group)
  ) {
    return false;
  }

  // Filter by channel type
  if (
    selectedChannelTypes.length > 0 &&
    !(
      channel.other_data?.channel_type &&
      selectedChannelTypes.includes(channel.other_data.channel_type)
    )
  ) {
    return false;
  }

  // Filter by channel specs
  if (
    selectedChannelSpecs.length > 0 &&
    !(
      channel.other_data?.channel_specs &&
      selectedChannelSpecs.includes(channel.other_data.channel_specs)
    )
  ) {
    return false;
  }

  // Filter by search term
  if (globalFilter) {
    const searchTerm = globalFilter.toLowerCase();
    return (
      channel.channel_name.toLowerCase().includes(searchTerm) ||
      channel.channel_names.real.toLowerCase().includes(searchTerm) ||
      channel.channel_number.toLowerCase().includes(searchTerm) ||
      channel.channel_group.toLowerCase().includes(searchTerm) ||
      (channel.other_data?.channel_type || "")
        .toLowerCase()
        .includes(searchTerm) ||
      (channel.other_data?.channel_specs || "")
        .toLowerCase()
        .includes(searchTerm)
    );
  }

  return true;
}

// Apply filters to the channel map
export function getFilteredChannelMap(
  channelMap: ChannelMap,
  filters: {
    globalFilter: string;
    selectedNetworks: string[];
    selectedChannelTypes: string[];
    selectedChannelSpecs: string[];
  }
): ChannelMap {
  const {
    globalFilter,
    selectedNetworks,
    selectedChannelTypes,
    selectedChannelSpecs,
  } = filters;

  if (
    !globalFilter &&
    selectedNetworks.length === 0 &&
    selectedChannelTypes.length === 0 &&
    selectedChannelSpecs.length === 0
  ) {
    return channelMap;
  }

  const filteredMap: ChannelMap = {};

  for (const [network, channels] of Object.entries(channelMap)) {
    // Filter by network
    if (selectedNetworks.length > 0 && !selectedNetworks.includes(network)) {
      continue;
    }

    // Add network to filtered map
    filteredMap[network] = {};

    for (const [channelNumber, stateChannels] of Object.entries(channels)) {
      // Check if any state's channel matches the filters
      const anyStateMatches = Object.values(stateChannels).some((channel) =>
        channelMatchesFilters(channel, {
          globalFilter,
          selectedChannelSpecs,
          selectedChannelTypes,
          selectedNetworks,
        })
      );

      if (anyStateMatches) {
        filteredMap[network][channelNumber] = stateChannels;
      }
    }

    // Remove empty networks
    if (Object.keys(filteredMap[network]).length === 0) {
      delete filteredMap[network];
    }
  }

  return filteredMap;
}

// Get all unique channel types and specs
export function getChannelTypes(
  channelData: Record<string, ChannelData[]>
): string[] {
  const types = new Set<string>();
  for (const channels of Object.values(channelData)) {
    for (const channel of channels) {
      if (channel.other_data?.channel_type) {
        types.add(channel.other_data.channel_type);
      }
    }
  }
  return Array.from(types).sort();
}

export function getChannelSpecs(
  channelData: Record<string, ChannelData[]>
): string[] {
  const specs = new Set<string>();
  for (const channels of Object.values(channelData)) {
    for (const channel of channels) {
      if (channel.other_data?.channel_specs) {
        specs.add(channel.other_data.channel_specs);
      }
    }
  }
  return Array.from(specs).sort();
}

// Calculate counts for filter options
export function getNetworkCounts(
  channelMap: ChannelMap,
  filters: {
    globalFilter: string;
    selectedChannelTypes: string[];
    selectedChannelSpecs: string[];
  }
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const [network, channels] of Object.entries(channelMap)) {
    // Count channels that would match other filters
    let count = 0;

    for (const stateChannels of Object.values(channels)) {
      const anyStateMatches = Object.values(stateChannels).some((channel) =>
        channelMatchesFilters(channel, { ...filters, selectedNetworks: [] })
      );

      if (anyStateMatches) {
        count += 1;
      }
    }

    counts[network] = count;
  }

  return counts;
}

export function getTypeCounts(
  channelData: Record<string, ChannelData[]>,
  channelTypes: string[],
  filters: {
    globalFilter: string;
    selectedNetworks: string[];
    selectedChannelSpecs: string[];
  }
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const type of channelTypes) {
    // Count channels that match this type and other filters
    let count = 0;

    for (const channels of Object.values(channelData)) {
      for (const channel of channels) {
        if (channel.other_data?.channel_type !== type) {
          continue;
        }

        if (
          channelMatchesFilters(channel, {
            ...filters,
            selectedChannelTypes: [],
          })
        ) {
          count += 1;
        }
      }
    }

    counts[type] = count;
  }

  return counts;
}

export function getSpecsCounts(
  channelData: Record<string, ChannelData[]>,
  channelSpecs: string[],
  filters: {
    globalFilter: string;
    selectedNetworks: string[];
    selectedChannelTypes: string[];
  }
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const spec of channelSpecs) {
    // Count channels that match this spec and other filters
    let count = 0;

    for (const channels of Object.values(channelData)) {
      for (const channel of channels) {
        if (channel.other_data?.channel_specs !== spec) {
          continue;
        }

        if (
          channelMatchesFilters(channel, {
            ...filters,
            selectedChannelSpecs: [],
          })
        ) {
          count += 1;
        }
      }
    }

    counts[spec] = count;
  }

  return counts;
}
