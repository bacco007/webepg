'use client';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCookie } from '@/lib/cookies';

dayjs.extend(advancedFormat);

type ApiResponse = {
  date: string;
  query: string;
  source: string;
  data: string[];
};

function EPGDayListContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>('xmlepg_FTASYD');
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const itemsPerPage = 999;

  const fetchDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource =
        (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
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
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const formatDate = (dateString: string): string => {
    const today = dayjs().format('YYYYMMDD');
    const formattedDate = dayjs(dateString, 'YYYYMMDD').format('dddd, Do MMM');
    return dateString === today ? `${formattedDate} (Today)` : formattedDate;
  };

  const handleRefresh = () => {
    fetchDates();
  };

  const totalPages = Math.ceil(dates.length / itemsPerPage);

  const paginatedDates = dates.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const isToday = (dateString: string): boolean => {
    return dateString === dayjs().format('YYYYMMDD');
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Daily EPG (by Day)</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </div>
      <ScrollArea className="grow">
        <div className="w-full p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedDates.map(date => (
                  <Link
                    key={date}
                    href={`/epg/${date}?source=${xmltvDataSource}`}
                    passHref
                  >
                    <Card
                      className={`group transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        isToday(date) ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <CardContent className="flex h-full flex-col items-center justify-center p-1">
                        <Calendar
                          className={`group-hover:text-secondary mb-2 size-8 transition-colors ${
                            isToday(date)
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <p
                          className={`text-center text-lg font-semibold ${
                            isToday(date) ? 'text-primary' : ''
                          }`}
                        >
                          {formatDate(date)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function EPGDayList() {
  return (
    <main>
      <Suspense fallback={<LoadingSpinner />}>
        <EPGDayListContent />
      </Suspense>
    </main>
  );
}
