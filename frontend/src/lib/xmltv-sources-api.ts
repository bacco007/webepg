import type {
  ApiErrorResponse,
  CreateSourceRequest,
  CreateSourceResponse,
  DeleteSourceResponse,
  SourcesResponse,
  SourceType,
  UpdateSourceRequest,
  UpdateSourceResponse,
  XmltvSource,
} from "@/types/xmltv-sources";

function getApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("additional-channels-api-key");
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

function getBaseUrl(sourceType: SourceType): string {
  return `/api/py/sources/${sourceType}`;
}

export async function getAllSources(
  sourceType: SourceType
): Promise<SourcesResponse> {
  const response = await fetch(getBaseUrl(sourceType), {
    headers: getHeaders(),
  });

  return handleResponse<SourcesResponse>(response);
}

export async function getSource(
  sourceType: SourceType,
  id: string
): Promise<XmltvSource> {
  const response = await fetch(`${getBaseUrl(sourceType)}/${id}`, {
    headers: getHeaders(),
  });

  return handleResponse<XmltvSource>(response);
}

export async function createSource(
  sourceType: SourceType,
  sourceData: CreateSourceRequest
): Promise<CreateSourceResponse> {
  const response = await fetch(getBaseUrl(sourceType), {
    body: JSON.stringify(sourceData),
    headers: getHeaders(),
    method: "POST",
  });

  return handleResponse<CreateSourceResponse>(response);
}

export async function updateSource(
  sourceType: SourceType,
  id: string,
  sourceData: UpdateSourceRequest
): Promise<UpdateSourceResponse> {
  // Ensure all required fields are present
  const updateData: CreateSourceRequest = {
    group: sourceData.group || "",
    id: sourceData.id || id,
    location: sourceData.location || "",
    logo: sourceData.logo,
    subgroup: sourceData.subgroup || "",
    url: sourceData.url || "",
  };

  const response = await fetch(`${getBaseUrl(sourceType)}/${id}`, {
    body: JSON.stringify(updateData),
    headers: getHeaders(),
    method: "PUT",
  });

  return handleResponse<UpdateSourceResponse>(response);
}

export async function deleteSource(
  sourceType: SourceType,
  id: string
): Promise<DeleteSourceResponse> {
  const response = await fetch(`${getBaseUrl(sourceType)}/${id}`, {
    headers: getHeaders(),
    method: "DELETE",
  });

  return handleResponse<DeleteSourceResponse>(response);
}
