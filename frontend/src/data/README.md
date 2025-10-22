# Vertical Timeline Events

This directory contains the event data for vertical timeline displays, separate from the horizontal timeline channel data.

## File Structure

- `vertical-timeline-events.ts` - Main event data file

## Adding New Events

Events are stored in collections. To add a new event:

```typescript
{
  id: "unique-event-id-2024",
  date: 2024.6, // June 2024 (use .1 for Jan, .2 for Feb, etc.)
  title: "Major Milestone Achieved",
  description: "Detailed description of the event...",
  providers: ["foxteldigital", "austar"], // Provider IDs
  type: "milestone", // See event types below
  tags: ["optional", "custom", "tags"] // Optional
}
```

## Event Types

Available event types:
- `launch` - Service or channel launches
- `closure` - Service or channel closures
- `merger` - Company mergers
- `acquisition` - Acquisitions
- `rebrand` - Rebranding events
- `expansion` - Service expansions
- `technology` - Technology changes (analog to digital, HD, etc.)
- `milestone` - Major milestones
- `partnership` - Partnerships
- `regulation` - Regulatory changes
- `other` - Other events

## Provider IDs

Current subscription TV providers:
- `austar` - Austar
- `foxtelanalogue` - Foxtel Analogue
- `foxteldigital` - Foxtel Digital
- `optus` - Optus Vision
- `optusitv` - Optus iTV
- `galaxy` - Galaxy
- `ectv` - ECTV
- `ncable` - Neighbourhood Cable
- `selectv` - SelecTV

## Date Format

Dates use a decimal format where:
- Integer part = year
- Decimal part = month (0.1 = Jan, 0.2 = Feb, ..., 0.12 = Dec)

Examples:
- `1995` - Year 1995 (no specific month)
- `1995.1` - January 1995
- `1995.6` - June 1995
- `2007.12` - December 2007

## Example: Adding Multiple Events at Once

```typescript
export const subscriptionTVEvents: VerticalTimelineEventCollection = {
  metadata: {
    title: "Australian Subscription TV History",
    description: "Major milestones and events in Australian subscription television history",
    lastUpdated: "2025-10-19",
  },
  events: [
    {
      id: "event-1",
      date: 2024.1,
      title: "Event Title",
      description: "Event description",
      providers: ["foxteldigital"],
      type: "launch",
    },
    {
      id: "event-2",
      date: 2024.3,
      title: "Another Event",
      description: "Another description",
      providers: ["foxteldigital", "optus"],
      type: "partnership",
    },
    // Add more events here
  ],
};
```

## Tips

1. **Unique IDs**: Use descriptive, unique IDs for each event (e.g., `foxtel-hd-launch-2008`)
2. **Multiple Providers**: Events can be tagged with multiple providers if they affect multiple services
3. **Descriptions**: Keep descriptions concise but informative
4. **Chronological Order**: While not required (events are sorted automatically), maintaining chronological order in the file helps with maintenance
5. **Update Metadata**: Remember to update the `lastUpdated` field when adding new events

