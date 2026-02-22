"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
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
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
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
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.title}>
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-56 p-0"
                    side="right"
                    sideOffset={10}
                  >
                    <div className="py-2">
                      <div className="border-b px-3 py-2 font-medium text-sm">
                        {item.title}
                      </div>
                      <div className="mt-2">
                        {item.items.map((subItem) => (
                          <a
                            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                            href={subItem.url}
                            key={subItem.title}
                          >
                            {subItem.icon && (
                              <subItem.icon className="h-4 w-4" />
                            )}
                            <span>{subItem.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              asChild
              className="group/collapsible"
              defaultOpen={item.isActive}
              key={item.title}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
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
                            {subItem.icon && <subItem.icon />}
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
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
