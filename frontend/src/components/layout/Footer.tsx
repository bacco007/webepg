'use client';

import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('unset');

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'unset';
    setXmltvDataSource(storedDataSource);
  }, []);

  return (
    <footer className={cn('mt-auto w-full px-4 py-6', className)}>
      <div className="container mx-auto flex flex-col items-center justify-between sm:flex-row">
        <p className="text-muted-foreground mb-4 text-center text-sm sm:mb-0">
          Data Source: <span className="font-medium">{xmltvDataSource}</span>
        </p>
        <div className="flex space-x-4">
          {/* Placeholder for future links */}
          {/* <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Service
          </a> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
