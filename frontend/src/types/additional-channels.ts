export interface AdditionalChannel {
  id: string;
  guidelink: string;
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_name_location: string;
  channel_name_real: string;
  chantype: string;
  chancomp: string;
  channel_url: string;
  chanbouq: string;
  chanlcnfta1: string;
  chanlcnfta2: string;
  chanlcnfta3: string;
  chanlcnfox: string;
  chanlcnfet: string;
  channel_number: string;
  chlogo_light: string;
  chlogo_dark: string;
  channel_group: string;
  channel_type: string;
  channel_availability: string;
  channel_packages: string;
}

export interface AdditionalChannelsResponse {
  count: number;
  channels: AdditionalChannel[];
}

export interface AdditionalChannelResponse {
  id: string;
  guidelink: string;
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_name_location: string;
  channel_name_real: string;
  chantype: string;
  chancomp: string;
  channel_url: string;
  chanbouq: string;
  chanlcnfta1: string;
  chanlcnfta2: string;
  chanlcnfta3: string;
  chanlcnfox: string;
  chanlcnfet: string;
  channel_number: string;
  chlogo_light: string;
  chlogo_dark: string;
  channel_group: string;
  channel_type: string;
  channel_availability: string;
  channel_packages: string;
}

export interface CreateChannelRequest {
  guidelink: string;
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_name_location?: string;
  channel_name_real?: string;
  chantype?: string;
  chancomp?: string;
  channel_url?: string;
  chanbouq?: string;
  chanlcnfta1?: string;
  chanlcnfta2?: string;
  chanlcnfta3?: string;
  chanlcnfox?: string;
  chanlcnfet?: string;
  channel_number?: string;
  chlogo_light?: string;
  chlogo_dark?: string;
  channel_group?: string;
  channel_type?: string;
  channel_availability?: string;
  channel_packages?: string;
  id?: string;
}

export interface UpdateChannelRequest extends Partial<CreateChannelRequest> {}

export interface ApiErrorResponse {
  error: string;
  error_type: string;
  error_code: string;
  status_code: number;
}

export interface CreateChannelResponse {
  message: string;
  channel: AdditionalChannel;
}

export interface UpdateChannelResponse {
  message: string;
  channel: AdditionalChannel;
}

export interface DeleteChannelResponse {
  message: string;
}

