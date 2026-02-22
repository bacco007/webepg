// API response structure (nested)
export interface AdditionalDataChannelApi {
  channel_id: string;
  channel_slug?: string;
  channel_name?: string;
  channel_names?: {
    clean?: string;
    location?: string;
    real?: string;
  };
  channel_number?: string;
  chlogo?: string;
  channel_group?: string;
  channel_url?: string;
  channel_logo?: {
    light?: string;
    dark?: string;
  };
  other_data?: {
    channel_type?: string;
    channel_specs?: string;
    channel_availability?: string;
    channel_packages?: string;
  };
  program_count?: string | number;
  // Legacy flat fields (for backward compatibility)
  channel_name_location?: string;
  channel_name_real?: string;
  chantype?: string;
  chancomp?: string | null;
  chanbouq?: string;
  chanlcnfta1?: number | null;
  chanlcnfta2?: number | null;
  chanlcnfta3?: number | null;
  chanlcnfox?: number | null;
  chanlcnfet?: number | null;
  chlogo_light?: string;
  chlogo_dark?: string;
  channel_type?: string;
  channel_availability?: string;
  channel_packages?: string;
  guidelink?: string;
}

// Internal normalized structure (flat)
export interface AdditionalDataChannel {
  channel_id: string;
  channel_slug?: string;
  channel_name?: string;
  channel_name_location?: string;
  channel_name_real?: string;
  chantype?: string;
  chancomp?: string | null;
  channel_url?: string | null;
  chanbouq?: string;
  chanlcnfta1?: number | null;
  chanlcnfta2?: number | null;
  chanlcnfta3?: number | null;
  chanlcnfox?: number | null;
  chanlcnfet?: number | null;
  channel_number?: string;
  chlogo_light?: string;
  chlogo_dark?: string;
  channel_group?: string;
  channel_type?: string;
  chlogo?: string;
  channel_availability?: string;
  channel_packages?: string;
  guidelink?: string;
}

export interface AdditionalDataFile {
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  file_size: number;
  last_modified: string;
}

export interface AdditionalDataListResponse {
  count: number;
  files: AdditionalDataFile[];
}

export interface AdditionalDataResponse {
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  channels: AdditionalDataChannelApi[];
  channel_count: number;
}

export interface CreateAdditionalDataRequest {
  channels: AdditionalDataChannel[];
}

export interface UpdateAdditionalDataRequest {
  channels: AdditionalDataChannel[];
}

export interface CreateAdditionalDataResponse {
  message: string;
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  channel_count: number;
}

export interface UpdateAdditionalDataResponse {
  message: string;
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  channel_count: number;
}

export interface DeleteAdditionalDataResponse {
  message: string;
  file_path: string;
}

export interface ApiErrorResponse {
  detail?: string;
  error?: string;
  error_code?: string;
  error_type?: string;
  status_code?: number;
}
