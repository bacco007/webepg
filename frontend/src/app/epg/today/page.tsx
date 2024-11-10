'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format } from 'date-fns-tz';

import { getCookie } from '@/lib/cookies';

export default function TodayRedirect() {
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
    };

    redirect();
  }, [router]);

  return null;
}
