"use client";

import { PanelLeft } from "lucide-react";
import { forwardRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  icon?: React.ReactNode;
  openIcon?: React.ReactNode;
  closedIcon?: React.ReactNode;
}

const SidebarTrigger = forwardRef<
  React.ComponentRef<typeof Button>,
  SidebarTriggerProps
>(({ className, onClick, icon, openIcon, closedIcon, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === "expanded";

  // Determine which icon to show
  const displayIcon = useMemo(() => {
    if (icon) {
      return icon;
    }
    if (isOpen && openIcon) {
      return openIcon;
    }
    if (!isOpen && closedIcon) {
      return closedIcon;
    }
    return <PanelLeft />;
  }, [icon, openIcon, closedIcon, isOpen]);

  return (
    <Button
      className={cn("h-7 w-7", className)}
      data-sidebar="trigger"
      data-state={state}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      ref={ref}
      size="icon"
      variant="ghost"
      {...props}
    >
      {displayIcon}
      <span className="sr-only">
        {isOpen ? "Close sidebar" : "Open sidebar"}
      </span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export { SidebarTrigger };
