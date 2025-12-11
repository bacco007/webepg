"use client";

import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  SidebarHeader as SidebarHeaderPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export default function SidebarHeader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <SidebarHeaderPrimitive>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="transition-all duration-200 hover:scale-105 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            size="lg"
          >
            <div
              className={cn(
                "flex aspect-square size-8 items-center justify-center rounded-lg",
                isDark ? "bg-gray-800" : "bg-sidebar-primary"
              )}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage alt="webEPG" src="/favicon/apple-touch-icon.png" />
                <AvatarFallback className="rounded-lg">wE</AvatarFallback>
              </Avatar>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                <span className="font-bold sm:inline-block">
                  {siteConfig.name}
                </span>
                &nbsp;
                <Badge className="sm:inline-flex" variant="secondary">
                  Beta
                </Badge>
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeaderPrimitive>
  );
}
