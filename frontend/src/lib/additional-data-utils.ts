import type {
  AdditionalDataChannel,
  AdditionalDataChannelApi,
} from "@/types/additional-data";

/**
 * Converts API response channel data (nested structure) to internal format (flat structure)
 */
export function normalizeAdditionalDataChannel(
  apiChannel: AdditionalDataChannelApi
): AdditionalDataChannel {
  return {
    chanbouq: apiChannel.chanbouq,
    chancomp: apiChannel.chancomp || null,
    chanlcnfet: apiChannel.chanlcnfet ?? null,
    chanlcnfox: apiChannel.chanlcnfox ?? null,
    chanlcnfta1: apiChannel.chanlcnfta1 ?? null,
    chanlcnfta2: apiChannel.chanlcnfta2 ?? null,
    chanlcnfta3: apiChannel.chanlcnfta3 ?? null,
    channel_availability:
      apiChannel.channel_availability ||
      apiChannel.other_data?.channel_availability ||
      undefined,
    channel_group: apiChannel.channel_group,
    channel_id: apiChannel.channel_id,
    channel_name:
      apiChannel.channel_name || apiChannel.channel_names?.clean || undefined,
    channel_name_location:
      apiChannel.channel_name_location ||
      apiChannel.channel_names?.location ||
      undefined,
    channel_name_real:
      apiChannel.channel_name_real ||
      apiChannel.channel_names?.real ||
      undefined,
    channel_number: apiChannel.channel_number,
    channel_packages:
      apiChannel.channel_packages ||
      apiChannel.other_data?.channel_packages ||
      undefined,
    channel_slug: apiChannel.channel_slug,
    channel_type:
      apiChannel.channel_type ||
      apiChannel.other_data?.channel_type ||
      undefined,
    channel_url: apiChannel.channel_url || null,
    chantype:
      apiChannel.chantype || apiChannel.other_data?.channel_specs || undefined,
    chlogo:
      apiChannel.chlogo ||
      apiChannel.channel_logo?.light ||
      apiChannel.channel_logo?.dark ||
      undefined,
    chlogo_dark:
      apiChannel.chlogo_dark || apiChannel.channel_logo?.dark || undefined,
    chlogo_light:
      apiChannel.chlogo_light || apiChannel.channel_logo?.light || undefined,
    guidelink: apiChannel.guidelink,
  };
}

/**
 * Builds the channel_names object for API format
 */
function buildChannelNames(channel: AdditionalDataChannel): {
  channel_names?: { clean: string; location: string; real: string };
  channel_name?: string;
} {
  const channelName = channel.channel_name || "";
  if (
    channelName ||
    channel.channel_name_location ||
    channel.channel_name_real
  ) {
    return {
      channel_name: channelName,
      channel_names: {
        clean: channelName,
        location: channel.channel_name_location || channelName,
        real: channel.channel_name_real || channelName,
      },
    };
  }
  return {};
}

/**
 * Builds the channel_logo object for API format
 */
function buildChannelLogo(channel: AdditionalDataChannel): {
  channel_logo?: { light: string; dark: string };
  chlogo?: string;
} {
  const logoLight = channel.chlogo_light || "";
  const logoDark = channel.chlogo_dark || "";
  if (logoLight || logoDark) {
    return {
      channel_logo: {
        dark: logoDark || logoLight,
        light: logoLight,
      },
      chlogo: channel.chlogo || logoLight || logoDark,
    };
  }
  return {};
}

/**
 * Builds the other_data object for API format
 */
function buildOtherData(channel: AdditionalDataChannel): {
  other_data: {
    channel_availability: string;
    channel_packages: string;
    channel_specs: string;
    channel_type: string;
  };
} {
  return {
    other_data: {
      channel_availability: channel.channel_availability || "N/A",
      channel_packages: channel.channel_packages || "N/A",
      channel_specs: channel.chantype || "N/A",
      channel_type: channel.channel_type || "N/A",
    },
  };
}

/**
 * Adds legacy fields to the API channel object if present
 */
function addLegacyFields(
  channel: AdditionalDataChannel,
  apiChannel: AdditionalDataChannelApi
): void {
  if (channel.chanbouq) {
    apiChannel.chanbouq = channel.chanbouq;
  }
  if (channel.chancomp) {
    apiChannel.chancomp = channel.chancomp;
  }
  if (channel.chanlcnfta1 !== null && channel.chanlcnfta1 !== undefined) {
    apiChannel.chanlcnfta1 = channel.chanlcnfta1;
  }
  if (channel.chanlcnfta2 !== null && channel.chanlcnfta2 !== undefined) {
    apiChannel.chanlcnfta2 = channel.chanlcnfta2;
  }
  if (channel.chanlcnfta3 !== null && channel.chanlcnfta3 !== undefined) {
    apiChannel.chanlcnfta3 = channel.chanlcnfta3;
  }
  if (channel.chanlcnfox !== null && channel.chanlcnfox !== undefined) {
    apiChannel.chanlcnfox = channel.chanlcnfox;
  }
  if (channel.chanlcnfet !== null && channel.chanlcnfet !== undefined) {
    apiChannel.chanlcnfet = channel.chanlcnfet;
  }
  if (channel.guidelink) {
    apiChannel.guidelink = channel.guidelink;
  }
}

/**
 * Converts internal channel data (flat structure) to API format (nested structure)
 */
export function denormalizeAdditionalDataChannel(
  channel: AdditionalDataChannel
): AdditionalDataChannelApi {
  const apiChannel: AdditionalDataChannelApi = {
    channel_id: channel.channel_id,
  };

  // Add optional top-level fields
  if (channel.channel_slug) {
    apiChannel.channel_slug = channel.channel_slug;
  }
  if (channel.channel_number) {
    apiChannel.channel_number = channel.channel_number;
  }
  if (channel.channel_group) {
    apiChannel.channel_group = channel.channel_group;
  }
  if (channel.channel_url) {
    apiChannel.channel_url = channel.channel_url;
  }

  // Build nested objects
  Object.assign(apiChannel, buildChannelNames(channel));
  Object.assign(apiChannel, buildChannelLogo(channel));
  Object.assign(apiChannel, buildOtherData(channel));

  // Add legacy fields
  addLegacyFields(channel, apiChannel);

  return apiChannel;
}
