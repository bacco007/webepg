"use client";

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
  HistoryIcon,
  Home,
  LayoutGrid,
  List,
  Map as MapIcon,
  SatelliteDish,
  Smartphone,
  Trophy,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const data = {
  projects: [
    {
      icon: Home,
      name: "Home",
      url: "/",
    },
    {
      icon: Database,
      name: "Guide Sources",
      url: "/sources",
    },
    {
      icon: Calendar,
      name: "Daily EPG",
      url: "/epg",
    },
    {
      icon: CalendarCheck,
      name: "Today's EPG",
      url: "/epg/today",
    },
    {
      icon: CalendarClock,
      name: "Tomorrow's EPG",
      url: "/epg/tomorrow",
    },
    {
      icon: CalendarDays,
      name: "Weekly EPG",
      url: "/channel",
    },
    {
      icon: Clock,
      items: [
        {
          icon: LayoutGrid,
          title: "Card View",
          url: "/nownext?view=card",
        },
        {
          icon: List,
          title: "Table View",
          url: "/nownext?view=table",
        },
        {
          icon: Smartphone,
          title: "Mobile View",
          url: "/nownext?view=mobile",
        },
      ],
      name: "Now and Next",
      url: "/nownext",
    },
    {
      icon: Trophy,
      name: "Upcoming Sport EPG",
      url: "/sports",
    },
    {
      icon: Clapperboard,
      name: "Upcoming Movies EPG",
      url: "/movies",
    },
    {
      icon: Antenna,
      items: [
        {
          icon: Antenna,
          title: "Channel List - Freeview",
          url: "/channellist/freeview-au",
        },
        {
          icon: Antenna,
          title: "Channel Map by Region - Freeview",
          url: "/channellist/freeview-au/regionmap",
        },
        {
          icon: CableIcon,
          title: "Channel List - Fetch",
          url: "/channellist/fetch",
        },
        {
          icon: SatelliteDish,
          title: "Channel List - Foxtel",
          url: "/channellist/foxtel",
        },
        {
          icon: CableIcon,
          title: "Channel List - Hubbl",
          url: "/channellist/hubbl",
        },
        {
          icon: SatelliteDish,
          title: "Channel List - VAST (By State)",
          url: "/channellist/vast",
        },
        {
          icon: MapIcon,
          title: "Transmitter Map (TV/Radio)",
          url: "/transmitters",
        },
      ],
      name: "Australia",
      url: "/australia",
    },
    {
      icon: Antenna,
      items: [
        {
          icon: Antenna,
          title: "Channel List - Freeview",
          url: "/channellist/freeview-nz",
        },
        {
          icon: SatelliteDish,
          title: "Channel List - Sky",
          url: "/channellist/skynz",
        },
      ],
      name: "New Zealand",
      url: "/nz",
    },
    {
      icon: HistoryIcon,
      name: "Channel Timeline History",
      url: "/channellist/history",
    },
  ],
};

export default function SidebarContent() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (itemUrl: string) => {
    if (itemUrl === "/epg") {
      return (
        pathname.startsWith("/epg") &&
        pathname !== "/epg/today" &&
        pathname !== "/epg/tomorrow"
      );
    }
    return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`);
  };

  return (
    <SidebarContentPrimitive>
      <SidebarGroup>
        <SidebarMenu>
          {data.projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              {item.items && isCollapsed && (
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
                    align="start"
                    className="data-[side=right]:slide-in-from-left-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 fade-in-0 zoom-in-95 w-56 animate-in p-0 data-[state=closed]:animate-out"
                    side="right"
                    sideOffset={10}
                  >
                    <div className="py-2">
                      <div className="border-b px-3 py-2 font-medium text-sm">
                        {item.name}
                      </div>
                      <div className="mt-2">
                        {item.items.map((subItem, index) => (
                          <a
                            className={cn(
                              "fade-in-0 slide-in-from-right-1 flex animate-in items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                              isActive(subItem.url)
                                ? "bg-muted font-medium"
                                : "",
                              // Stagger the animation for each item
                              `animation-delay-${Math.min(index * 50, 300)}`
                            )}
                            href={subItem.url}
                            key={subItem.title}
                            style={{
                              animationDelay: `${Math.min(index * 30, 300)}ms`,
                              animationFillMode: "both",
                            }}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {item.items && !isCollapsed && (
                // When sidebar is expanded, use Collapsible for submenu
                <Collapsible asChild className="group/collapsible">
                  <div>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isActive(item.url)}>
                        <item.icon />
                        <span>{item.name}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <SidebarMenuSub>
                        {item.items.map((subItem, index) => (
                          <SidebarMenuSubItem
                            className="slide-in-from-left-1 fade-in-0 animate-in"
                            key={subItem.title}
                            style={{
                              animationDelay: `${Math.min(index * 30, 300)}ms`,
                              animationFillMode: "both",
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
              )}
              {!item.items && (
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
