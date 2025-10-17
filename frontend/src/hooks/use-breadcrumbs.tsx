"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Regex patterns defined at top level for performance
const EPG_ROUTE_REGEX = /^\/epg\/(.*)$/;
const CHANNEL_ROUTE_REGEX = /^\/channel(\/.*)?$/;

const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/channellist": [{ link: "/channellist", title: "Channels by Service" }],
  "/channellist/fetch": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/fetch", title: "Fetch TV" },
  ],
  "/channellist/foxtel": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/foxtel", title: "Foxtel" },
  ],
  "/channellist/freeview-au": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/freeview-au", title: "Freeview (AU)" },
  ],
  "/channellist/freeview-au/regionmap": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/freeview-au", title: "Freeview (AU)" },
    { link: "/channellist/freeview-au/regionmap", title: "Region Map" },
  ],
  "/channellist/freeview-nz": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/freeview-nz", title: "Freeview (NZ)" },
  ],
  "/channellist/hubbl": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/hubbl", title: "Hubbl" },
  ],
  "/channellist/skynz": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/skynz", title: "Sky (NZ)" },
  ],
  "/channellist/vast": [
    { link: "/channellist", title: "Channels by Service" },
    { link: "/channellist/vast", title: "VAST" },
  ],
  "/epg": [{ link: "/epg", title: "Daily EPG" }],
  "/movies": [{ link: "/movies", title: "Upcoming Movies" }],
  "/nownext": [{ link: "/nownext", title: "Now & Next" }],
  "/sources": [{ link: "/sources", title: "Data Sources" }],
  "/sports": [{ link: "/sports", title: "Upcoming Sports Programming" }],
  "/transmitters": [
    { link: "/transmitters", title: "Transmitter Site Locations" },
  ],
  "/transmitters/radio": [
    { link: "/transmitters", title: "Transmitter Site Locations" },
    { link: "/transmitters/radio", title: "Radio" },
  ],
  "/transmitters/tv": [
    { link: "/transmitters", title: "Transmitter Site Locations" },
    { link: "/transmitters/tv", title: "Television" },
  ],
};

const formatDate = (dateString: string): string => {
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  return `${day}/${month}/${year}`;
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check for EPG route with date
    const epgMatch = pathname.match(EPG_ROUTE_REGEX);
    if (epgMatch) {
      const date = epgMatch[1];
      return [
        { link: "/epg", title: "Daily EPG" },
        { link: pathname, title: formatDate(date) },
      ];
    }

    // Check for channel route with date
    const channelMatch = pathname.match(CHANNEL_ROUTE_REGEX);
    if (channelMatch) {
      return [{ link: "/channel", title: "Weekly EPG" }];
    }

    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        link: path,
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
