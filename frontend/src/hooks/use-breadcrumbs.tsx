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
  "/sources": [{ title: "Data Sources", link: "/sources" }],
  "/movies": [{ title: "Upcoming Movies", link: "/movies" }],
  "/sports": [{ title: "Upcoming Sports Programming", link: "/sports" }],
  "/epg": [{ title: "Daily EPG", link: "/epg" }],
  "/channellist": [{ title: "Channels by Service", link: "/channellist" }],
  "/channellist/fetch": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Fetch TV", link: "/channellist/fetch" },
  ],
  "/channellist/foxtel": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Foxtel", link: "/channellist/foxtel" },
  ],
  "/channellist/freeview-au": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Freeview (AU)", link: "/channellist/freeview-au" },
  ],
  "/channellist/freeview-au/regionmap": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Freeview (AU)", link: "/channellist/freeview-au" },
    { title: "Region Map", link: "/channellist/freeview-au/regionmap" },
  ],
  "/channellist/freeview-nz": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Freeview (NZ)", link: "/channellist/freeview-nz" },
  ],
  "/channellist/hubbl": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Hubbl", link: "/channellist/hubbl" },
  ],
  "/channellist/vast": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "VAST", link: "/channellist/vast" },
  ],
  "/channellist/skynz": [
    { title: "Channels by Service", link: "/channellist" },
    { title: "Sky (NZ)", link: "/channellist/skynz" },
  ],
  "/nownext": [{ title: "Now & Next", link: "/nownext" }],
  "/transmitters": [
    { title: "Transmitter Site Locations", link: "/transmitters" },
  ],
  "/transmitters/radio": [
    { title: "Transmitter Site Locations", link: "/transmitters" },
    { title: "Radio", link: "/transmitters/radio" },
  ],
  "/transmitters/tv": [
    { title: "Transmitter Site Locations", link: "/transmitters" },
    { title: "Television", link: "/transmitters/tv" },
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
        { title: "Daily EPG", link: "/epg" },
        { title: formatDate(date), link: pathname },
      ];
    }

    // Check for channel route with date
    const channelMatch = pathname.match(CHANNEL_ROUTE_REGEX);
    if (channelMatch) {
      return [{ title: "Weekly EPG", link: "/channel" }];
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
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path,
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
