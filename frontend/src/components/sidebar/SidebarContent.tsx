'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import {
  Antenna,
  CableIcon,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Clock,
  Database,
  Home,
  LayoutGrid,
  List,
  Map,
  SatelliteDish,
  Smartphone,
  Trophy,
} from 'lucide-react';

// import CollapsibleSourceMenu from '@/components/CollapsibleSourceMenu';
// import CollapsibleTimezoneMenu from '@/components/CollapsibleTimezoneMenu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarContent as SidebarContentPrimitive,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const data = {
  projects: [
    {
      name: 'Home',
      url: '/',
      icon: Home,
    },
    {
      name: 'Guide Sources',
      url: '/sources',
      icon: Database,
    },
    {
      name: 'Daily EPG',
      url: '/epg',
      icon: Calendar,
    },
    {
      name: "Today's EPG",
      url: '/epg/today',
      icon: CalendarCheck,
    },
    {
      name: "Tomorrow's EPG",
      url: '/epg/tomorrow',
      icon: CalendarClock,
    },
    {
      name: 'Weekly EPG',
      url: '/channel',
      icon: CalendarDays,
    },
    {
      name: 'Now and Next',
      url: '/nownext',
      icon: Clock,
      items: [
        {
          title: 'Card View',
          url: '/nownext?view=card',
          icon: LayoutGrid,
        },
        {
          title: 'Table View',
          url: '/nownext?view=table',
          icon: List,
        },
        {
          title: 'Mobile View',
          url: '/nownext?view=mobile',
          icon: Smartphone,
        },
      ],
    },
    {
      name: 'Upcoming Sport EPG',
      url: '/sports',
      icon: Trophy,
    },
    {
      name: 'Upcoming Movies EPG',
      url: '/movies',
      icon: Clapperboard,
    },
    {
      name: 'Australia',
      url: '/',
      icon: Antenna,
      items: [
        {
          title: 'Channel List - Freeview',
          url: '/channellist/freeview-au',
          icon: Antenna,
        },
        {
          title: 'Channel List - Fetch',
          url: '/channellist/fetch',
          icon: CableIcon,
        },
        {
          title: 'Channel List - Foxtel',
          url: '/channellist/foxtel',
          icon: SatelliteDish,
        },
        {
          title: 'Channel List - Hubbl',
          url: '/channellist/hubbl',
          icon: CableIcon,
        },
        {
          title: 'DVB-T Transmitter Map',
          url: '/transmitters',
          icon: Map,
        },
      ],
    },
    {
      name: 'New Zealand',
      url: '/',
      icon: Antenna,
      items: [
        {
          title: 'Channel List - Freeview',
          url: '/channellist/freeview-nz',
          icon: Antenna,
        },
        {
          title: 'Channel List - Sky',
          url: '/channellist/skynz',
          icon: SatelliteDish,
        },
      ],
    },
  ],
};

export default function SidebarContent() {
  const pathname = usePathname();
  const isActive = (itemUrl: string) => {
    if (itemUrl === '/epg') {
      return (
        pathname.startsWith('/epg') &&
        pathname !== '/epg/today' &&
        pathname !== '/epg/tomorrow'
      );
    }
    return pathname === itemUrl || pathname.startsWith(itemUrl + '/');
  };

  return (
    <SidebarContentPrimitive>
      <SidebarGroup>
        <SidebarMenu>
          {data.projects.map(item => (
            <SidebarMenuItem key={item.name}>
              {item.items ? (
                <Collapsible asChild className="group/collapsible">
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton isActive={isActive(item.url)}>
                              <item.icon />
                              <span>{item.name}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map(subItem => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(subItem.url)}
                                  >
                                    <a href={subItem.url}>
                                      <subItem.icon />
                                      <span>{subItem.title}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={10}>
                                  {subItem.title}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      {/* <CollapsibleSourceMenu />
      <CollapsibleTimezoneMenu /> */}
    </SidebarContentPrimitive>
  );
}
