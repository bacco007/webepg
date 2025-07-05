import { ALL_STATES, type ChannelData, type MergedCell } from "./types";

// Helper function to create a placeholder channel for merged cells
function createPlaceholderChannel(channelName: string): ChannelData {
  return {
    channel_names: {
      location: channelName,
      clean: channelName,
      real: channelName,
    },
    // Add other required properties with placeholder values
    channel_id: "",
    channel_slug: "",
    channel_name: channelName,
    channel_number: "",
    channel_group: "",
    channel_logo: { light: "", dark: "" },
  };
}

// Helper function to end the current merge and add it to mergedCells
function endCurrentMerge(
  mergedCells: MergedCell[],
  currentMergeStart: number,
  endIndex: number,
  currentChannelName: string | null
): void {
  if (currentMergeStart !== -1) {
    mergedCells.push({
      startIndex: currentMergeStart,
      endIndex,
      channel: currentChannelName
        ? createPlaceholderChannel(currentChannelName)
        : null,
    });
  }
}

// Process a state that has a channel
function processStateWithChannel(
  mergedCells: MergedCell[],
  stateChannels: Record<string, ChannelData>,
  stateCode: string,
  i: number,
  currentMergeStart: number,
  currentChannelName: string | null
): { newMergeStart: number; newChannelName: string | null } {
  const channel = stateChannels[stateCode];
  const channelName = channel.channel_names.location || channel.channel_name;

  // If we're not in a merge or the channel name is different, start a new merge
  if (currentMergeStart === -1 || channelName !== currentChannelName) {
    // If we were in a merge, end it
    endCurrentMerge(mergedCells, currentMergeStart, i - 1, currentChannelName);

    // Start a new merge
    return { newMergeStart: i, newChannelName: channelName };
  }

  // If the channel name is the same, continue the current merge
  return {
    newMergeStart: currentMergeStart,
    newChannelName: currentChannelName,
  };
}

// Process a state that doesn't have a channel
function processStateWithoutChannel(
  mergedCells: MergedCell[],
  i: number,
  currentMergeStart: number,
  currentChannelName: string | null
): { newMergeStart: number; newChannelName: string | null } {
  if (currentMergeStart !== -1) {
    // This state doesn't have a channel and we're in a merge
    // End the current merge
    endCurrentMerge(mergedCells, currentMergeStart, i - 1, currentChannelName);

    // Start a new "Not available" merge
    return { newMergeStart: i, newChannelName: null };
  }

  // Start a new "Not available" merge
  return { newMergeStart: i, newChannelName: null };
}

// Get merged cells for the table display
export function getMergedCells(
  stateChannels: Record<string, ChannelData>
): MergedCell[] {
  const mergedCells: MergedCell[] = [];

  // First, identify which states have channels
  const statesWithChannels = new Set(Object.keys(stateChannels));

  // For each state in ALL_STATES, check if it has a channel
  let currentMergeStart = -1;
  let currentChannelName: string | null = null;

  for (let i = 0; i < ALL_STATES.length; i++) {
    const stateCode = ALL_STATES[i].code;
    const hasChannel = statesWithChannels.has(stateCode);

    if (hasChannel) {
      const result = processStateWithChannel(
        mergedCells,
        stateChannels,
        stateCode,
        i,
        currentMergeStart,
        currentChannelName
      );
      currentMergeStart = result.newMergeStart;
      currentChannelName = result.newChannelName;
    } else {
      const result = processStateWithoutChannel(
        mergedCells,
        i,
        currentMergeStart,
        currentChannelName
      );
      currentMergeStart = result.newMergeStart;
      currentChannelName = result.newChannelName;
    }
  }

  // Add the last merge if there is one
  endCurrentMerge(
    mergedCells,
    currentMergeStart,
    ALL_STATES.length - 1,
    currentChannelName
  );

  return mergedCells;
}
