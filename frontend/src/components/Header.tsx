'use client';

import React, { Fragment, useState } from 'react';
import { ChevronRight, Menu, X } from 'lucide-react';

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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';

export default function Header() {
  const items = useBreadcrumbs();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
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
                  <BreadcrumbPage className="hidden font-bold md:block">
                    {item.title}
                  </BreadcrumbPage>
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        <div className="hidden items-center gap-2 md:flex">
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
                className="absolute top-4 right-4"
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
              <div className="mt-4 flex items-center gap-4">
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
