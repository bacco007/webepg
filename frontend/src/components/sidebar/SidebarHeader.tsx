import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  SidebarHeader as SidebarHeaderPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { siteConfig } from '@/config/site';

export default async function SidebarHeader() {
  return (
    <SidebarHeaderPrimitive>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src="/favicon/apple-touch-icon.png" alt="webEPG" />
                <AvatarFallback className="rounded-lg">wE</AvatarFallback>
              </Avatar>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                <span className="font-bold sm:inline-block">
                  {siteConfig.name}
                </span>
                &nbsp;
                <Badge variant="secondary" className="sm:inline-flex">
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
