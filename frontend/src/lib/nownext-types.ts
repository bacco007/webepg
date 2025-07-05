export interface Program {
  title: string;
  subtitle: string;
  episode: string | null;
  start: string;
  stop: string;
  desc: string | null;
  category: string[];
  rating: string;
  lengthstring: string;
}

export interface Channel {
  nextProgram: Program | null;
  afterNextProgram: Program | null;
  id: string;
  name: {
    clean: string;
    location: string;
    real: string;
  };
  icon: {
    light: string;
    dark: string;
  };
  slug: string;
  lcn: string;
  group: string;
}

export interface ChannelData {
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  afterNextProgram: Program | null;
}

export type GroupBy = "none" | "channel_group" | "channel_type";
export type ViewMode = "card" | "table" | "mobile";
