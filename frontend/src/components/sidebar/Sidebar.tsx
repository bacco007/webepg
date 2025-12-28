// "use client";

// import SidebarContent from "@/components/sidebar/sidebar-content";
// import SidebarFooter from "@/components/sidebar/sidebar-footer";
// import SidebarHeader from "@/components/sidebar/sidebar-header";
// import {
//   Sidebar as SidebarPrimitive,
//   SidebarRail,
// } from "@/components/ui/sidebar";

// export default function Sidebar() {
//   return (
//     <SidebarPrimitive
//       aria-label="Main navigation sidebar"
//       collapsible="icon"
//       variant="inset"
//     >
//       <SidebarHeader />
//       <SidebarContent />
//       <SidebarFooter />
//       <SidebarRail />
//     </SidebarPrimitive>
//   );
// }

"use client";
import {
  Antenna,
  CableIcon,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
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
import type * as React from "react";
import { NavMain } from "@/components/sidebar/nav-main";
import AppSidebarHeader from "@/components/sidebar/sidebar-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { getCookie } from "@/lib/cookies";
import { SidebarFooterContent } from "./sidebar-footer-content";

const timezone = getCookie("timezone");
const xmltvdatasource = getCookie("xmltvdatasource");

const data = {
  navMain: [
    {
      icon: Home,
      title: "Home",
      url: "/",
    },
    {
      icon: Database,
      title: "Guide Sources",
      url: "/sources",
    },
    {
      icon: Calendar,
      title: "Daily EPG",
      url: "/epg",
    },
    {
      icon: CalendarCheck,
      title: "Today's EPG",
      url: "/epg/today",
    },
    {
      icon: CalendarClock,
      title: "Tomorrow's EPG",
      url: "/epg/tomorrow",
    },
    {
      icon: CalendarDays,
      title: "Weekly EPG",
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
      title: "Now and Next",
      url: "/nownext",
    },
    {
      icon: Trophy,
      title: "Upcoming Sport EPG",
      url: "/sports",
    },
    {
      icon: Clapperboard,
      title: "Upcoming Movies EPG",
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
      title: "Australia",
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
      title: "New Zealand",
      url: "/nz",
    },
    {
      icon: HistoryIcon,
      title: "Channel Timeline History",
      url: "/channellist/history",
    },
  ],
};
export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent
          timezone={timezone}
          xmltvdatasource={xmltvdatasource}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
