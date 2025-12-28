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
  type LucideIcon,
  Map as MapIcon,
  SatelliteDish,
  Smartphone,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

interface MenuItem {
  icon: LucideIcon;
  name: string;
  url: string;
  items?: SubMenuItem[];
}

interface SubMenuItem {
  icon: LucideIcon;
  title: string;
  url: string;
}

const data: { projects: MenuItem[] } = {
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

  const renderMenuItem = (item: MenuItem) => {
    if (!item.items) {
      if (isCollapsed) {
        return (
          <SidebarMenuButton
            isActive={isActive(item.url)}
            render={(props) => (
              <Link href={item.url} {...props}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            )}
            tooltip={item.name}
          />
        );
      }
      return (
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <Link href={item.url}>
            <item.icon />
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      );
    }

    return (
      <Collapsible
        asChild
        className="group/collapsible"
        defaultOpen={isActive(item.url)}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.name}>
              <item.icon />
              <span>{item.name}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
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
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <SidebarContentPrimitive>
      <SidebarGroup>
        <SidebarMenu>
          {data.projects.map((item) => {
            const menuItem = renderMenuItem(item);
            // If the item has subitems, Collapsible already wraps SidebarMenuItem
            // so we don't need to wrap it again
            if (item.items) {
              return <Fragment key={item.name}>{menuItem}</Fragment>;
            }
            // For items without subitems, wrap in SidebarMenuItem
            return (
              <SidebarMenuItem key={item.name}>{menuItem}</SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContentPrimitive>
  );
}
