// Channel Map specific types and interfaces

export interface ChannelData {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_number: string;
  channel_group: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  other_data?: {
    channel_type?: string;
    channel_specs?: string;
  };
  channel_network?: string;
}

export interface ApiResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: ChannelData[];
  };
}

export interface SourceData {
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

export interface MergedCell {
  startIndex: number;
  endIndex: number;
  channel: ChannelData | null; // Allow null for empty cells
}

export interface ChannelWithNetworks {
  network: string;
  channelNumber: string;
  locationChannels: Record<string, ChannelData>;
}

export type Density = "comfortable" | "compact";
export type ViewMode = "networks" | "flat";
