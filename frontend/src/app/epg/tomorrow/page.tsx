'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { addDays } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';

import { getCookie } from '@/lib/cookies';

export default function TomorrowRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const now = new Date();
        if (isNaN(now.getTime())) {
          throw new Error('Invalid date');
        }

        let userTimezone = 'UTC';
        try {
          const storedTimezone = await getCookie('userTimezone');
          if (storedTimezone) {
            userTimezone = storedTimezone;
          }
        } catch (error) {
          console.warn('Error accessing cookies:', error);
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
    };

    redirect();
  }, [router]);

  return null;
}
