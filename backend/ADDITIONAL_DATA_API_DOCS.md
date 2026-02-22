# Additional Data API Documentation

This document describes the API endpoints for managing additional data files that allow overwriting channel data in `_channels.json` files.

## Overview

Additional data files contain channel information that can override or supplement the channels extracted from XMLTV sources. These files follow one of two naming patterns:
- **Regular sources**: `{source_id}_additionaldata.json`
- **XMLEPG sources**: `xmlepg_{source_id}_additionaldata.json`

All endpoints require API key authentication via the `X-API-Key` header.

## Base URL

All endpoints are prefixed with `/py/sources/additional-data`

## Authentication

All endpoints require the `X-API-Key` header:
```
X-API-Key: your-api-key-here
```

## Endpoints

### 1. List All Additional Data Files

**GET** `/py/sources/additional-data`

Retrieves metadata about all additional data files in the system.

**Headers:**
- `X-API-Key`: Your API key (required)

**Response:**
```json
{
  "count": 2,
  "files": [
    {
      "source_id": "FTACEN",
      "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
      "filename": "xmlepg_FTACEN_additionaldata.json",
      "is_xmlepg": true,
      "file_size": 12345,
      "last_modified": "2024-01-15T08:00:00.000000"
    },
    {
      "source_id": "freeviewuk",
      "file_path": "/path/to/xmltvdata/remote/freeviewuk_additionaldata.json",
      "filename": "freeviewuk_additionaldata.json",
      "is_xmlepg": false,
      "file_size": 67890,
      "last_modified": "2024-01-15T09:00:00.000000"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (invalid or missing API key)
- `500`: Server error

---

### 2. Get Additional Data for a Source

**GET** `/py/sources/additional-data/{source_id}`

Retrieves the channel data from an additional data file for a specific source. The system automatically checks both naming patterns.

**Headers:**
- `X-API-Key`: Your API key (required)

**Path Parameters:**
- `source_id` (string, required): The unique identifier of the source

**Response:**
```json
{
  "source_id": "FTACEN",
  "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
  "filename": "xmlepg_FTACEN_additionaldata.json",
  "is_xmlepg": true,
      "channels": [
        {
          "channel_id": "25",
          "channel_slug": "25",
          "channel_name": "Juice TV",
          "channel_names": {
            "clean": "Juice TV",
            "location": "Juice TV",
            "real": "Juice TV"
          },
          "channel_number": "25",
          "chlogo": "https://images.skyone.co.nz/contentful/dcojl03mw8gy/3QMBiRuZGW5roct4GxnqXL/5ae0b5c2610b943de1d2ccaf9f422c45/Juice_TV_Logo_Orange_1920x1080.png",
          "channel_group": "Unknown",
          "channel_url": "N/A",
          "channel_logo": {
            "light": "https://images.skyone.co.nz/contentful/dcojl03mw8gy/3QMBiRuZGW5roct4GxnqXL/5ae0b5c2610b943de1d2ccaf9f422c45/Juice_TV_Logo_Orange_1920x1080.png",
            "dark": "https://images.skyone.co.nz/contentful/dcojl03mw8gy/3QMBiRuZGW5roct4GxnqXL/5ae0b5c2610b943de1d2ccaf9f422c45/Juice_TV_Logo_Orange_1920x1080.png"
          },
          "other_data": {
            "channel_type": "N/A",
            "channel_specs": "N/A",
            "channel_availability": "N/A",
            "channel_packages": "N/A"
          },
          "program_count": 391
        }
      ],
  "channel_count": 1
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (invalid or missing API key)
- `404`: Additional data file not found
- `500`: Server error

---

### 3. Create Additional Data File

**POST** `/py/sources/additional-data/{source_id}?is_xmlepg=false`

Creates a new additional data file with the provided channel data.

**Headers:**
- `X-API-Key`: Your API key (required)
- `Content-Type`: `application/json`

**Path Parameters:**
- `source_id` (string, required): The unique identifier of the source

**Query Parameters:**
- `is_xmlepg` (boolean, optional, default: `false`): If `true`, uses `xmlepg_{source_id}_additionaldata.json` pattern. If `false`, uses `{source_id}_additionaldata.json` pattern.

**Request Body:**
```json
{
  "channels": [
    {
      "channel_id": "25",
      "channel_slug": "25",
      "channel_name": "Juice TV",
      "channel_names": {
        "clean": "Juice TV",
        "location": "Juice TV",
        "real": "Juice TV"
      },
      "channel_number": "25",
      "chlogo": "https://images.skyone.co.nz/contentful/dcojl03mw8gy/3QMBiRuZGW5roct4GxnqXL/5ae0b5c2610b943de1d2ccaf9f422c45/Juice_TV_Logo_Orange_1920x1080.png",
      "channel_group": "Unknown",
      "channel_url": "N/A",
      "channel_logo": {
        "light": "https://images.skyone.co.nz/contentful/dcojl03mw8gy/3QMBiRuZGW5roct4GxnqXL/5ae0b5c2610b943de1d2ccaf9f422c45/Juice_TV_Logo_Orange_1920x1080.png",
        "dark": "https://images.skyone.co.nz/contentful/dcojl03mw8gy/3QMBiRuZGW5roct4GxnqXL/5ae0b5c2610b943de1d2ccaf9f422c45/Juice_TV_Logo_Orange_1920x1080.png"
      },
      "other_data": {
        "channel_type": "N/A",
        "channel_specs": "N/A",
        "channel_availability": "N/A",
        "channel_packages": "N/A"
      }
    }
  ]
}
```

**Response:**
```json
{
  "message": "Additional data created successfully",
  "source_id": "nzxmltv_sky",
  "file_path": "/path/to/xmltvdata/remote/nzxmltv_sky_additionaldata.json",
  "filename": "nzxmltv_sky_additionaldata.json",
  "is_xmlepg": false,
  "channel_count": 1
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (invalid or missing API key)
- `409`: Conflict (file already exists)
- `500`: Server error

---

### 4. Update Additional Data File

**PUT** `/py/sources/additional-data/{source_id}`

Updates an existing additional data file. The system automatically detects which naming pattern is used by checking both patterns. **This endpoint only updates existing files - use POST to create new files.**

**Headers:**
- `X-API-Key`: Your API key (required)
- `Content-Type`: `application/json`

**Path Parameters:**
- `source_id` (string, required): The unique identifier of the source

**Request Body:**
Same as POST endpoint - `AdditionalDataEntry` with `channels` array.

**Response:**
```json
{
  "message": "Additional data updated successfully",
  "source_id": "FTACEN",
  "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json",
  "filename": "xmlepg_FTACEN_additionaldata.json",
  "is_xmlepg": true,
  "channel_count": 2
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (invalid or missing API key)
- `404`: Additional data file not found (use POST endpoint to create new files)
- `500`: Server error

---

### 5. Delete Additional Data File

**DELETE** `/py/sources/additional-data/{source_id}`

Deletes an additional data file. The system automatically checks both naming patterns.

**Headers:**
- `X-API-Key`: Your API key (required)

**Path Parameters:**
- `source_id` (string, required): The unique identifier of the source

**Response:**
```json
{
  "message": "Additional data file for source 'FTACEN' deleted successfully",
  "file_path": "/path/to/xmltvdata/remote/xmlepg_FTACEN_additionaldata.json"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (invalid or missing API key)
- `404`: Additional data file not found
- `500`: Server error

---

## Channel Object Schema

Each channel object in the `channels` array must follow this structure:

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channel_id` | string | Yes | Unique channel identifier |
| `channel_slug` | string | No | URL-friendly channel identifier |
| `channel_name` | string | No | Display name of the channel |
| `channel_names` | object | No | Nested object with name variations (see below) |
| `channel_number` | string | No | Channel number |
| `chlogo` | string | No | Default logo URL |
| `channel_group` | string | No | Channel group/network |
| `channel_url` | string | No | Channel website URL |
| `channel_logo` | object | No | Nested object with logo URLs (see below) |
| `other_data` | object | No | Nested object with additional metadata (see below) |
| `program_count` | string \| number | No | Number of programs (usually calculated, optional) |

### channel_names Object

| Field | Type | Description |
|-------|------|-------------|
| `clean` | string | Cleaned channel name |
| `location` | string | Location-specific channel name |
| `real` | string | Official/real channel name |

### channel_logo Object

| Field | Type | Description |
|-------|------|-------------|
| `light` | string | Logo URL for light theme |
| `dark` | string | Logo URL for dark theme |

### other_data Object

| Field | Type | Description |
|-------|------|-------------|
| `channel_type` | string | Type of channel (e.g., "Sky Starter", "Free to Air") |
| `channel_specs` | string | Channel specifications (e.g., "HD", "SD", "T: 1080i HD / S: 576i SD") |
| `channel_availability` | string | Availability description |
| `channel_packages` | string | Package/subscription information |

### Example Channel Object

```json
{
  "channel_id": "25",
  "channel_slug": "25",
  "channel_name": "Juice TV",
  "channel_names": {
    "clean": "Juice TV",
    "location": "Juice TV",
    "real": "Juice TV"
  },
  "channel_number": "25",
  "chlogo": "https://images.skyone.co.nz/.../Juice_TV_Logo_Orange_1920x1080.png",
  "channel_group": "Unknown",
  "channel_url": "N/A",
  "channel_logo": {
    "light": "https://images.skyone.co.nz/.../Juice_TV_Logo_Orange_1920x1080.png",
    "dark": "https://images.skyone.co.nz/.../Juice_TV_Logo_Orange_1920x1080.png"
  },
  "other_data": {
    "channel_type": "N/A",
    "channel_specs": "N/A",
    "channel_availability": "N/A",
    "channel_packages": "N/A"
  },
  "program_count": 391
}
```

## How Additional Data Works

1. **Update existing channels**: If a channel with the same `channel_id` exists in the processed channels, the additional data will replace the database values.

2. **Add new channels**: If a channel with a new `channel_id` is found in the additional data, it will be added to the channel list.

3. **Keep unchanged channels**: Channels that exist in the processed data but not in the additional data will remain unchanged.

## Example Usage

### JavaScript/TypeScript Example

```typescript
const API_KEY = 'your-api-key';
const BASE_URL = 'http://your-api-url/py/sources/additional-data';

// Get all additional data files
async function getAllAdditionalData() {
  const response = await fetch(`${BASE_URL}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  return await response.json();
}

// Get specific source's additional data
async function getAdditionalData(sourceId: string) {
  const response = await fetch(`${BASE_URL}/${sourceId}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  return await response.json();
}

// Create new additional data file
async function createAdditionalData(sourceId: string, channels: any[], isXmlepg: boolean = false) {
  const response = await fetch(`${BASE_URL}/${sourceId}?is_xmlepg=${isXmlepg}`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channels })
  });
  return await response.json();
}

// Update existing additional data file
async function updateAdditionalData(sourceId: string, channels: any[]) {
  const response = await fetch(`${BASE_URL}/${sourceId}`, {
    method: 'PUT',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ channels })
  });
  return await response.json();
}

// Delete additional data file
async function deleteAdditionalData(sourceId: string) {
  const response = await fetch(`${BASE_URL}/${sourceId}`, {
    method: 'DELETE',
    headers: {
      'X-API-Key': API_KEY
    }
  });
  return await response.json();
}
```

### Python Example

```python
import requests

API_KEY = 'your-api-key'
BASE_URL = 'http://your-api-url/py/sources/additional-data'

headers = {'X-API-Key': API_KEY}

# Get all additional data files
def get_all_additional_data():
    response = requests.get(f'{BASE_URL}', headers=headers)
    return response.json()

# Get specific source's additional data
def get_additional_data(source_id):
    response = requests.get(f'{BASE_URL}/{source_id}', headers=headers)
    return response.json()

# Create new additional data file
def create_additional_data(source_id, channels, is_xmlepg=False):
    params = {'is_xmlepg': is_xmlepg}
    data = {'channels': channels}
    response = requests.post(
        f'{BASE_URL}/{source_id}',
        headers=headers,
        params=params,
        json=data
    )
    return response.json()

# Update existing additional data file
def update_additional_data(source_id, channels):
    data = {'channels': channels}
    response = requests.put(
        f'{BASE_URL}/{source_id}',
        headers=headers,
        json=data
    )
    return response.json()

# Delete additional data file
def delete_additional_data(source_id):
    response = requests.delete(f'{BASE_URL}/{source_id}', headers=headers)
    return response.json()
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "detail": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "detail": "Additional data file for source 'source_id' not found"
}
```

### 409 Conflict (POST only)
```json
{
  "detail": "Additional data file for source 'source_id' already exists",
  "error_code": "ADDITIONAL_DATA_EXISTS",
  "error_type": "AdditionalDataExistsError"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message describing what went wrong"
}
```

