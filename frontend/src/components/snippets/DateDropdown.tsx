'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

dayjs.extend(utc);
dayjs.extend(timezone);

const DateDropdown: React.FC = () => {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const router = useRouter();
  const searchParameters = useSearchParams();

  const fetchDates = useCallback(async () => {
    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
      const userTimezone = dayjs.tz.guess();
      const response = await fetch(
        `/api/py/dates/${storedDataSource}?timezone=${encodeURIComponent(userTimezone)}`
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
    const currentDate = searchParameters.get('date');
    if (currentDate) {
      setSelectedDate(currentDate);
    }
  }, [searchParameters]);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    const currentTimezone = searchParameters.get('timezone') || dayjs.tz.guess();
    router.push(`/epg/${value}?timezone=${encodeURIComponent(currentTimezone)}`);
  };

  const formatDate = (dateString: string) => {
    const today = dayjs().format('YYYYMMDD');
    return dateString === today ? 'Today' : dayjs(dateString, 'YYYYMMDD').format('DD/MM/YYYY');
  };

  return (
    <Select value={selectedDate} onValueChange={handleDateChange}>
      <SelectTrigger className="w-[180px] md:w-[280px]">
        <SelectValue placeholder="Select a date" />
      </SelectTrigger>
      <SelectContent>
        {dates.map((date) => (
          <SelectItem key={date} value={date}>
            {formatDate(date)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DateDropdown;
