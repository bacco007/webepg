"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Regex patterns defined at top level for performance
const DATE_SEGMENT_REGEX = /^\d{8}$/;

/**
 * Segment-to-title mapping
 * Maps each URL segment to its display title
 * This allows automatic breadcrumb generation from any path
 */
const segmentTitles: Record<string, string> = {
  austar: "Austar",
  channel: "Weekly EPG",
  channellist: "Channels by Service",
  ectv: "East Coast Television (ECTV)",
  epg: "Daily EPG",
  fetch: "Fetch TV",
  fetchtv: "Fetch TV",
  foxtel: "Foxtel",
  foxtelanalogue: "Foxtel (Analogue)",
  foxteldigital: "Foxtel (Digital)",
  freeview_metro: "Freeview (Metro)",
  "freeview-au": "Freeview (AU)",
  "freeview-nz": "Freeview (NZ)",
  galaxy: "Galaxy",
  history: "Channel History",
  hubbl: "Hubbl",
  movies: "Upcoming Movies",
  ncable: "Neighbourhood Cables",
  nownext: "Now & Next",
  optus: "Optus (Tele)Vision",
  optusitv: "Optus ITV",
  radio: "Radio",
  regionmap: "Region Map",
  settings: "Settings",
  skynz: "Sky (NZ)",
  sources: "Data Sources",
  sports: "Upcoming Sports Programming",
  tarbs: "TARBS",
  transact: "TransACT TransTV",
  transmitters: "Transmitter Site Locations",
  tv: "Television",
  ubiworldtv: "Ubi World TV",
  vast: "VAST",

  // Dynamic segments (providers, dates, etc.) are handled separately
};

const formatDate = (dateString: string): string => {
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  return `${day}/${month}/${year}`;
};

/**
 * Get the title for a path segment
 * Handles special cases like dates (YYYYMMDD) and dynamic provider names
 */
const getSegmentTitle = (segment: string): string => {
  // Check if it's a date (8 digits)
  if (DATE_SEGMENT_REGEX.test(segment)) {
    return formatDate(segment);
  }

  // Check if we have a custom title for this segment
  if (segmentTitles[segment]) {
    return segmentTitles[segment];
  }

  // For dynamic segments (like provider IDs), capitalize first letter
  return (
    segment.charAt(0).toUpperCase() + segment.slice(1).replaceAll("-", " ")
  );
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Split path into segments
    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb trail by accumulating segments
    const trail: BreadcrumbItem[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      const path = `/${segments.slice(0, i + 1).join("/")}`;

      trail.push({
        link: path,
        title: getSegmentTitle(segment),
      });
    }

    return trail;
  }, [pathname]);

  return breadcrumbs;
}
