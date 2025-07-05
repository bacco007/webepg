export interface ChannelData {
  channel: {
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
  };
  currentProgram: {
    title: string;
    subtitle: string;
    episode: string | null;
    start: string;
    stop: string;
    desc: string;
    category: string[];
    rating: string;
    lengthstring: string;
  };
}

export interface ApiResponse {
  data: ChannelData[];
}

export type XmlTvDataSource = string;
