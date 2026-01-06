"use client";
import {
  Menu,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Search,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  title: string;
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
  actions?: ReactNode;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
  };

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebarCollapsed",
      desktopSidebarCollapsed.toString()
    );
  }, [desktopSidebarCollapsed]);

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden bg-background",
        className
      )}
    >
      {/* Header bar with improved styling */}
      <div className="sticky top-0 z-50 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          {/* Mobile menu with improved trigger */}
          {sidebar && (
            <Sheet onOpenChange={setSidebarOpen} open={sidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  className="hover:bg-muted/50 lg:hidden"
                  size="icon"
                  variant="ghost"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                className="w-64 overflow-visible border-r bg-background/95 p-0 backdrop-blur supports-backdrop-filter:bg-background/60"
                side="left"
              >
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop sidebar toggle with tooltip */}
          {sidebar && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="hidden hover:bg-muted/50 lg:flex"
                    onClick={toggleSidebar}
                    size="icon"
                    variant="ghost"
                  >
                    {desktopSidebarCollapsed ? (
                      <PanelLeftOpenIcon className="h-5 w-5" />
                    ) : (
                      <PanelLeftCloseIcon className="h-5 w-5" />
                    )}
                    <span className="sr-only">
                      {desktopSidebarCollapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {desktopSidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <span className="font-medium text-lg">{title}</span>
        </div>

        {/* Action buttons with improved spacing */}
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {/* Main content area with improved transitions */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar with improved transitions */}
        {sidebar && (
          <div
            className={cn(
              "hidden w-64 shrink-0 overflow-visible border-r bg-card transition-all duration-300 ease-in-out lg:block",
              desktopSidebarCollapsed && "lg:w-0 lg:border-r-0 lg:opacity-0",
              sidebarClassName
            )}
          >
            {sidebar}
          </div>
        )}

        {/* Main content with improved scrolling */}
        <div className={cn("flex h-full flex-1 flex-col", contentClassName)}>
          <div className="h-full flex-1 overflow-auto scroll-smooth">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ScrollArea className={cn("min-h-0 flex-1", className)}>
      <div className="divide-y divide-border/40">{children}</div>
    </ScrollArea>
  );
}

export function SidebarFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <ScrollArea className="max-h-[50vh] min-h-0">
        <div className="p-3">{children}</div>
      </ScrollArea>
    </div>
  );
}

export function SidebarSearch({
  searchValue,
  onValueChange,
  placeholder = "Search...",
  className,
}: {
  searchValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative p-2", className)}>
      <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-9 bg-background/50 pl-9 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/30"
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        value={searchValue}
      />
      {searchValue && (
        <Button
          aria-label="Clear search"
          className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted/50"
          onClick={() => onValueChange("")}
          size="sm"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default SidebarLayout;
