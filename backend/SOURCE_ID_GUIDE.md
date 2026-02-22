# Source ID Guide for Additional Data API

## What is `source_id`?

The `source_id` is the **unique identifier** (`id` field) from your source configuration files:
- `xmltvdata/settings/xmltvsources.json` (remote sources)
- `xmltvdata/settings/local.json` (local sources)

## How to Find the Correct `source_id`

### Method 1: Check the Source Configuration Files

Look in `xmltvdata/settings/xmltvsources.json` or `xmltvdata/settings/local.json`:

```json
{
  "id": "nzxmltv_sky",        ← This is your source_id
  "group": "New Zealand",
  "subgroup": "Subscription",
  "location": "Sky",
  "url": "https://..."
}
```

### Method 2: Use the API to List All Sources

```bash
GET /py/sources
```

This returns all sources with their `id` field, which is the `source_id` you need.

### Method 3: Check Existing Additional Data Files

Use the API to list all additional data files:

```bash
GET /py/sources/additional-data
```

This returns all existing additional data files with their `source_id` values.

## Examples

### Regular Sources (Non-XMLEPG)

**Source Config:**
```json
{
  "id": "nzxmltv_sky",
  "group": "New Zealand",
  ...
}
```

**Additional Data File:** `nzxmltv_sky_additionaldata.json`

**API Call:**
```bash
GET /py/sources/additional-data/nzxmltv_sky
```

**✅ Correct source_id:** `nzxmltv_sky`

---

### XMLEPG Sources

**Source Config:**
```json
{
  "id": "xmlepg_FTACEN",
  "group": "XMLEPG",
  ...
}
```

**Additional Data File:** `xmlepg_FTACEN_additionaldata.json`

**API Call:**
```bash
GET /py/sources/additional-data/xmlepg_FTACEN
```

**✅ Correct source_id:** `xmlepg_FTACEN`

**Note:** Even though the file starts with `xmlepg_`, you still use the full source_id including the prefix.

---

## Common Mistakes

### ❌ Wrong: Using filename without checking source config
```bash
# File exists: nzxmltv_sky_additionaldata.json
# But you use: nzxmltv_sky_  ← Trailing underscore!
GET /py/sources/additional-data/nzxmltv_sky_
```

### ✅ Correct: Use exact source_id from config
```bash
# Source config has: "id": "nzxmltv_sky"
GET /py/sources/additional-data/nzxmltv_sky
```

---

### ❌ Wrong: Removing xmlepg_ prefix
```bash
# Source config has: "id": "xmlepg_FTACEN"
# You incorrectly use: FTACEN
GET /py/sources/additional-data/FTACEN
```

### ✅ Correct: Use full source_id including prefix
```bash
# Source config has: "id": "xmlepg_FTACEN"
GET /py/sources/additional-data/xmlepg_FTACEN
```

---

## How the API Determines File Pattern

The API automatically detects which naming pattern to use:

1. **First**, it tries the regular pattern: `{source_id}_additionaldata.json`
   - Example: `nzxmltv_sky_additionaldata.json`

2. **If not found**, it tries the xmlepg pattern: `xmlepg_{source_id}_additionaldata.json`
   - Example: `xmlepg_FTACEN_additionaldata.json`

**Important:** For xmlepg sources, the `source_id` in your config file might be:
- `xmlepg_FTACEN` → File: `xmlepg_xmlepg_FTACEN_additionaldata.json` (if using xmlepg pattern)
- OR the source_id might just be `FTACEN` → File: `xmlepg_FTACEN_additionaldata.json`

**To be safe, always check what files actually exist or use the list endpoint first!**

---

## Step-by-Step: Finding the Right source_id

1. **List all additional data files:**
   ```bash
   GET /py/sources/additional-data
   ```
   
   Response shows:
   ```json
   {
     "files": [
       {
         "source_id": "nzxmltv_sky",     ← Use this!
         "filename": "nzxmltv_sky_additionaldata.json",
         "is_xmlepg": false
       },
       {
         "source_id": "FTACEN",          ← Use this!
         "filename": "xmlepg_FTACEN_additionaldata.json",
         "is_xmlepg": true
       }
     ]
   }
   ```

2. **Or list all sources:**
   ```bash
   GET /py/sources
   ```
   
   Response shows:
   ```json
   [
     {
       "id": "nzxmltv_sky",    ← This is your source_id
       "group": "New Zealand",
       ...
     }
   ]
   ```

3. **Use that exact `id` value as `source_id` in API calls**

---

## Troubleshooting 404 Errors

If you get a 404 error:

1. **Check for trailing underscores or spaces:**
   - ❌ `nzxmltv_sky_` (has trailing underscore)
   - ✅ `nzxmltv_sky` (correct)

2. **Verify the file exists:**
   ```bash
   GET /py/sources/additional-data
   ```
   Check if your source_id appears in the list.

3. **Check the source configuration:**
   - Look in `xmltvdata/settings/xmltvsources.json`
   - Look in `xmltvdata/settings/local.json`
   - Find the source with matching `id` field

4. **Verify file naming:**
   - Regular: `{source_id}_additionaldata.json`
   - XMLEPG: `xmlepg_{source_id}_additionaldata.json`
   - Make sure the file actually exists in `xmltvdata/remote/`

---

## Quick Reference

| Source Config ID | Additional Data File | API source_id |
|-----------------|---------------------|---------------|
| `nzxmltv_sky` | `nzxmltv_sky_additionaldata.json` | `nzxmltv_sky` |
| `freeviewuk` | `freeviewuk_additionaldata.json` | `freeviewuk` |
| `xmlepg_FTACEN` | `xmlepg_FTACEN_additionaldata.json` | `xmlepg_FTACEN` |
| `FTACEN` (if xmlepg) | `xmlepg_FTACEN_additionaldata.json` | `FTACEN` |

**Remember:** The `source_id` should match the `id` field from your source configuration, or match what's returned by the list endpoints.


