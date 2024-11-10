import { cookies } from 'next/headers';
import React from 'react';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Clock,
  CreditCard,
  Database,
  LogOut,
  Settings,
  Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarFooter as SidebarFooterPrimitive,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/placeholder.svg?height=32&width=32',
  },
};

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
                <div className="grid flex-1 text-left text-sm leading-tight">Settings</div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              {/* <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={data.user.avatar} alt={data.user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel> */}
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
              {/* <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut />
                Log out
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooterPrimitive>
  );
}
