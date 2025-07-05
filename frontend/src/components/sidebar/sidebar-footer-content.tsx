"use client";

import { ChevronsUpDown, Clock, Database, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter as SidebarFooterPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarFooterContentProps {
  timezone?: string;
  xmltvdatasource?: string;
}

export function SidebarFooterContent({
  timezone,
  xmltvdatasource,
}: SidebarFooterContentProps) {
  return (
    <SidebarFooterPrimitive>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Settings />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  Settings
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a className="flex items-center gap-2" href="/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem>
                      <Database />
                      <span>Data Source: {xmltvdatasource || "Not set"}</span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>Current EPG data source</TooltipContent>
                </Tooltip>
                <DropdownMenuItem>
                  <Clock />
                  <span>Timezone: {timezone || "Not set"}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooterPrimitive>
  );
}
