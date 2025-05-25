'use client';

import { useEffect, useState } from 'react';
import { SidebarFooterContent } from './SidebarFooterContent';
import { getCookie } from '@/lib/cookies';

export default function SidebarFooter() {
  const [timezone, setTimezone] = useState<string | undefined>();
  const [xmltvdatasource, setXmltvdatasource] = useState<string | undefined>();

  useEffect(() => {
    const storedTimezone = getCookie('timezone');
    const storedDataSource = getCookie('xmltvdatasource');

    setTimezone(storedTimezone);
    setXmltvdatasource(storedDataSource);
  }, []);

  return (
    <SidebarFooterContent
      timezone={timezone}
      xmltvdatasource={xmltvdatasource}
    />
  );
}
