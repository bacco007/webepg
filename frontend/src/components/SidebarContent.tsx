'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import {
  BookOpen,
  Bot,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Clock,
  Database,
  Folder,
  Forward,
  Frame,
  Home,
  Map,
  MoreHorizontal,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Trash2,
  Trophy,
} from 'lucide-react';

import CollapsibleSourceMenu from '@/components/CollapsibleSourceMenu';
import CollapsibleTimezoneMenu from '@/components/CollapsibleTimezoneMenu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarContent as SidebarContentPrimitive,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
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
  ],
};

export default function SidebarContent() {
  const pathname = usePathname();
  const isActive = (itemUrl: string) => {
    if (itemUrl === '/epg') {
      return (
        pathname.startsWith('/epg') && pathname !== '/epg/today' && pathname !== '/epg/tomorrow'
      );
    }
    return pathname === itemUrl;
  };
  return (
    <SidebarContentPrimitive>
      {/* <SidebarGroup  className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {data.navMain.map((item) => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup> */}
      <SidebarGroup>
        {/* <SidebarGroupLabel>Projects</SidebarGroupLabel> */}
        <SidebarMenu>
          {data.projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side="bottom"
                  align="end">
                  <DropdownMenuItem>
                    <Folder className="text-muted-foreground" />
                    <span>View Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward className="text-muted-foreground" />
                    <span>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </SidebarMenuItem>
          ))}
          {/* <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal className="text-sidebar-foreground/70" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarGroup>
      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />
      <CollapsibleSourceMenu />
      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />
      <CollapsibleTimezoneMenu />
      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />
    </SidebarContentPrimitive>
  );
}
