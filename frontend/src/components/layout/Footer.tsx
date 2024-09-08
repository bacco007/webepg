'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Github } from 'lucide-react';
import Link from 'next/link';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

dayjs.extend(utc);
dayjs.extend(timezone);

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('unset');
  const [clientTimezone, setClientTimezone] = useState<string>('unset');

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'unset';
    setXmltvDataSource(storedDataSource);

    const timeZone = dayjs.tz.guess();
    setClientTimezone(timeZone);
  }, []);

  return (
    <footer className={`bg-background border-t ${className}`}>
      <div className="container mx-auto flex flex-col items-center justify-between space-y-4 p-4 sm:flex-row sm:space-y-0">
        <div className="flex flex-col items-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <p className="text-muted-foreground text-sm">
            Data Source: <span className="font-medium">{xmltvDataSource}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Timezone: <span className="font-medium">{clientTimezone}</span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="https://github.com/yourusername/yourrepository"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="size-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Star us on GitHub</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
