# Additional Channels API - Frontend Documentation

## Overview

This document describes the API endpoints for managing additional channels in the XMLEPG system. These endpoints allow CRUD (Create, Read, Update, Delete) operations on the `xmlepg_additional_channels.csv` file.

**Base URL**: `/api/py/xmlepg/additional-channels`

**Authentication**: All endpoints require API key authentication via the `X-API-Key` header.

---

## Authentication

All endpoints require an API key to be sent in the request headers:

```
X-API-Key: your-api-key-here
```

**Note**: The API key must be configured in the backend environment variable `ADMIN_API_KEY`.

**Error Response** (401 Unauthorized):
```json
{
  "error": "Invalid or missing API key",
  "error_type": "UnauthorizedError",
  "error_code": "UNAUTHORIZED",
  "status_code": 401
}
```

---

## Endpoints

### 1. List All Channels

**GET** `/api/py/xmlepg/additional-channels`

Retrieves all additional channels from the CSV file.

**Headers**:
```
X-API-Key: your-api-key-here
```

**Response** (200 OK):
```json
{
  "count": 45,
  "channels": [
    {
      "id": "1",
      "guidelink": "bbc-world-service",
      "channel_id": "bbc-world-service",
      "channel_slug": "bbc-world-service",
      "channel_name": "BBC World Service",
      "channel_name_location": "BBC World",
      "channel_name_real": "BBC World Service",
      "chantype": "Audio",
      "chancomp": "",
      "channel_url": "",
      "chanbouq": "2010",
      "chanlcnfta1": "0",
      "chanlcnfta2": "0",
      "chanlcnfta3": "0",
      "chanlcnfox": "858",
      "chanlcnfet": "0",
      "channel_number": "",
      "chlogo_light": "https://i.imgur.com/1JFeL39.png",
      "chlogo_dark": "https://i.imgur.com/1JFeL39.png",
      "channel_group": "British Broadcasting Corporation",
      "channel_type": "Radio",
      "channel_availability": "N/A",
      "channel_packages": "N/A"
    },
    // ... more channels
  ]
}
```

---

### 2. Get Single Channel

**GET** `/api/py/xmlepg/additional-channels/{id}`

Retrieves a specific channel by its unique id.

**Headers**:
```
X-API-Key: your-api-key-here
```

**Path Parameters**:
- `id` (string, required): The unique identifier for the channel (not guidelink)

**Response** (200 OK):
```json
{
  "id": "1",
  "guidelink": "bbc-world-service",
  "channel_id": "bbc-world-service",
  "channel_slug": "bbc-world-service",
  "channel_name": "BBC World Service",
  // ... all other channel fields
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Channel data for ID '999' not found",
  "error_type": "ChannelNotFoundError",
  "error_code": "CHANNEL_NOT_FOUND",
  "status_code": 404
}
```

---

### 3. Create New Channel

**POST** `/api/py/xmlepg/additional-channels`

Creates a new channel entry in the CSV file.

**Headers**:
```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body**:
```json
{
  "guidelink": "new-channel-id",
  "channel_id": "new-channel-id",
  "channel_slug": "new-channel-id",
  "channel_name": "New Channel Name",
  "channel_name_location": "New Channel Location",
  "channel_name_real": "New Channel Real Name",
  "chantype": "Audio",
  "chancomp": "",
  "channel_url": "",
  "chanbouq": "2010",
  "chanlcnfta1": "0",
  "chanlcnfta2": "0",
  "chanlcnfta3": "0",
  "chanlcnfox": "0",
  "chanlcnfet": "0",
  "channel_number": "",
  "chlogo_light": "",
  "chlogo_dark": "",
  "channel_group": "",
  "channel_type": "Radio",
  "channel_availability": "N/A",
  "channel_packages": "N/A"
}
```

**Required Fields**:
- `guidelink` (string)
- `channel_id` (string)
- `channel_slug` (string)
- `channel_name` (string)

**Optional Fields** (default to empty string if not provided):
- `id` (string): Auto-generated if not provided. If provided, must be unique.
- All other fields are optional

**Response** (200 OK):
```json
{
  "message": "Channel created successfully",
  "channel": {
    // ... the created channel object
  }
}
```

**Error Response** (409 Conflict):
```json
{
  "error": "Channel with id '5' already exists",
  "error_type": "ChannelExistsError",
  "error_code": "CHANNEL_EXISTS",
  "status_code": 409
}
```

**Note**: If you don't provide an `id` field, one will be automatically generated based on the highest existing ID + 1.

---

### 4. Update Channel

**PUT** `/api/py/xmlepg/additional-channels/{id}`

Updates an existing channel entry in the CSV file.

**Headers**:
```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Path Parameters**:
- `id` (string, required): The unique identifier for the channel to update (not guidelink)

