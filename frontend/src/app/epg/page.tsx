'use client';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronRight, Clock, RefreshCw } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

type ApiResponse = {
  date: string;
  query: string;
  source: string;
  data: string[];
};

function DateSkeleton() {
  return (
    <div className="flex flex-col space-y-2">
      <Skeleton className="rounded-lg w-full h-24" />
      <Skeleton className="rounded w-3/4 h-4" />
      <Skeleton className="rounded w-1/2 h-4" />
    </div>
  );
}

function EPGDayListContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>('xmlepg_FTASYD');
  const [currentPage, setCurrentPage] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDates();
    setRefreshing(false);
  };

  const totalPages = Math.ceil(dates.length / itemsPerPage);

  const paginatedDates = dates.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const isToday = (dateString: string): boolean => {
    return dateString === dayjs().format('YYYYMMDD');
  };

  const isPast = (dateString: string): boolean => {
    return dayjs(dateString, 'YYYYMMDD').isBefore(dayjs(), 'day');
  };

  const isFuture = (dateString: string): boolean => {
    return dayjs(dateString, 'YYYYMMDD').isAfter(dayjs(), 'day');
  };

  const getRelativeDay = (dateString: string): string => {
    const date = dayjs(dateString, 'YYYYMMDD');
    const today = dayjs();
    const diffDays = date.diff(today, 'day');

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;

    return '';
  };

  const getDayOfWeek = (dateString: string): string => {
    return dayjs(dateString, 'YYYYMMDD').format('dddd');
  };

  const getFormattedDate = (dateString: string): string => {
    return dayjs(dateString, 'YYYYMMDD').format('MMMM D, YYYY');
  };

  if (error) {
    return (
      <div className="flex justify-center items-center p-6 h-full">
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

  const headerActions = (
    <div className="flex items-center gap-2">
      <Tabs
        defaultValue="grid"
        className="mr-2"
        onValueChange={v => setView(v as 'grid' | 'list')}
      >
        <TabsList className="grid grid-cols-2 w-[160px]">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
      </Tabs>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              disabled={refreshing}
            >
              <RefreshCw
                className={cn('size-4', refreshing && 'animate-spin')}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh available dates</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="flex flex-col size-full">
      <PageHeader title="EPG Guide" actions={headerActions} />

      <div className="flex-1 overflow-auto">
        <div className="p-4 w-full">
          {loading ? (
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <DateSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
              {view === 'grid' ? (
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {paginatedDates.map(date => (
                    <Link
                      key={date}
                      href={`/epg/${date}?source=${xmltvDataSource}`}
                      passHref
                    >
                      <Card
                        className={cn(
                          'group relative overflow-hidden transition-all duration-300 hover:shadow-lg',
                          isToday(date) ? 'border-primary bg-primary/5' : '',
                          isPast(date) ? 'border-muted bg-muted/5' : '',
                          isFuture(date) ? 'border-muted' : '',
                        )}
                      >
                        <div
                          className={cn(
                            'absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100',
                            'from-primary/10 bg-gradient-to-r to-transparent',
                          )}
                        />

                        <CardContent className="flex flex-col p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full',
                                isToday(date)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {dayjs(date, 'YYYYMMDD').format('D')}
                            </div>

                            {getRelativeDay(date) && (
                              <Badge
                                variant={isToday(date) ? 'default' : 'outline'}
                              >
                                {getRelativeDay(date)}
                              </Badge>
                            )}
                          </div>

                          <h3 className="mb-1 font-medium text-base">
                            {getDayOfWeek(date)}
                          </h3>

                          <p className="text-muted-foreground text-xs">
                            {getFormattedDate(date)}
                          </p>

                          <div className="flex items-center mt-2 text-xs">
                            <Clock className="mr-1 size-3 text-primary" />
                            <span>View TV Guide</span>
                            <ChevronRight className="ml-auto size-3" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedDates.map(date => (
                    <Link
                      key={date}
                      href={`/epg/${date}?source=${xmltvDataSource}`}
                      passHref
                    >
                      <Card
                        className={cn(
                          'group hover:bg-muted/5 transition-all duration-200',
                          isToday(date) ? 'border-primary bg-primary/5' : '',
                        )}
                      >
                        <CardContent className="flex justify-between items-center p-3">
                          <div className="flex items-center">
                            <div
                              className={cn(
                                'mr-3 flex h-8 w-8 items-center justify-center rounded-full',
                                isToday(date)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {dayjs(date, 'YYYYMMDD').format('D')}
                            </div>

                            <div>
                              <h3 className="flex items-center font-medium text-sm">
                                {getDayOfWeek(date)}
                                {getRelativeDay(date) && (
                                  <Badge variant="outline" className="ml-2">
                                    {getRelativeDay(date)}
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-muted-foreground text-xs">
                                {getFormattedDate(date)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                            >
                              <Clock className="size-3" />
                              <span>View Guide</span>
                              <ChevronRight className="size-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing Badge component - adding it here
function Badge({
  children,
  variant = 'default',
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
  [key: string]: any;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'outline' && 'border-input bg-background border',
        variant === 'destructive' &&
          'bg-destructive text-destructive-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default function EPGDayList() {
  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
          </div>
        }
      >
        <EPGDayListContent />
      </Suspense>
    </main>
  );
}
