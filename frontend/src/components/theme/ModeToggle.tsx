'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = (newTheme: React.SetStateAction<string>) => {
    setTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ghost">
          <Sun className="h-[1.1rem] w-[1.2rem] rotate-0 scale-100 text-white transition-all dark:-rotate-90 dark:scale-0 dark:text-white" />
          <Moon className="absolute h-[1.1rem] w-[1.2rem] rotate-90 scale-0 text-white transition-all dark:rotate-0 dark:scale-100 dark:text-white" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => toggleTheme('light')}
          >
            <Sun className="size-5" />
            <span className="pl-2">Light Mode</span>
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => toggleTheme('dark')}
          >
            <Moon className="size-5" />
            <span className="pl-2">Dark Mode</span>
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => toggleTheme('system')}
          >
            <Monitor className="size-5" />
            <span className="pl-2">Use System</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
