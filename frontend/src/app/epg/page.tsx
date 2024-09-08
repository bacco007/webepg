'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { AlertCircle, Calendar, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmltvnet-sydney');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/dates/${storedDataSource}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setDates(data.data || []);
      setFilteredDates(data.data || []);
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

  useEffect(() => {
    const filtered = dates.filter((date) =>
      formatDate(date).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDates(filtered);
  }, [searchTerm, dates]);

  const formatDate = (dateString: string): string => {
    const today = dayjs().format('YYYYMMDD');
    const formattedDate = dayjs(dateString, 'YYYYMMDD').format('dddd, Do MMM');
    return dateString === today ? `${formattedDate} (Today)` : formattedDate;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    fetchDates();
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-500" />
          <p className="mb-4 text-xl text-red-500">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Daily EPG (by Day)</h1>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Search dates..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-64"
          />
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </header>
      <ScrollArea className="grow">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <main className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredDates.map((date) => (
                <Link key={date} href={`/epg/${date}?source=${xmltvDataSource}`} passHref>
                  <Card className="transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="flex h-full items-center justify-center p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="size-5" />
                        <p className="text-center text-xl font-bold">{formatDate(date)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </main>
        )}
      </ScrollArea>
    </div>
  );
};

export default EPGDayList;
