import { abbreviateText, stateAbbreviations } from "@/lib/abbreviation-utils";
import { sortChannelsByNumber } from "@/lib/channel-utils";
import { decodeHtml } from "@/lib/html-utils";
import type { Channel } from "./types";

export const getChannelDisplayName = (channel: Channel): string => {
  return decodeHtml(
    channel.channel_names?.location || channel.channel_name || ""
  );
};

export const getChannelDisplayNameWithAbbreviations = (channel: Channel): string => {
  const displayName = getChannelDisplayName(channel);
  return abbreviateText(displayName, stateAbbreviations);
};

// Example of how to use different abbreviation lists
export const getChannelDisplayNameWithCustomAbbreviations = (
  channel: Channel, 
  abbreviations: Record<string, string>
): string => {
  const displayName = getChannelDisplayName(channel);
  return abbreviateText(displayName, abbreviations);
};

export const getChannelNumber = (channel: Channel): string => {
  return typeof channel.channel_number === "string"
    ? channel.channel_number
    : "";
};

export const sortChannels = (channels: Channel[]): Channel[] => {
  return sortChannelsByNumber(
    channels,
    getChannelNumber,
    getChannelDisplayName
  );
};

export const getGroupKey = (channel: Channel, groupBy: string): string => {
  switch (groupBy) {
    case "channel_group": {
      return channel.channel_group;
    }
    case "channel_type": {
      return channel.other_data.channel_type;
    }
    case "channel_name_group": {
      return channel.other_data.channel_name_group || "Ungrouped";
    }
    case "channel_specs": {
      return channel.other_data.channel_specs;
    }
    default: {
      return "Unknown";
    }
  }
};

export const groupChannels = (
  channels: Channel[],
  groupBy: string
): Record<string, Channel[]> => {
  const groupedChannels: Record<string, Channel[]> = {};

  for (const channel of channels) {
    const groupKey = getGroupKey(channel, groupBy);
    if (groupKey !== "N/A") {
      if (!groupedChannels[groupKey]) {
        groupedChannels[groupKey] = [];
      }
      groupedChannels[groupKey].push(channel);
    }
  }

  return groupedChannels;
};

export const getSortIcon = (isSorted: boolean | "asc" | "desc") => {
  if (isSorted === "asc") {
    return "asc";
  }
  if (isSorted === "desc") {
    return "desc";
  }
  return null;
};

export const getColumnDisplayName = (columnId: string): string => {
  switch (columnId) {
    case "number": {
      return "Ch No";
    }
    case "nameGroup": {
      return "Name Group";
    }
    default: {
      return columnId.charAt(0).toUpperCase() + columnId.slice(1);
    }
  }
};

export const getGroupByDisplayName = (groupBy: string): string => {
  switch (groupBy) {
    case "channel_group": {
      return "Group";
    }
    case "channel_type": {
      return "Type";
    }
    case "channel_specs": {
      return "Specs";
    }
    case "channel_name_group": {
      return "Name Group";
    }
    default: {
      return "Unknown";
    }
  }
};
