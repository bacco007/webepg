import React from 'react';

import SidebarContent from '@/components/SidebarContent';
import SidebarFooter from '@/components/SidebarFooter';
import SidebarHeader from '@/components/SidebarHeader';
import {
  Sidebar as SidebarPrimitive,
  SidebarRail,
} from '@/components/ui/sidebar';

export default function Sidebar() {
  return (
    <SidebarPrimitive className="border-r-0" collapsible="icon" variant="inset">
      <SidebarHeader />
      <SidebarContent />
      <SidebarFooter />
      <SidebarRail />
    </SidebarPrimitive>
  );
}
