export interface SourceLogo {
  light: string;
  dark: string;
}

export interface XmltvSource {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo?: SourceLogo;
}

export interface SourcesResponse {
  count: number;
  sources: XmltvSource[];
}

export interface CreateSourceRequest {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo?: SourceLogo;
}

export interface UpdateSourceRequest extends Partial<CreateSourceRequest> {}

export interface ApiErrorResponse {
  error: string;
  error_type: string;
  error_code: string;
  status_code: number;
}

export interface CreateSourceResponse {
  message: string;
  source: XmltvSource;
}

export interface UpdateSourceResponse {
  message: string;
  source: XmltvSource;
}

export interface DeleteSourceResponse {
  message: string;
}

export type SourceType = "remote" | "local";

