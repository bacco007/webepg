"use client"
import { type ReactNode, useState, useEffect } from "react"
import { Menu, PanelLeftCloseIcon, PanelLeftOpenIcon, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SidebarLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  title: string
  className?: string
  sidebarClassName?: string
  contentClassName?: string
  actions?: ReactNode // This allows passing any React elements as actions
}

export function SidebarLayout({
  children,
  sidebar,
  title,
  className,
  sidebarClassName,
  contentClassName,
  actions,
}: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)

  // Toggle sidebar function
  const toggleSidebar = () => {
    setDesktopSidebarCollapsed(!desktopSidebarCollapsed)
  }

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", desktopSidebarCollapsed.toString())
  }, [desktopSidebarCollapsed])

  return (
    <div className={cn("flex h-screen w-full flex-col overflow-hidden", className)}>
      {/* Simple header bar */}
      <div className="flex justify-between items-center bg-background px-4 border-b h-12">
        <div className="flex items-center gap-2">
          {/* Menu icon for mobile */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              {sidebar}
            </SheetContent>
          </Sheet>

          {/* App icon placeholder */}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex">
            {desktopSidebarCollapsed ? (
              <PanelLeftOpenIcon className="w-5 h-5" />
            ) : (
              <PanelLeftCloseIcon className="w-5 h-5" />
            )}
            <span className="sr-only">{desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </Button>

          <span className="font-medium">{title}</span>
        </div>

        {/* Action buttons - now using the actions prop */}
        {actions}
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar - hidden on small screens */}
        <div
          className={cn(
            "bg-card hidden w-64 shrink-0 border-r lg:block transition-all duration-300 ease-in-out",
            desktopSidebarCollapsed && "lg:w-0 lg:opacity-0",
            sidebarClassName,
          )}
        >
          {sidebar}
        </div>

        {/* Main content */}
        <div className={cn("flex h-full flex-1 flex-col", contentClassName)}>
          {/* Content area - ensure it takes full height and has proper overflow */}
          <div className="flex-1 h-full overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function SidebarContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-full flex-col", className)}>{children}</div>
}

export function SidebarHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-b p-3", className)}>{children}</div>
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="divide-y">{children}</div>
    </ScrollArea>
  )
}

export function SidebarFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t p-3", className)}>{children}</div>
}

export function SidebarSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="top-2.5 left-2 absolute w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 text-sm"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="top-1 right-1 absolute p-0 w-7 h-7"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export default SidebarLayout
