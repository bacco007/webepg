export interface Program {
  guideid: string;
  start_time: string;
  end_time: string;
  start: string;
  end: string;
  title: string;
  subtitle?: string;
  description?: string;
  categories?: string[];
  rating?: string;
  new?: boolean;
  premiere?: boolean;
  channel?: string;
}

export interface Channel {
  channel: {
    id: string;
    name: {
      clean: string;
      location?: string;
      real?: string;
    };
    icon: {
      light: string;
      dark: string;
    };
    slug: string;
    lcn: string;
  };
  programs: Program[];
  channel_group?: string;
}

export interface TVGuideData {
  date_pulled: string;
  query: string;
  source: string;
  date: string;
  channels: Channel[];
}

export interface DateData {
  date: string;
  query: string;
  source: string;
  data: string[];
}

// Add channel data types based on the API response
export interface ChannelData {
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

export interface ChannelsResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: ChannelData[];
  };
}