**Request Body**: Same structure as POST (all fields optional except required ones). The `id` field in the body is ignored - the `id` from the path parameter is used.

**Response** (200 OK):
```json
{
  "message": "Channel updated successfully",
  "channel": {
    // ... the updated channel object
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Channel data for ID '999' not found",
  "error_type": "ChannelNotFoundError",
  "error_code": "CHANNEL_NOT_FOUND",
  "status_code": 404
}
```

---

### 5. Delete Channel

**DELETE** `/api/py/xmlepg/additional-channels/{id}`

Deletes a channel entry from the CSV file.

**Headers**:
```
X-API-Key: your-api-key-here
```

**Path Parameters**:
- `id` (string, required): The unique identifier for the channel to delete (not guidelink)

**Response** (200 OK):
```json
{
  "message": "Channel '1' deleted successfully"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Channel data for ID '999' not found",
  "error_type": "ChannelNotFoundError",
  "error_code": "CHANNEL_NOT_FOUND",
  "status_code": 404
}
```

---

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier for the row (primary key). Auto-generated if not provided. |
| `guidelink` | string | Yes | Channel guidelink identifier (may not be unique) |
| `channel_id` | string | Yes | Channel ID (typically same as guidelink) |
| `channel_slug` | string | Yes | URL-friendly slug for the channel |
| `channel_name` | string | Yes | Display name of the channel |
| `channel_name_location` | string | No | Channel name with location information |
| `channel_name_real` | string | No | Official/real name of the channel |
| `chantype` | string | No | Channel type (e.g., "Audio", "SD 576i", "Apps") |
| `chancomp` | string | No | Channel compression (e.g., "MPEG-1", "HE-AAC") |
| `channel_url` | string | No | URL to the channel's website |
| `chanbouq` | string | No | Provider bouquet numbers (comma-separated) |
| `chanlcnfta1` | string | No | Free-to-air logical channel number 1 |
| `chanlcnfta2` | string | No | Free-to-air logical channel number 2 |
| `chanlcnfta3` | string | No | Free-to-air logical channel number 3 |
| `chanlcnfox` | string | No | Foxtel logical channel number |
| `chanlcnfet` | string | No | Fetch logical channel number |
| `channel_number` | string | No | General channel number |
| `chlogo_light` | string | No | URL to light logo image |
| `chlogo_dark` | string | No | URL to dark logo image |
| `channel_group` | string | No | Channel group/network name |
| `channel_type` | string | No | Type category (e.g., "Radio", "Streaming", "Apps") |
| `channel_availability` | string | No | Availability information |
| `channel_packages` | string | No | Package availability information |

---

## Example Frontend Implementation

### JavaScript/TypeScript Example

```typescript
const API_BASE_URL = '/api/py/xmlepg/additional-channels';
const API_KEY = 'your-api-key-here'; // Should be stored securely

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

// Fetch all channels
async function getAllChannels() {
  const response = await fetch(API_BASE_URL, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Fetch single channel
async function getChannel(id: string) {
  const response = await fetch(`${API_BASE_URL}/${id}`, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Channel not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Create channel
async function createChannel(channelData: any) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(channelData),
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Channel already exists');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Update channel
async function updateChannel(id: string, channelData: any) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(channelData),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Channel not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Delete channel
async function deleteChannel(id: string) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Channel not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
```

### React Example Hook

