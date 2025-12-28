import type {
  AdditionalChannelResponse,
  AdditionalChannelsResponse,
  ApiErrorResponse,
  CreateChannelRequest,
  CreateChannelResponse,
  DeleteChannelResponse,
  UpdateChannelRequest,
  UpdateChannelResponse,
} from "@/types/additional-channels";

const API_BASE_URL = "/api/py/xmlepg/additional-channels";

function getApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("additional-channels-api-key");
}

function setApiKey(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("additional-channels-api-key", key);
}

export function getStoredApiKey(): string | null {
  return getApiKey();
}

export function storeApiKey(key: string): void {
  setApiKey(key);
}

function getHeaders(): HeadersInit {
  const apiKey = getApiKey();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = (await response.json()) as ApiErrorResponse;
    } catch {
      const text = await response.text();
      errorData = {
        error: text || `HTTP error! status: ${response.status}`,
        error_code: "HTTP_ERROR",
        error_type: "HttpError",
        status_code: response.status,
      };
    }

    const errorMessage =
      errorData.error || `HTTP error! status: ${response.status}`;
    const error = new Error(errorMessage);
    (
      error as Error & { statusCode?: number; errorData?: ApiErrorResponse }
    ).statusCode = response.status;
    (
      error as Error & { statusCode?: number; errorData?: ApiErrorResponse }
    ).errorData = errorData;
    throw error;
  }

  return response.json() as Promise<T>;
}

export async function getAllChannels(): Promise<AdditionalChannelsResponse> {
  const response = await fetch(API_BASE_URL, {
    headers: getHeaders(),
  });

  return handleResponse<AdditionalChannelsResponse>(response);
}

export async function getChannel(
  id: string
): Promise<AdditionalChannelResponse> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: getHeaders(),
  });

  return handleResponse<AdditionalChannelResponse>(response);
}

export async function createChannel(
  channelData: CreateChannelRequest
): Promise<CreateChannelResponse> {
  const response = await fetch(API_BASE_URL, {
    body: JSON.stringify(channelData),
    headers: getHeaders(),
    method: "POST",
  });

  return handleResponse<CreateChannelResponse>(response);
}

function normalizeChannelData(
  data: CreateChannelRequest
): Record<string, string> {
  const fields: (keyof CreateChannelRequest)[] = [
    "chanbouq",
    "chancomp",
    "chanlcnfet",
    "chanlcnfox",
    "chanlcnfta1",
    "chanlcnfta2",
    "chanlcnfta3",
    "channel_availability",
    "channel_group",
    "channel_id",
    "channel_name",
    "channel_name_location",
    "channel_name_real",
    "channel_number",
    "channel_packages",
    "channel_slug",
    "channel_type",
    "channel_url",
    "chantype",
    "chlogo_dark",
    "chlogo_light",
    "guidelink",
  ];

  const result: Record<string, string> = {};
  for (const field of fields) {
    result[field] = String(data[field] ?? "");
  }
  return result;
}

export async function updateChannel(
  id: string,
  channelData: UpdateChannelRequest
): Promise<UpdateChannelResponse> {
  // Remove id from the request body as it's in the path parameter
  const { id: _, ...dataWithoutId } = channelData as CreateChannelRequest & {
    id?: string;
  };

  const updateData = normalizeChannelData(dataWithoutId);

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    body: JSON.stringify(updateData),
    headers: getHeaders(),
    method: "PUT",
  });

  return handleResponse<UpdateChannelResponse>(response);
}

export async function deleteChannel(
  id: string
): Promise<DeleteChannelResponse> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: getHeaders(),
    method: "DELETE",
  });

  return handleResponse<DeleteChannelResponse>(response);
}
