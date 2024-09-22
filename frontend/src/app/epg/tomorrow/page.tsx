'use client';

import { useEffect } from 'react';
import { addDays } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { useRouter } from 'next/navigation';

export default function TomorrowRedirect() {
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

      const tomorrow = addDays(now, 1);
      const zonedTomorrow = toZonedTime(tomorrow, userTimezone);
      const formattedTomorrow = format(zonedTomorrow, 'yyyyMMdd', { timeZone: userTimezone });

      if (!/^\d{8}$/.test(formattedTomorrow)) {
        throw new Error('Invalid date format');
      }

      const redirectUrl = `/epg/${formattedTomorrow}`;

      router.push(redirectUrl);
    } catch (error) {
      console.error('Error in TomorrowRedirect:', error);
      router.push('/epg/error');
    }
  }, [router]);

  return null;
}
