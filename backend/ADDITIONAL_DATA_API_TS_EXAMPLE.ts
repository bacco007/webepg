/**
 * Additional Data API Client
 * 
 * This file should be placed in your frontend at: src/lib/additional-data-api.ts
 * 
 * Replace the corrupted content with this code.
 */

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChannelNames {
  clean?: string;
  location?: string;
  real?: string;
}

export interface ChannelLogo {
  light?: string;
  dark?: string;
}

export interface OtherData {
  channel_type?: string;
  channel_specs?: string;
  channel_availability?: string;
  channel_packages?: string;
}

export interface ChannelEntry {
  channel_id: string;
  channel_slug?: string;
  channel_name?: string;
  channel_names?: ChannelNames;
  channel_number?: string;
  chlogo?: string;
  channel_group?: string;
  channel_url?: string;
  channel_logo?: ChannelLogo;
  other_data?: OtherData;
  program_count?: string | number;
}

export interface AdditionalDataEntry {
  channels: ChannelEntry[];
}

export interface AdditionalDataFile {
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  file_size: number;
  last_modified: string;
}

export interface AdditionalDataResponse {
  source_id: string;
  file_path: string;
  filename: string;
  is_xmlepg: boolean;
  channels: ChannelEntry[];
  channel_count: number;
}

export interface AdditionalDataListResponse {
  count: number;
  files: AdditionalDataFile[];
}

/**
 * Get all additional data files
 */
export async function getAllAdditionalData(): Promise<AdditionalDataListResponse> {
  const response = await fetch(`${BASE_URL}/py/sources/additional-data`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch additional data files: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get additional data for a specific source
 */
export async function getAdditionalData(sourceId: string): Promise<AdditionalDataResponse> {
  // Remove trailing underscores if present
  const cleanSourceId = sourceId.trim().replace(/_+$/, '');
  
  const response = await fetch(`${BASE_URL}/py/sources/additional-data/${encodeURIComponent(cleanSourceId)}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Additional data file for source '${cleanSourceId}' not found`);
    }
    throw new Error(`Failed to fetch additional data: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new additional data file
 */
export async function createAdditionalData(
  sourceId: string,
  channels: ChannelEntry[],
  isXmlepg: boolean = false
): Promise<AdditionalDataResponse> {
  // Remove trailing underscores if present
  const cleanSourceId = sourceId.trim().replace(/_+$/, '');
  
  const response = await fetch(`${BASE_URL}/py/sources/additional-data/${encodeURIComponent(cleanSourceId)}?is_xmlepg=${isXmlepg}`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channels })
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(`Additional data file for source '${cleanSourceId}' already exists`);
    }
    throw new Error(`Failed to create additional data: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update an existing additional data file
 */
export async function updateAdditionalData(
  sourceId: string,
  channels: ChannelEntry[]
): Promise<AdditionalDataResponse> {
  // Remove trailing underscores if present
  const cleanSourceId = sourceId.trim().replace(/_+$/, '');
  
  const response = await fetch(`${BASE_URL}/py/sources/additional-data/${encodeURIComponent(cleanSourceId)}`, {
    method: 'PUT',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channels })
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Additional data file for source '${cleanSourceId}' not found. Use POST to create a new file.`);
    }
    throw new Error(`Failed to update additional data: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete an additional data file
 */
export async function deleteAdditionalData(sourceId: string): Promise<{ message: string; file_path: string }> {
  // Remove trailing underscores if present
  const cleanSourceId = sourceId.trim().replace(/_+$/, '');
  
  const response = await fetch(`${BASE_URL}/py/sources/additional-data/${encodeURIComponent(cleanSourceId)}`, {
    method: 'DELETE',
    headers: {
      'X-API-Key': API_KEY
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Additional data file for source '${cleanSourceId}' not found`);
    }
    throw new Error(`Failed to delete additional data: ${response.statusText}`);
  }

  return await response.json();
}

