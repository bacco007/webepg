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
  '/sports': [{ title: 'Upcoming Sports', link: '/sports' }],
  '/epg': [{ title: 'Daily EPG', link: '/epg' }],
  '/channellist': [{ title: 'Channels by Service', link: '/channellist' }],
  '/channellist/freeview-au': [
    { title: 'Channels by Service', link: '/channellist' },
    { title: 'Freeview (AU)', link: '/channellist/freeview-au' },
  ],
  '/nownext': [{ title: 'Now & Next', link: '/nownext' }],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' },
  ],
  // Add more custom mappings as needed
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
