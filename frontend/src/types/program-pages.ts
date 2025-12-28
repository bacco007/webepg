export interface Channel {
  id: string;
  name: string;
  icon: {
    light: string;
    dark: string;
  };
  slug: string;
  lcn: string;
  group: string;
}

export interface Program {
  title: string;
  start: string;
  end: string;
  description: string;
  categories: string[];
  subtitle: string;
  episode: string;
  original_air_date: string;
  rating: string;
}

export interface ChannelPrograms {
  channel: Channel;
  programs: {
    [date: string]: Program[];
  };
}

export interface ProgramPageData {
  date_pulled: string;
  query: string;
  source: string;
  start_date: string;
  end_date: string;
  timezone: string;
  channels: ChannelPrograms[];
}

export interface ChannelCardProps {
  channelData: ChannelPrograms;
  onNavigate: () => void;
  onNavigateToFullWeek: (channelSlug: string) => void;
}
