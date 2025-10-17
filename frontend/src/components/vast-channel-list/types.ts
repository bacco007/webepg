export type ChannelData = {
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
};

export type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: ChannelData[];
  };
};

export type ZoneConfig = {
  name: string;
  states: {
    code: string;
    name: string;
  }[];
  color: string;
};

export type MergedCell = {
  startIndex: number;
  endIndex: number;
  channel: ChannelData | null; // Allow null for empty cells
};

export const ZONES: ZoneConfig[] = [
  {
    color: "bg-blue-100 dark:bg-blue-950/30",
    name: "South Zone",
    states: [
      { code: "NSW", name: "NSW" },
      { code: "VIC", name: "VIC" },
      { code: "TAS", name: "TAS" },
      { code: "SA", name: "SA" },
    ],
  },
  {
    color: "bg-green-100 dark:bg-green-950/30",
    name: "North Zone",
    states: [
      { code: "QLD", name: "QLD" },
      { code: "NT", name: "NT" },
    ],
  },
  {
    color: "bg-amber-100 dark:bg-amber-950/30",
    name: "West Zone",
    states: [{ code: "WA", name: "WA" }],
  },
];

// Flatten all states into a single array for easier indexing
export const ALL_STATES = ZONES.flatMap((zone) => zone.states);

export type ChannelMap = {
  [network: string]: {
    [channelNumber: string]: {
      [stateCode: string]: ChannelData;
    };
  };
};

export type FilterState = {
  globalFilter: string;
  selectedNetworks: string[];
  selectedChannelTypes: string[];
  selectedChannelSpecs: string[];
  networkSearch: string;
  typeSearch: string;
  specsSearch: string;
};
