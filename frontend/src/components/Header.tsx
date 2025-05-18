'use client';

import React, { Fragment, useState } from 'react';
import {
  ChevronRight,
  Menu,
  X,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from 'lucide-react';

import { FontSizeControl } from '@/components/FontSizeControl';
import { SourcesDropdown } from '@/components/sidebar/SourcesDropdown';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui-custom/SidebarTrigger';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { useSidebar } from '@/components/ui/sidebar';

export default function Header() {
  const items = useBreadcrumbs();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useSidebar(); // Get the sidebar state

  const isSidebarOpen = state === 'expanded';

  if (items.length === 0) return null;

  return (
    <header className="flex items-center gap-2 border-b h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) transition-[width,height] ease-linear shrink-0">
      <div className="flex items-center gap-1 lg:gap-2 px-4 lg:px-6 w-full">
        <SidebarTrigger
          className="-ml-1"
          icon={
            isSidebarOpen ? (
              <PanelLeftCloseIcon aria-hidden="true" />
            ) : (
              <PanelLeftOpenIcon aria-hidden="true" />
            )
          }
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={isSidebarOpen}
          aria-controls="main-sidebar"
        />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center">
                <span className="font-bold">webEPG</span>
                <Badge variant="secondary" className="ml-2">
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
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="top-4 right-4 absolute"
              >
                <X className="size-5" />
                <span className="sr-only">Close menu</span>
              </Button>
              <SourcesDropdown />
              {items.map((item, index) => (
                <BreadcrumbLink
                  key={item.title}
                  href={item.link}
                  className="text-lg"
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
