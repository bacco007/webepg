# Additional Channels System

This system allows you to add or modify channels for specific data sources using JSON files, similar to the system used in `xml_processing.py`.

## How it works

Each data source can have its own additional channels file with the naming convention:
- `xmlepg_{source_id}_additionaldata.json`

For example:
- `xmlepg_xmlepg_additionaldata.json` - for the main XMLEPG system
- `xmlepg_FTAALL_additionaldata.json` - for the FTA SQL provider
- `xmlepg_FOXHD_additionaldata.json` - for the Foxtel HD provider

The system also creates a datacheck file for each source:
- `xmlepg_{source_id}_datacheck.json` - contains unchanged channels

## File Format

The additional channels file should contain a JSON array of channel objects. Each channel object should have the following structure:

```json
{
  "channel_id": "ABC.ABC1",
  "channel_slug": "ABC-ABC1", 
  "channel_name": "ABC TV",
  "channel_name_location": "ABC TV Sydney",
  "channel_name_real": "ABC TV",
  "chantype": "Free to Air",
  "chancomp": "Australian Broadcasting Corporation",
  "channel_url": "https://www.abc.net.au",
  "chanbouq": "1,2,3",
  "chanlcnfta1": "2",
  "chanlcnfta2": null,
  "chanlcnfta3": null,
  "chanlcnfox": null,
  "chanlcnfet": null,
  "channel_number": "2",
  "chlogo_light": "/logos/abc-tv-light.png",
  "chlogo_dark": "/logos/abc-tv-dark.png",
  "channel_group": "Australian Broadcasting Corporation",
  "channel_type": "Free to Air",
  "chlogo": "/logos/abc-tv-light.png",
  "channel_availability": "Free to Air",
  "channel_packages": "FTA Basic"
}
```

## Behavior

1. **Update existing channels**: If a channel with the same `channel_id` exists in the database, the additional data will replace the database values.

2. **Add new channels**: If a channel with a new `channel_id` is found in the additional data, it will be added to the channel list.

3. **Keep unchanged channels**: Channels that exist in the database but not in the additional data will remain unchanged.

## Channel Fields

The additional data supports all standard channel fields plus two additional fields:

- **`channel_availability`**: Describes how the channel is available (e.g., "Free to Air", "Streaming Only", "Pay TV", "Satellite")
- **`channel_packages`**: Lists the packages or subscriptions that include this channel (e.g., "FTA Basic", "Premium Streaming", "Sports Package")

These fields help provide more detailed information about channel availability and subscription requirements.

## Usage

1. Create a JSON file with the naming convention `xmlepg_{source_id}_additionaldata.json`
2. Place it in the `xmltvdata/remote/` directory
3. Run the EPG processing for that source
4. The system will automatically merge the additional data with the database channels
5. A datacheck file `xmlepg_{source_id}_datacheck.json` will be created containing unchanged channels

## Example

For the main XMLEPG system:
- File: `xmltvdata/remote/xmlepg_xmlepg_additionaldata.json`
- Contains: Array of channel objects to add/modify for the main EPG processing
- Datacheck: `xmltvdata/remote/xmlepg_xmlepg_datacheck.json`

For a specific provider (e.g., Foxtel HD):
- File: `xmltvdata/remote/xmlepg_FOXHD_additionaldata.json`
- Contains: Array of channel objects specific to the FOXHD provider
- Datacheck: `xmltvdata/remote/xmlepg_FOXHD_datacheck.json`

## Migration from CSV

The old CSV system has been replaced with this JSON system. The new system provides:
- Better structure and validation
- Source-specific additional data
- Easier to maintain and extend
- Consistent with the `xml_processing.py` system 