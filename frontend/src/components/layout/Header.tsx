'use client';

import React from 'react';
import { Menu, Package2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icons } from '@/components/snippets/icons';
import { SourceDropdown } from '@/components/snippets/SourceDropdown';
import { ModeToggle } from '@/components/theme/ModeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: '/epg',
    label: 'EPG By Day',
  },
  {
    href: '/epg/today',
    label: 'EPG Today',
  },
  {
    href: '/epg/tomorrow',
    label: 'EPG Tomorrow',
  },
  {
    href: '/channel',
    label: 'EPG By Week',
  },
  {
    href: '/nownext',
    label: 'Now and Next',
  },
];

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center space-x-6">
        <Link href="/" className="relative flex items-center space-x-2 lg:mr-6">
          <span className="hidden font-bold text-white md:inline-block">{siteConfig.name}</span>
          <Badge variant="secondary">Beta</Badge>
        </Link>
        <SourceDropdown />
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="space-x-6">
            {routeList.map((route) => (
              <NavigationMenuItem key={route.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={route.href}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      pathname === route.href
                        ? 'font-semibold text-white'
                        : 'text-gray-300 hover:text-white'
                    )}
                  >
                    {route.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="flex items-center space-x-4">
        <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
          <div className="w-9 px-0">
            <Icons.gitHub className="size-4" />
            <span className="sr-only">GitHub</span>
          </div>
        </Link>
        <ModeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white md:hidden"
            >
              <Menu className="size-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[240px] border-gray-800 bg-gray-900 text-gray-100"
          >
            <nav className="mt-4 flex flex-col space-y-4">
              {routeList.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    pathname === route.href
                      ? 'font-semibold text-white'
                      : 'text-gray-300 hover:text-white'
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';
