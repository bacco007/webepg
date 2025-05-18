"use client"

import * as React from "react"
import { PanelLeft } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

interface SidebarTriggerProps extends React.ComponentPropsWithoutRef<typeof Button> {
  icon?: React.ReactNode
  openIcon?: React.ReactNode
  closedIcon?: React.ReactNode
}

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  SidebarTriggerProps
>(({ className, onClick, icon, openIcon, closedIcon, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar()
  const isOpen = state === "expanded"

  // Determine which icon to show
  const displayIcon = React.useMemo(() => {
    if (icon) return icon
    if (isOpen && openIcon) return openIcon
    if (!isOpen && closedIcon) return closedIcon
    return <PanelLeft />
  }, [icon, openIcon, closedIcon, isOpen])

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      data-state={state}
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {displayIcon}
      <span className="sr-only">
        {isOpen ? "Close sidebar" : "Open sidebar"}
      </span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export { SidebarTrigger }
