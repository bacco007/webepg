import { cookies } from 'next/headers';
import React from 'react';
import { ChevronsUpDown, Clock, Database, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarFooter as SidebarFooterPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export default async function SidebarFooter() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get('timezone')?.value;
  const xmltvdatasource = cookieStore.get('xmltvdatasource')?.value;
  return (
    <SidebarFooterPrimitive>
      <SidebarMenu>
        {/* <SidebarMenuItem>
          <CollapsibleSourceMenu />
        </SidebarMenuItem> */}
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
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a href="/settings" className="flex items-center gap-2">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Database />
                  <span>Data Source: {xmltvdatasource || 'Not set'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock />
                  <span>Timezone: {timezone || 'Not set'}</span>
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
