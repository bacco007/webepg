'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

interface FooterProperties {
  className?: string;
}

export const Footer: React.FC<FooterProperties> = ({ className }) => {
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
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-center sm:flex-row sm:space-x-4 sm:space-y-0">
          <p className="text-muted-foreground text-sm">
            Data Source: <span className="font-medium">{xmltvDataSource}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Timezone: <span className="font-medium">{clientTimezone}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
