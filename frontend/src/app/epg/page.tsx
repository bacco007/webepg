'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import Link from 'next/link';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';

dayjs.extend(advancedFormat);

type ApiResponse = {
  date: string;
  query: string;
  source: string;
  data: string[];
};

const EPGDayList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmltvnet-sydney');

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
        setXmltvDataSource(storedDataSource);

        const response = await fetch(`/api/py/dates/${storedDataSource}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        setDates(data.data || []);
      } catch (error) {
        setError('Failed to fetch data');
        console.error('Error fetching dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  const formatDate = (dateString: string): string => {
    const today = dayjs().format('YYYYMMDD');
    const formattedDate = dayjs(dateString, 'YYYYMMDD').format('dddd, Do MMM');
    return dateString === today ? `${formattedDate} (Today)` : formattedDate;
  };

  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Daily EPG (by Day)</h1>
      </header>
      <main className="grow p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {dates.map((date) => (
            <Link key={date} href={`/epg/${date}?source=${xmltvDataSource}`} passHref>
              <Card className="transition-shadow duration-300 hover:shadow-lg">
                <CardContent className="flex h-full items-center justify-center p-4">
                  <p className="text-center text-xl font-bold">{formatDate(date)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default EPGDayList;
