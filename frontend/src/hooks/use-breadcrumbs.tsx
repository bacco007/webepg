'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/sources': [{ title: 'Data Sources', link: '/sources' }],
  '/movies': [{ title: 'Upcoming Movies', link: '/movies' }],
  '/sports': [{ title: 'Upcoming Sports Programming', link: '/sports' }],
  '/epg': [{ title: 'Daily EPG', link: '/epg' }],
  '/channellist': [{ title: 'Channels by Service', link: '/channellist' }],
  '/channellist/fetch': [
    { title: 'Channels by Service', link: '/channellist' },
    { title: 'Fetch TV', link: '/channellist/fetch' },
  ],
  '/channellist/foxtel': [
    { title: 'Channels by Service', link: '/channellist' },
    { title: 'Foxtel', link: '/channellist/foxtel' },
  ],
  '/channellist/freeview-au': [
    { title: 'Channels by Service', link: '/channellist' },
    { title: 'Freeview (AU)', link: '/channellist/freeview-au' },
  ],
  '/channellist/hubbl': [
    { title: 'Channels by Service', link: '/channellist' },
    { title: 'Hubbl', link: '/channellist/hubbl' },
  ],
  '/nownext': [{ title: 'Now & Next', link: '/nownext' }],
  '/transmitters': [
    { title: 'DVB-T Transmitter Sites', link: '/transmitters' },
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
    const epgMatch = pathname.match(/^\/epg\/(.*)$/);
    if (epgMatch) {
      const date = epgMatch[1];
      return [
        { title: 'Daily EPG', link: '/epg' },
        { title: formatDate(date), link: pathname },
      ];
    }

    // Check for channel route with date
    const channelMatch = pathname.match(/^\/channel(\/.*)?$/);
    if (channelMatch) {
      return [{ title: 'Weekly EPG', link: '/channel' }];
    }

    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path,
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
