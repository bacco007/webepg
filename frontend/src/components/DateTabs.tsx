'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCookie, setCookie } from '@/lib/cookies';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DateTabs() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParameters = useSearchParams();
  const pathname = usePathname();

  const fetchDates = useCallback(async () => {
    try {
      const storedDataSource =
        (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      const userTimezone = dayjs.tz.guess();
      await setCookie('userTimezone', userTimezone);
      const response = await fetch(
        `/api/py/dates/${storedDataSource}?timezone=${encodeURIComponent(userTimezone)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch dates');
      }
      const data: { data: string[] } = await response.json();
      setDates(data.data || []);
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useEffect(() => {
    const urlDate = pathname.split('/').pop();
    if (urlDate && /^\d{8}$/.test(urlDate)) {
      setSelectedDate(urlDate);
    } else {
      const currentDate = searchParameters.get('date');
      if (currentDate) {
        setSelectedDate(currentDate);
      }
    }
  }, [searchParameters, pathname]);

  const handleDateChange = async (value: string) => {
    setSelectedDate(value);
    const currentTimezone =
      searchParameters.get('timezone') ||
      (await getCookie('userTimezone')) ||
      dayjs.tz.guess();
    router.push(
      `/epg/${value}?timezone=${encodeURIComponent(currentTimezone)}`,
    );
  };

  const formatDate = (dateString: string) => {
    const date = dayjs(dateString, 'YYYYMMDD');
    const today = dayjs().format('YYYYMMDD');
    if (dateString === today) {
      return (
        <span className="flex flex-col items-center">
          <span className="font-bold">Today</span>
          <span>{date.format('DD MMM')}</span>
        </span>
      );
    }
    return (
      <span className="flex flex-col items-center">
        <span className="font-bold">{date.format('ddd')}</span>
        <span>{date.format('DD MMM')}</span>
      </span>
    );
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -160 : 160;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="sticky left-0 top-0 z-0 mx-auto w-full bg-background px-4 sm:px-6 lg:px-8"
      ref={tabsRef}
    >
      <Tabs
        value={selectedDate}
        onValueChange={handleDateChange}
        className="w-full"
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scrollTabs('left')}
            className="rounded-full bg-muted p-2 hover:bg-muted-foreground/10 lg:hidden"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex-1 overflow-x-auto"
          >
            <TabsList className="inline-flex h-12 w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
              {dates.map(date => (
                <TabsTrigger
                  key={date}
                  value={date}
                  className="inline-flex h-9 min-w-[160px] flex-1 flex-col items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  {formatDate(date)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <button
            onClick={() => scrollTabs('right')}
            className="rounded-full bg-muted p-2 hover:bg-muted-foreground/10 lg:hidden"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Tabs>
    </div>
  );
}
