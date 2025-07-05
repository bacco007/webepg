"use client";

import {
  ChevronRight,
  Menu,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  X,
} from "lucide-react";
import { Fragment, useState } from "react";

import { FontSizeControl } from "@/components/font-size-control";
import { SourcesDropdown } from "@/components/sources-dropdown";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui-custom/sidebar-trigger";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export default function Header() {
  const items = useBreadcrumbs();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useSidebar(); // Get the sidebar state

  const isSidebarOpen = state === "expanded";

  if (items.length === 0) {
    return null;
  }

  return (
    <header className="flex items-center gap-2 border-b h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) transition-[width,height] ease-linear shrink-0">
      <div className="flex items-center gap-1 lg:gap-2 px-4 lg:px-6 w-full">
        <SidebarTrigger
          aria-controls="main-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="-ml-1"
          icon={
            isSidebarOpen ? (
              <PanelLeftCloseIcon aria-hidden="true" />
            ) : (
              <PanelLeftOpenIcon aria-hidden="true" />
            )
          }
        />
        <Separator
          className="mx-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="flex items-center" href="/">
                <span className="font-bold">webEPG</span>
                <Badge className="ml-2" variant="secondary">
                  Beta
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block">
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem className="hidden md:block">
              <SourcesDropdown />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block">
              <ChevronRight />
            </BreadcrumbSeparator>
            {items.map((item, index) => (
              <Fragment key={item.title}>
                {index !== items.length - 1 && (
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={item.link}>
                      {item.title}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}
                {index < items.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block">
                    <ChevronRight />
                  </BreadcrumbSeparator>
                )}
                {index === items.length - 1 && (
                  <BreadcrumbPage className="hidden md:block font-bold">
                    {item.title}
                  </BreadcrumbPage>
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        <div className="hidden md:flex items-center gap-2">
          <FontSizeControl />
          <ThemeSwitcher />
        </div>
        <Sheet onOpenChange={setIsMenuOpen} open={isMenuOpen}>
          <SheetTrigger asChild>
            <Button className="md:hidden" size="icon" variant="ghost">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px]" side="right">
            <nav className="flex flex-col gap-4">
              <Button
                className="top-4 right-4 absolute"
                onClick={() => setIsMenuOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="size-5" />
                <span className="sr-only">Close menu</span>
              </Button>
              <SourcesDropdown />
              {items.map((item, _index) => (
                <BreadcrumbLink
                  className="text-lg"
                  href={item.link}
                  key={item.title}
                >
                  {item.title}
                </BreadcrumbLink>
              ))}
              <div className="flex items-center gap-4 mt-4">
                <FontSizeControl />
                <ThemeSwitcher />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
