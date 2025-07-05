"use client";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { Calendar, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { memo, Suspense, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layouts/page-header";
import LoadingSpinner from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCookie } from "@/lib/cookies";
import { formatDateFromYYYYMMDD, isAfter, isBefore } from "@/lib/date-utils";
import { ErrorAlert } from "@/lib/error-handling";
import { cn } from "@/lib/utils";

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// Update dayjs locale to use shorter day names
dayjs.updateLocale("en", {
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
});

// Constants
const DEFAULT_DATA_SOURCE = "xmlepg_FTASYD";
const SKELETON_COUNT = 12;
const RELATIVE_DAY_THRESHOLD = 7;

type ApiResponse = {
  date: string;
  query: string;
  source: string;
  data: string[];
};

interface DateCardProps {
  date: string;
  xmltvDataSource: string;
}

interface DateListItemProps {
  date: string;
  xmltvDataSource: string;
}

function DateSkeleton() {
  return (
    <div className="flex flex-col space-y-2">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-4 w-1/2 rounded" />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <LoadingSpinner text="Loading EPG dates..." />
      </div>
    </div>
  );
}

const DateCard = memo(({ date, xmltvDataSource }: DateCardProps) => {
  const isToday = (dateString: string): boolean => {
    return dateString === dayjs().format("YYYYMMDD");
  };

  const isPast = (dateString: string): boolean => {
    return isBefore(
      formatDateFromYYYYMMDD(dateString, "YYYY-MM-DD"),
      new Date()
    );
  };

  const isFuture = (dateString: string): boolean => {
    return isAfter(
      formatDateFromYYYYMMDD(dateString, "YYYY-MM-DD"),
      new Date()
    );
  };

  const getRelativeDay = (dateString: string): string => {
    const dateObj = dayjs(dateString, "YYYYMMDD");
    const today = dayjs();
    const diffDays = dateObj.diff(today, "day");

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Tomorrow";
    }
    if (diffDays === -1) {
      return "Yesterday";
    }
    if (diffDays > 0 && diffDays < RELATIVE_DAY_THRESHOLD) {
      return `In ${diffDays}d`;
    }
    if (diffDays < 0 && diffDays > -RELATIVE_DAY_THRESHOLD) {
      return `${Math.abs(diffDays)}d ago`;
    }

    return "";
  };

  const getDayOfWeek = (dateString: string): string => {
    return formatDateFromYYYYMMDD(dateString, "ddd");
  };

  const getFormattedDate = (dateString: string): string => {
    return formatDateFromYYYYMMDD(dateString, "MMM D, YYYY");
  };

  return (
    <Link href={`/epg/${date}?source=${xmltvDataSource}`} key={date} passHref>
      <Card
        className={cn(
          "group relative overflow-hidden py-1 transition-all duration-300 hover:shadow-lg",
          isToday(date) ? "border-primary bg-primary/5" : "",
          isPast(date) ? "border-muted bg-muted/5" : "",
          isFuture(date) ? "border-muted" : ""
        )}
      >
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
            "bg-gradient-to-r from-primary/10 to-transparent"
          )}
        />

        <CardContent className="flex flex-col p-2">
          <div className="mb-1 flex items-center justify-between">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                isToday(date)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {dayjs(date, "YYYYMMDD").format("D")}
            </div>

            {getRelativeDay(date) && (
              <Badge
                className="px-1.5 text-[10px]"
                variant={isToday(date) ? "default" : "outline"}
              >
                {getRelativeDay(date)}
              </Badge>
            )}
          </div>

          <div className="space-y-0.5">
            <h3 className="font-medium text-sm">{getDayOfWeek(date)}</h3>

            <p className="text-muted-foreground text-xs">
              {getFormattedDate(date)}
            </p>
          </div>

          <div className="mt-1 flex items-center text-muted-foreground text-xs">
            <Calendar className="mr-1 size-3" />
            <span>View Guide</span>
            <ChevronRight className="ml-auto size-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

DateCard.displayName = "DateCard";

const DateListItem = memo(({ date, xmltvDataSource }: DateListItemProps) => {
  const isToday = (dateString: string): boolean => {
    return dateString === dayjs().format("YYYYMMDD");
  };

  const getRelativeDay = (dateString: string): string => {
    const dateObj = dayjs(dateString, "YYYYMMDD");
    const today = dayjs();
    const diffDays = dateObj.diff(today, "day");

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Tomorrow";
    }
    if (diffDays === -1) {
      return "Yesterday";
    }
    if (diffDays > 0 && diffDays < RELATIVE_DAY_THRESHOLD) {
      return `In ${diffDays}d`;
    }
    if (diffDays < 0 && diffDays > -RELATIVE_DAY_THRESHOLD) {
      return `${Math.abs(diffDays)}d ago`;
    }

    return "";
  };

  const getDayOfWeek = (dateString: string): string => {
    return formatDateFromYYYYMMDD(dateString, "ddd");
  };

  const getFormattedDate = (dateString: string): string => {
    return formatDateFromYYYYMMDD(dateString, "MMM D, YYYY");
  };

  return (
    <Link href={`/epg/${date}?source=${xmltvDataSource}`} key={date} passHref>
      <Card
        className={cn(
          "group py-1 pb-4 transition-all duration-200 hover:bg-muted/5",
          isToday(date) ? "border-primary bg-primary/5" : ""
        )}
      >
        <CardContent className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <div
              className={cn(
                "mr-2 flex h-6 w-6 items-center justify-center rounded-full text-sm",
                isToday(date)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {dayjs(date, "YYYYMMDD").format("D")}
            </div>

            <div>
              <h3 className="flex items-center font-medium text-sm">
                {getDayOfWeek(date)}
                {getRelativeDay(date) && (
                  <Badge className="ml-2 px-1.5 text-[10px]" variant="outline">
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
              className="h-6 gap-1 px-2 text-xs"
              size="sm"
              variant="ghost"
            >
              <Calendar className="size-3" />
              <span>View</span>
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
      &nbsp;
    </Link>
  );
});

DateListItem.displayName = "DateListItem";

function EPGDayListContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>(DEFAULT_DATA_SOURCE);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [refreshing, setRefreshing] = useState(false);

  const fetchDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource =
        (await getCookie("xmltvdatasource")) || DEFAULT_DATA_SOURCE;
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/dates/${storedDataSource}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setDates(data.data || []);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDates();
    setRefreshing(false);
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <ErrorAlert message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Tabs
        className="mr-2"
        defaultValue="grid"
        onValueChange={(v) => setView(v as "grid" | "list")}
      >
        <TabsList className="grid w-[160px] grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
      </Tabs>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={refreshing}
              onClick={handleRefresh}
              size="icon"
              variant="outline"
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh available dates</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <DateSkeleton key={`skeleton-${index}-${Date.now()}`} />
          ))}
        </div>
      );
    }

    if (view === "grid") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {dates.map((date) => (
            <DateCard
              date={date}
              key={date}
              xmltvDataSource={xmltvDataSource}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {dates.map((date) => (
          <DateListItem
            date={date}
            key={date}
            xmltvDataSource={xmltvDataSource}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="flex size-full flex-col">
      <PageHeader actions={headerActions} title="EPG Guide" />

      <div className="flex-1 overflow-auto">
        <div className="w-full p-4">{renderContent()}</div>
      </div>
    </div>
  );
}

export default function EPGDayList() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <EPGDayListContent />
      </Suspense>
    </main>
  );
}
