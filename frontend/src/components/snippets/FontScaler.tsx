'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, Type, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const fontScaleOptions = [
  { value: '80', label: 'Small (80%)', icon: ZoomOut },
  { value: '100', label: 'Normal (100%)', icon: RotateCcw },
  { value: '120', label: 'Large (120%)', icon: ZoomIn },
];

export default function FontScaler() {
  const [fontScale, setFontScale] = useState('100');

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-scale',
      `${Number.parseInt(fontScale) / 100}`
    );
  }, [fontScale]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ghost">
          <Type className="size-[1.2rem] rotate-0 scale-100 transition-all text-white dark:text-white" />
          <span className="sr-only">Adjust font size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {fontScaleOptions.map((option) => (
          <DropdownMenuItem key={option.value}>
            <Button
              variant={fontScale === option.value ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setFontScale(option.value)}
            >
              <option.icon className="size-5" />
              <span className="pl-2">{option.label}</span>
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
