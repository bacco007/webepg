'use client';

import React from 'react';
import { Calendar, Clock, Home, Settings, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RouteProperties {
  href: string;
  label: string;
  icon: React.ElementType;
}

const routeList: RouteProperties[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/epg',
    label: 'Daily EPG (by Day)',
    icon: Tv,
  },
  {
    href: '/channel',
    label: 'Weekly EPG (by Channel)',
    icon: Calendar,
  },
  {
    href: '/nownext',
    label: 'Now and Next',
    icon: Clock,
  },
];

const settingsRoute: RouteProperties = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
};

export const Sidenav = () => {
  const pathname = usePathname();

  return (
    <aside className="bg-muted/40 flex h-screen flex-col justify-between border-r p-4">
      <nav className="flex flex-col gap-2">
        {routeList.map((route) => {
          const Icon = route.icon;

          return (
            <TooltipProvider key={route.href}>
              <Tooltip>
                <TooltipTrigger>
                  <Link
                    href={route.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                      pathname === route.href ? 'bg-muted text-primary' : 'text-muted-foreground'
                    )}
                    prefetch={false}
                  >
                    <Icon className="size-6" />
                    <span className="sr-only">{route.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={1}>
                  <p>{route.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Link
              href={settingsRoute.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                pathname === settingsRoute.href ? 'bg-muted text-primary' : 'text-muted-foreground'
              )}
              prefetch={false}
            >
              <settingsRoute.icon className="size-6" />
              <span className="sr-only">{settingsRoute.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={1}>
            <p>{settingsRoute.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
};

export default Sidenav;
