# Timeline Provider Data

This file documents how to add new TV providers and their historical channel data to the Channel History Timeline.

## Overview

The Channel History Timeline uses URL-based routing to display different providers. Each provider is accessible at:
- `/channellist/history/foxtel` - Foxtel timeline
- `/channellist/history/skynz` - Sky NZ timeline
- `/channellist/history/freeviewau` - Freeview Australia timeline

When you add a new provider, it automatically becomes available at `/channellist/history/{provider-id}` and appears in the sidebar.

## Structure

Each provider is defined in the `timelineProviders` object in `timeline-data.ts` with the following structure:

```typescript
{
  id: "unique-provider-id",
  name: "Display Name",
  description: "Brief description of the provider",
  country: "Country name",
  category: "Pay TV" | "Free-to-Air" | "Satellite" | "Streaming",
  data: {
    title: "Timeline Title",
    description: "Timeline description",
    axis: {
      unit: "year",
      start: 1990,  // Start year
      end: 2024,    // End year
    },
    events: [
      // Standalone milestone events
      {
        when: 1990.5,  // Year with decimal (e.g., .5 for mid-year)
        type: "Launch" | "Change" | "News",
        label: "Short event name",
        note: "Optional detailed description"
      }
    ],
    channels: {
      "channel-number": [
        // Array of time spans for this channel
        {
          from: 1990.5,  // Start date
          to: 1995.0,    // End date (optional - omit for ongoing)
          channel_name: "Channel Name",
          channel_genre: "Genre",  // Optional
          channel_notes: "Notes"   // Optional
        }
      ]
    }
  }
}
```

## Adding a New Provider

1. **Add the provider definition** to the `timelineProviders` object in `timeline-data.ts`:

```typescript
export const timelineProviders: Record<string, TimelineProvider> = {
  // ... existing providers ...
  
  mynewprovider: {
    id: "mynewprovider",
    name: "My New Provider",
    description: "Description of this TV service",
    country: "Australia",
    category: "Streaming",
    data: {
      title: "My New Provider History (2015-2024)",
      description: "Timeline of channel changes",
      axis: {
        unit: "year",
        start: 2015,
        end: 2024,
      },
      events: [
        { 
          when: 2015.3, 
          type: "Launch", 
          label: "Service Launches",
          note: "Service officially launched in March 2015"
        },
      ],
      channels: {
        "1": [
          { 
            from: 2015.3, 
            to: 2020.6, 
            channel_name: "Channel One",
            channel_genre: "General"
          },
          { 
            from: 2020.6, 
            channel_name: "Channel One HD",
            channel_genre: "General"
          },
        ],
        "2": [
          { 
            from: 2015.3, 
            channel_name: "Channel Two",
            channel_genre: "Movies"
          },
        ],
      },
    },
  },
};
```

2. **That's it!** The new provider will automatically appear in the sidebar grouped by its category.

## Categories

Providers are automatically grouped in the sidebar by these categories:
- **Pay TV** - Subscription-based traditional TV services
- **Free-to-Air** - Free digital terrestrial television
- **Satellite** - Satellite-based services
- **Streaming** - Internet-based streaming services

## Tips

### Date Format
- Use decimal notation for dates within a year:
  - `2020` = Start of 2020
  - `2020.25` = End of Q1 (March)
  - `2020.5` = Mid-year (June)
  - `2020.75` = End of Q3 (September)
  - `2020.12` = December

### Channel Numbers
- Can be any string: `"1"`, `"100"`, `"HD1"`, etc.
- Displayed in the order they appear in the data

### Event Types
- `"Launch"` - New service/channel launches
- `"Change"` - Significant changes (mergers, rebrand, etc.)
- `"News"` - Industry news/announcements

### Optional Fields
- `to` in channel spans - Omit for ongoing channels
- `channel_genre` - Genre classification
- `channel_notes` - Additional context
- `note` in events - Detailed description

## Example: Complete Provider

```typescript
bbcone: {
  id: "bbcone",
  name: "BBC One",
  description: "British public service broadcaster",
  country: "United Kingdom",
  category: "Free-to-Air",
  data: {
    title: "BBC One History (1936-2024)",
    description: "Timeline of BBC One channel evolution",
    axis: { unit: "year", start: 1936, end: 2024 },
    events: [
      { 
        when: 1936.11, 
        type: "Launch", 
        label: "BBC Television Service Begins",
        note: "World's first regular high-definition television service"
      },
      { 
        when: 1964.4, 
        type: "Change", 
        label: "Renamed BBC1",
        note: "Renamed when BBC2 launched"
      },
      { 
        when: 1997.10, 
        type: "Change", 
        label: "Rebranded to BBC One"
      },
    ],
    channels: {
      "1": [
        { 
          from: 1936.11, 
          to: 1939.9, 
          channel_name: "BBC Television Service",
          channel_notes: "Service suspended during WWII"
        },
        { 
          from: 1946.6, 
          to: 1964.4, 
          channel_name: "BBC Television Service",
          channel_notes: "Service resumed after war"
        },
        { 
          from: 1964.4, 
          to: 1997.10, 
          channel_name: "BBC1"
        },
        { 
          from: 1997.10, 
          channel_name: "BBC One"
        },
      ],
    },
  },
},
```

## Data Sources

When adding providers, ensure you have reliable sources for:
- Launch dates
- Channel number changes
- Rebranding events
- Service milestones

Common sources include:
- Company press releases
- Industry archives
- Wikipedia (verify against primary sources)
- Historical EPG data

