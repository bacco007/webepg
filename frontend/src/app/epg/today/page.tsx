'use client';

import { useEffect } from 'react';
import { format } from 'date-fns-tz';
import { useRouter } from 'next/navigation';

export default function TodayRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const now = new Date();
      if (isNaN(now.getTime())) {
        throw new Error('Invalid date');
      }

      let userTimezone = 'UTC';
      try {
        const storedTimezone = localStorage.getItem('userTimezone');
        if (storedTimezone) {
          userTimezone = storedTimezone;
        }
      } catch (error) {
        console.warn('Error accessing localStorage:', error);
      }

      const today = format(now, 'yyyyMMdd', { timeZone: userTimezone });

      if (!/^\d{8}$/.test(today)) {
        throw new Error('Invalid date format');
      }

      const redirectUrl = `/epg/${today}`;

      router.push(redirectUrl);
    } catch (error) {
      console.error('Error in TodayRedirect:', error);
      router.push('/epg/error');
    }
  }, [router]);

  return null;
}
