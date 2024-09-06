'use client';

import React from 'react';

import { SourceDropdown } from '@/components/snippets/SourceDropdown';
import { ModeToggle } from '@/components/theme/ModeToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn('sticky top-0 z-50 w-full border-b bg-gray-900 text-white', className)}>
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">webEPG</span>
        </div>
        <div className="flex items-center gap-4">
          <SourceDropdown />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
