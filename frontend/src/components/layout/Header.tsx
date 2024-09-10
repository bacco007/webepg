'use client';

import React from 'react';
import { Home, Menu, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import FontScaler from '@/components/snippets/FontScaler';
import { Icons } from '@/components/snippets/icons';
import SourceDropdown from '@/components/snippets/SourceDropdown';
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
  icon?: React.ReactNode;
}

const routeList: RouteProps[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="mr-2 size-4" />,
  },
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
  {
    href: '/sports',
    label: 'Sports',
  },
];

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 lg:px-6',
        className
      )}
    >
      <div className="flex items-center space-x-4 lg:space-x-6">
        <Link href="/" className="relative flex items-center space-x-2">
          <span className="hidden font-bold text-white sm:inline-block">{siteConfig.name}</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Beta
          </Badge>
        </Link>
        <SourceDropdown />
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-2 lg:space-x-6">
            {routeList.slice(1).map((route) => (
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
      <div className="flex items-center space-x-2 lg:space-x-4">
        <Link href="/settings" className="hidden w-9 sm:block">
          <Settings className="size-4 text-white" />
          <span className="sr-only">Settings</span>
        </Link>
        <Link
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer"
          className="hidden w-9 sm:block"
        >
          <Icons.gitHub className="size-4 text-white" />
          <span className="sr-only">GitHub</span>
        </Link>
        <FontScaler />
        <ModeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white lg:hidden"
            >
              <Menu className="size-5" />
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
                    'flex items-center text-sm font-medium transition-colors',
                    pathname === route.href
                      ? 'font-semibold text-white'
                      : 'text-gray-300 hover:text-white'
                  )}
                >
                  {route.icon}
                  {route.label}
                </Link>
              ))}
              <Link href="/settings" className="text-sm font-medium text-gray-300 hover:text-white">
                <Settings className="mr-2 inline-block size-4" />
                Settings
              </Link>
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gray-300 hover:text-white"
              >
                <Icons.gitHub className="mr-2 inline-block size-4" />
                GitHub
              </Link>
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
