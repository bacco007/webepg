'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus, Text } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setCookie } from '@/lib/cookies';

export function FontSizeControl() {
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      setFontSize(Number.parseInt(savedFontSize));
      document.documentElement.style.fontSize = `${savedFontSize}%`;
    }
  }, []);

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(60, Math.min(140, fontSize + delta));
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    localStorage.setItem('fontSize', newSize.toString());
    setCookie('fontSize', newSize.toString(), {
      path: '/',
      maxAge: 31_536_000,
    }); // 1 year
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Text className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <span className="sr-only">Change Font Size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeFontSize(-10)}
            >
              <Minus className="size-4" />
            </Button>
            <span className="text-sm font-medium">{fontSize}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeFontSize(10)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
