export interface Channel {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_names?: {
    clean: string;
    location: string;
    real: string;
  };
  channel_number: string | number | null;
  chlogo: string;
  channel_group: string;
  channel_url: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  other_data: {
    channel_type: string;
    channel_specs: string;
    channel_availability?: string;
    channel_packages?: string;
    channel_name_group?: string;
  };
  program_count: number;
  uuid?: string;
}

export interface ApiResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
}

export type ViewMode = "card" | "table";
export type GroupBy =
  | "none"
  | "channel_group"
  | "channel_type"
  | "channel_name_group"
  | "channel_specs";

export interface FilterCounts {
  groupCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  specsCounts: Record<string, number>;
  nameGroupCounts: Record<string, number>;
}
