'use client';

import React, { useState } from 'react';
import { ChevronDown, Home, Menu, Settings } from 'lucide-react';
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
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const routeList = [
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

const epgSubMenu = [
  {
    href: '/epg/today',
    label: 'EPG Today',
  },
  {
    href: '/epg/tomorrow',
    label: 'EPG Tomorrow',
  },
];

const Header = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 lg:px-6">
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
                {route.href === '/epg' ? (
                  <>
                    <NavigationMenuTrigger
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'bg-transparent',
                        pathname.startsWith(route.href)
                          ? 'font-semibold text-white'
                          : 'text-gray-300 hover:text-white'
                      )}
                    >
                      {route.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[200px] gap-3 bg-gray-900 p-4 shadow-lg">
                        {epgSubMenu.map((subRoute) => (
                          <li key={subRoute.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subRoute.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none text-white no-underline outline-none transition-colors hover:bg-gray-800"
                              >
                                <div className="text-sm font-medium leading-none">
                                  {subRoute.label}
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link
                      href={route.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'bg-transparent',
                        pathname === route.href ? 'font-semibold text-white' : 'text-gray-300'
                      )}
                    >
                      {route.label}
                    </Link>
                  </NavigationMenuLink>
                )}
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
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white lg:hidden"
              onClick={() => setIsOpen(true)}
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
                <React.Fragment key={route.href}>
                  <Link
                    href={route.href}
                    className={cn(
                      'flex items-center text-sm font-medium transition-colors',
                      pathname === route.href
                        ? 'font-semibold text-white'
                        : 'text-gray-300 hover:text-white'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {route.icon}
                    {route.label}
                    {route.href === '/epg' && <ChevronDown className="ml-1 size-4" />}
                  </Link>
                  {route.href === '/epg' && (
                    <div className="ml-4 flex flex-col space-y-2">
                      {epgSubMenu.map((subRoute) => (
                        <Link
                          key={subRoute.href}
                          href={subRoute.href}
                          className={cn(
                            'text-sm font-medium transition-colors',
                            pathname === subRoute.href
                              ? 'font-semibold text-white'
                              : 'text-gray-300 hover:text-white'
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {subRoute.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              <Link
                href="/settings"
                className="text-sm font-medium text-gray-300 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="mr-2 inline-block size-4" />
                Settings
              </Link>
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gray-300 hover:text-white"
                onClick={() => setIsOpen(false)}
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

export default Header;
