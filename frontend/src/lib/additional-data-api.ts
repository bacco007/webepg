import {
  denormalizeAdditionalDataChannel,
  normalizeAdditionalDataChannel,
} from "@/lib/additional-data-utils";
import type {
  AdditionalDataChannel,
  AdditionalDataListResponse,
  AdditionalDataResponse,
  ApiErrorResponse,
  CreateAdditionalDataRequest,
  CreateAdditionalDataResponse,
  DeleteAdditionalDataResponse,
  UpdateAdditionalDataRequest,
  UpdateAdditionalDataResponse,
} from "@/types/additional-data";

const API_BASE_URL = "/api/py/sources/additional-data";

// Regex for cleaning up double-wrapped error messages
// Matches patterns like: "Source 'Additional data file for source 'X' not found' not found"
// Handles both single and double quotes, and nested quotes
const DOUBLE_WRAPPED_ERROR_REGEX = /Source\s+['"](.+?)['"]\s+not found/i;
const ADDITIONAL_DATA_ERROR_REGEX =
  /Additional data file for source\s+['"](.+?)['"]\s+not found/i;
const SOURCE_PATTERN_REGEX = /Source\s+['"]/i;

// Regex for removing trailing underscores from source IDs
const TRAILING_UNDERSCORES_REGEX = /_+$/;

/**
 * Cleans up confusing double-wrapped error messages from the API
 * @param errorMessage - The raw error message from the API
 * @returns A cleaned error message
 */
function cleanErrorMessage(errorMessage: string): string {
  // Check if this is a double-wrapped error message
  if (!SOURCE_PATTERN_REGEX.test(errorMessage)) {
    return errorMessage;
  }

  // Try to extract the inner message
  const match = DOUBLE_WRAPPED_ERROR_REGEX.exec(errorMessage);
  if (!match?.[1]) {
    return errorMessage;
  }

  const innerMessage = match[1];

  // If the inner message contains the additional data file pattern, extract the source ID
  if (innerMessage.includes("Additional data file for source")) {
    const innerMatch = ADDITIONAL_DATA_ERROR_REGEX.exec(innerMessage);
    if (innerMatch?.[1]) {
      const sourceId = innerMatch[1];
      return `Additional data file for source '${sourceId}' not found`;
    }
    // If we can't extract the source ID, at least return the inner message
    return innerMessage;
  }

  return innerMessage;
}

function getApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("additional-channels-api-key");
}

export function getStoredApiKey(): string | null {
  return getApiKey();
}

export function storeApiKey(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("additional-channels-api-key", key);
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
        detail: text || `HTTP error! status: ${response.status}`,
        status_code: response.status,
      };
    }

    // Extract error message, cleaning up double-wrapped messages
    const rawErrorMessage =
      errorData.detail ||
      errorData.error ||
      `HTTP error! status: ${response.status}`;

    const errorMessage = cleanErrorMessage(rawErrorMessage);

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

export async function getAllAdditionalDataFiles(): Promise<AdditionalDataListResponse> {
  const response = await fetch(API_BASE_URL, {
    headers: getHeaders(),
  });

  return handleResponse<AdditionalDataListResponse>(response);
}

export async function getAdditionalData(sourceId: string): Promise<{
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  channels: AdditionalDataChannel[];
  channel_count: number;
}> {
  // Trim whitespace and trailing underscores, then encode the source ID
  const trimmedSourceId = sourceId
    .trim()
    .replace(TRAILING_UNDERSCORES_REGEX, "");
  const encodedSourceId = encodeURIComponent(trimmedSourceId);
  const url = `${API_BASE_URL}/${encodedSourceId}`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  const data = await handleResponse<AdditionalDataResponse>(response);

  // Normalize the channels from API format to internal format
  return {
    ...data,
    channels: data.channels.map(normalizeAdditionalDataChannel),
  };
}

export async function createAdditionalData(
  sourceId: string,
  data: CreateAdditionalDataRequest,
  isXmlepg = false
): Promise<CreateAdditionalDataResponse> {
  // Trim whitespace and trailing underscores, then encode the source ID
  const trimmedSourceId = sourceId
    .trim()
    .replace(TRAILING_UNDERSCORES_REGEX, "");
  const encodedSourceId = encodeURIComponent(trimmedSourceId);

  // Convert channels from flat format to nested API format
  const apiChannels = data.channels.map(denormalizeAdditionalDataChannel);
  const apiData = { channels: apiChannels };

  const response = await fetch(
    `${API_BASE_URL}/${encodedSourceId}?is_xmlepg=${isXmlepg}`,
    {
      body: JSON.stringify(apiData),
      headers: getHeaders(),
      method: "POST",
    }
  );

  return handleResponse<CreateAdditionalDataResponse>(response);
}

export async function updateAdditionalData(
  sourceId: string,
  data: UpdateAdditionalDataRequest,
  isXmlepg?: boolean
): Promise<UpdateAdditionalDataResponse> {
  // Trim whitespace and trailing underscores, then encode the source ID
  const trimmedSourceId = sourceId
    .trim()
    .replace(TRAILING_UNDERSCORES_REGEX, "");
  const encodedSourceId = encodeURIComponent(trimmedSourceId);
  const queryParam = isXmlepg !== undefined ? `?is_xmlepg=${isXmlepg}` : "";

  // Convert channels from flat format to nested API format
  const apiChannels = data.channels.map(denormalizeAdditionalDataChannel);
  const apiData = { channels: apiChannels };

  const response = await fetch(
    `${API_BASE_URL}/${encodedSourceId}${queryParam}`,
    {
      body: JSON.stringify(apiData),
      headers: getHeaders(),
      method: "PUT",
    }
  );

  return handleResponse<UpdateAdditionalDataResponse>(response);
}

export async function deleteAdditionalData(
  sourceId: string
): Promise<DeleteAdditionalDataResponse> {
  // Trim whitespace and trailing underscores, then encode the source ID
  const trimmedSourceId = sourceId
    .trim()
    .replace(TRAILING_UNDERSCORES_REGEX, "");
  const encodedSourceId = encodeURIComponent(trimmedSourceId);
  const response = await fetch(`${API_BASE_URL}/${encodedSourceId}`, {
    headers: getHeaders(),
    method: "DELETE",
  });

  return handleResponse<DeleteAdditionalDataResponse>(response);
}
