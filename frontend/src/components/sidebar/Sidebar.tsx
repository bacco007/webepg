"use client";

import { memo } from "react";
import SidebarContent from "@/components/sidebar/sidebar-content";
import SidebarFooter from "@/components/sidebar/sidebar-footer";
import SidebarHeader from "@/components/sidebar/sidebar-header";
import {
  Sidebar as SidebarPrimitive,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/lib/error-handling";

const MemoizedSidebarHeader = memo(SidebarHeader);
const MemoizedSidebarContent = memo(SidebarContent);
const MemoizedSidebarFooter = memo(SidebarFooter);

export default function Sidebar() {
  return (
    <SidebarPrimitive
      aria-label="Main navigation sidebar"
      className="border-r-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      collapsible="icon"
      variant="inset"
    >
      <ErrorBoundary>
        <MemoizedSidebarHeader />
      </ErrorBoundary>
      <ErrorBoundary>
        <MemoizedSidebarContent />
      </ErrorBoundary>
      <ErrorBoundary>
        <MemoizedSidebarFooter />
      </ErrorBoundary>
      <SidebarRail />
    </SidebarPrimitive>
  );
}
