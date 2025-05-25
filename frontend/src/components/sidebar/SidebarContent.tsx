'use client';

import { usePathname } from 'next/navigation';
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

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  SidebarContent as SidebarContentPrimitive,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
      url: '/australia',
      icon: Antenna,
      items: [
        {
          title: 'Channel List - Freeview',
          url: '/channellist/freeview-au',
          icon: Antenna,
        },
        {
          title: 'Channel Map by Region - Freeview',
          url: '/channellist/freeview-au/regionmap',
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
          title: 'Channel List - VAST (By State)',
          url: '/channellist/vast',
          icon: SatelliteDish,
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
      url: '/nz',
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
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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
                isCollapsed ? (
                  // When sidebar is collapsed, use Popover for submenu
                  <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <SidebarMenuButton isActive={isActive(item.url)}>
                              <item.icon />
                              <span>{item.name}</span>
                            </SidebarMenuButton>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="data-[side=right]:slide-in-from-left-2 p-0 w-56 animate-in data-[state=closed]:animate-out fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                      sideOffset={10}
                    >
                      <div className="py-2">
                        <div className="px-3 py-2 border-b font-medium text-sm">
                          {item.name}
                        </div>
                        <div className="mt-2">
                          {item.items.map((subItem, index) => (
                            <a
                              key={subItem.title}
                              href={subItem.url}
                              className={cn(
                                'hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                                isActive(subItem.url)
                                  ? 'bg-muted font-medium'
                                  : '',
                                'animate-in fade-in-0 slide-in-from-right-1',
                                // Stagger the animation for each item
                                `animation-delay-${Math.min(index * 50, 300)}`,
                              )}
                              style={{
                                animationDelay: `${Math.min(index * 30, 300)}ms`,
                                animationFillMode: 'both',
                              }}
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span>{subItem.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  // When sidebar is expanded, use Collapsible for submenu
                  <Collapsible asChild className="group/collapsible">
                    <div>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={isActive(item.url)}>
                          <item.icon />
                          <span>{item.name}</span>
                          <ChevronRight className="ml-auto group-data-[state=open]/collapsible:rotate-90 transition-transform duration-200" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                        <SidebarMenuSub>
                          {item.items.map((subItem, index) => (
                            <SidebarMenuSubItem
                              key={subItem.title}
                              className="slide-in-from-left-1 animate-in fade-in-0"
                              style={{
                                animationDelay: `${Math.min(index * 30, 300)}ms`,
                                animationFillMode: 'both',
                              }}
                            >
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.url)}
                              >
                                <a href={subItem.url}>
                                  <subItem.icon />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
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
    </SidebarContentPrimitive>
  );
}