```typescript
import { useState, useEffect } from 'react';

const API_KEY = 'your-api-key-here'; // Should be in env vars or config

export function useAdditionalChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  };

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/py/xmlepg/additional-channels', { headers });
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data.channels);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async (channelData) => {
    const response = await fetch('/api/py/xmlepg/additional-channels', {
      method: 'POST',
      headers,
      body: JSON.stringify(channelData),
    });
    if (!response.ok) throw new Error('Failed to create channel');
    await fetchChannels(); // Refresh list
  };

  const updateChannel = async (id, channelData) => {
    const response = await fetch(`/api/py/xmlepg/additional-channels/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(channelData),
    });
    if (!response.ok) throw new Error('Failed to update channel');
    await fetchChannels(); // Refresh list
  };

  const deleteChannel = async (id) => {
    const response = await fetch(`/api/py/xmlepg/additional-channels/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete channel');
    await fetchChannels(); // Refresh list
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return {
    channels,
    loading,
    error,
    refetch: fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
  };
}
```

---

## Error Handling

All endpoints return standard error responses with the following structure:

```json
{
  "error": "Error message description",
  "error_type": "ErrorTypeName",
  "error_code": "ERROR_CODE",
  "status_code": 400
}
```

**Common HTTP Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (POST only)
- `500 Internal Server Error`: Server error

---

## Notes for Frontend Developers

1. **API Key Security**: 
   - Never hardcode API keys in client-side code
   - Store API keys in environment variables or secure configuration
   - Consider using a proxy/backend-for-frontend pattern to hide the API key

2. **CSV File Format**:
   - The backend reads/writes a CSV file with Latin-1 encoding
   - Empty fields are represented as empty strings (`""`)
   - The file is automatically created if it doesn't exist
   - The CSV now includes an `id` field as the first column (primary key)
   - If existing CSV files don't have an `id` field, it will be auto-generated on read

3. **Data Validation**:
   - All fields should be sent as strings
   - Empty optional fields can be omitted or sent as empty strings
   - The `id` field is the primary key and must be unique
   - The `id` field is optional when creating - it will be auto-generated if not provided
   - **Important**: Use `id` (not `guidelink`) for GET, PUT, and DELETE operations

4. **Error Handling**:
   - Always check response status codes
   - Handle 401 errors (authentication failures) appropriately
   - Display user-friendly error messages from the `error` field

5. **Performance**:
   - Consider caching channel lists since they don't change frequently
   - Implement optimistic UI updates for better UX
   - Show loading states during API calls

---

## Testing

You can test the API endpoints using curl:

```bash
# List all channels
curl -X GET "http://localhost:8000/api/py/xmlepg/additional-channels" \
  -H "X-API-Key: your-api-key-here"

# Get single channel
curl -X GET "http://localhost:8000/api/py/xmlepg/additional-channels/1" \
  -H "X-API-Key: your-api-key-here"

# Create channel
curl -X POST "http://localhost:8000/api/py/xmlepg/additional-channels" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "guidelink": "test-channel",
    "channel_id": "test-channel",
    "channel_slug": "test-channel",
    "channel_name": "Test Channel"
  }'

# Update channel
curl -X PUT "http://localhost:8000/api/py/xmlepg/additional-channels/1" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "guidelink": "test-channel",
    "channel_id": "test-channel",
    "channel_slug": "test-channel",
    "channel_name": "Updated Test Channel"
  }'

# Delete channel
curl -X DELETE "http://localhost:8000/api/py/xmlepg/additional-channels/1" \
  -H "X-API-Key: your-api-key-here"
```

---

---

## XMLTV Sources Management API

The API also provides endpoints for managing XMLTV source configuration files (`xmltvsources.json` and `local.json`). These endpoints use the same authentication mechanism (API key via `X-API-Key` header).

**Base URLs**:
- Remote sources: `/api/py/sources/remote`
- Local sources: `/api/py/sources/local`

### Source Entry Structure

Each source entry has the following structure:

```json
{
  "id": "unique-source-id",
  "group": "Source Group",
  "subgroup": "Source Subgroup",
  "location": "Source Location",
  "url": "https://example.com/epg.xml or local",
  "logo": {
    "light": "path/to/light-logo.png",
    "dark": "path/to/dark-logo.png"
  }
}
```

**Field Descriptions**:
- `id` (string, required): Unique identifier for the source
- `group` (string, required): Category/group name (e.g., "Australia", "International")
- `subgroup` (string, required): Sub-category name (e.g., "FTA", "Subscription", "Streaming")
- `location` (string, required): Display location/name
- `url` (string, required): XMLTV file URL or "local" for local sources
- `logo` (object, optional): Logo object with `light` and `dark` image paths

### Remote Sources Endpoints

#### List All Remote Sources

**GET** `/api/py/sources/remote`

**Response** (200 OK):
```json
{
  "count": 45,
  "sources": [
    {
      "id": "nzxmltv_freeview",
      "group": "New Zealand",
      "subgroup": "FTA",
      "location": "Freeview",
      "url": "https://nzxmltv.github.io/xmltv/guide.xml",
      "logo": {
        "light": "logos/freeviewnz.png",
        "dark": "logos/freeviewnz.png"
      }
    }
  ]
}
```

#### Get Single Remote Source

**GET** `/api/py/sources/remote/{id}`

**Path Parameters**:
- `id` (string, required): The unique identifier of the source

#### Create Remote Source

**POST** `/api/py/sources/remote`

**Request Body**:
```json
{
  "id": "new-source-id",
  "group": "Australia",
  "subgroup": "FTA",
  "location": "Sydney",
  "url": "https://example.com/epg.xml",
  "logo": {
    "light": "logos/example.png",
    "dark": "logos/example-dark.png"
  }
}
```

#### Update Remote Source

**PUT** `/api/py/sources/remote/{id}`

**Path Parameters**:
- `id` (string, required): The unique identifier of the source to update

**Request Body**: Same structure as POST

#### Delete Remote Source

**DELETE** `/api/py/sources/remote/{id}`

**Path Parameters**:
- `id` (string, required): The unique identifier of the source to delete

### Local Sources Endpoints

The local sources endpoints have the same structure as remote sources, but use the `/api/py/sources/local` base path:

- **GET** `/api/py/sources/local` - List all local sources
- **GET** `/api/py/sources/local/{id}` - Get single local source
- **POST** `/api/py/sources/local` - Create local source
- **PUT** `/api/py/sources/local/{id}` - Update local source
- **DELETE** `/api/py/sources/local/{id}` - Delete local source

**Note**: Local sources typically have `"url": "local"` to indicate they are processed locally rather than downloaded from a remote URL.

### Example Frontend Implementation for Sources

```typescript
const API_BASE_URL = '/api/py/sources';
const API_KEY = 'your-api-key-here';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

// Fetch all remote sources
async function getRemoteSources() {
  const response = await fetch(`${API_BASE_URL}/remote`, { headers });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

// Create remote source
async function createRemoteSource(sourceData: any) {
  const response = await fetch(`${API_BASE_URL}/remote`, {
    method: 'POST',
    headers,
    body: JSON.stringify(sourceData),
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Source already exists');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Update remote source
async function updateRemoteSource(id: string, sourceData: any) {
  const response = await fetch(`${API_BASE_URL}/remote/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(sourceData),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Source not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Delete remote source
async function deleteRemoteSource(id: string) {
  const response = await fetch(`${API_BASE_URL}/remote/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Source not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Similar functions exist for local sources (use /local instead of /remote)
```

### Testing Source Endpoints with curl

```bash
# List all remote sources
curl -X GET "http://localhost:8000/api/py/sources/remote" \
  -H "X-API-Key: your-api-key-here"

# Get single remote source
curl -X GET "http://localhost:8000/api/py/sources/remote/nzxmltv_freeview" \
  -H "X-API-Key: your-api-key-here"

# Create remote source
curl -X POST "http://localhost:8000/api/py/sources/remote" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-source",
    "group": "Australia",
    "subgroup": "FTA",
    "location": "Test Location",
    "url": "https://example.com/epg.xml",
    "logo": {
      "light": "logos/test.png",
      "dark": "logos/test-dark.png"
    }
  }'

# Update remote source
curl -X PUT "http://localhost:8000/api/py/sources/remote/test-source" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-source",
    "group": "Australia",
    "subgroup": "FTA",
    "location": "Updated Location",
    "url": "https://example.com/epg.xml"
  }'

# Delete remote source
curl -X DELETE "http://localhost:8000/api/py/sources/remote/test-source" \
  -H "X-API-Key: your-api-key-here"

# Similar commands for local sources (use /local instead of /remote)
```

---

## Support

For questions or issues, please refer to the backend API documentation or contact the backend development team.

