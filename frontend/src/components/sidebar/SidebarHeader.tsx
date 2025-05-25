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

export default function SidebarHeader() {
  return (
    <SidebarHeaderPrimitive>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex justify-center items-center bg-sidebar-primary rounded-lg size-8 aspect-square text-sidebar-primary-foreground">
              <Avatar className="rounded-lg size-8">
                <AvatarImage src="/favicon/apple-touch-icon.png" alt="webEPG" />
                <AvatarFallback className="rounded-lg">wE</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 grid text-sm text-left leading-tight">
              <span className="font-semibold truncate">
                <span className="sm:inline-block font-bold">
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
