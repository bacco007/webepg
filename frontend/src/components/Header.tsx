import React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  children?: React.ReactNode;
}
export default function Header({ children }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">
                <span className="font-bold sm:inline-block">webEPG</span>
                &nbsp;
                <Badge variant="secondary" className="sm:inline-flex">
                  Beta
                </Badge>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {/* <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem> */}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto mr-4">{children}</div>
    </header>
  );
}
