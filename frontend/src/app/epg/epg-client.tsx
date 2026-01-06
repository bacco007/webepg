"use client";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { Calendar, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { memo, Suspense, useCallback, useEffect, useState } from "react";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
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
import { formatDateFromYYYYMMDD, isBefore } from "@/lib/date-utils";
import { ErrorAlert } from "@/lib/error-handling";
import { cn } from "@/lib/utils";

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

//Update dayjs locale to use shorter day names
dayjs.updateLocale("en", {
  weekdays: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
});

// Constants
const DEFAULT_DATA_SOURCE = "xmlepg_FTASYD";
const SKELETON_COUNT = 12;
const RELATIVE_DAY_THRESHOLD = 7;

interface ApiResponse {
  date: string;
  query: string;
  source: string;
  data: string[];
}

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
  const isToday = (dateString: string): boolean =>
    dateString === dayjs().format("YYYYMMDD");

  const isPast = (dateString: string): boolean =>
    isBefore(formatDateFromYYYYMMDD(dateString, "YYYY-MM-DD"), new Date());

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
      return `In ${diffDays} days`;
    }
    if (diffDays < 0 && diffDays > -RELATIVE_DAY_THRESHOLD) {
      return `${Math.abs(diffDays)} days ago`;
    }

    return "";
  };

  const getDayOfWeek = (dateString: string): string =>
    formatDateFromYYYYMMDD(dateString, "dddd, MMMM D YYYY");

  const getCardClassName = () => {
    if (isToday(date)) {
      return "border-2 border-primary/30 bg-background shadow-md";
    }
    if (isPast(date)) {
      return "border border-border/50 bg-background opacity-60";
    }
    return "border border-border/50 bg-background hover:border-primary/20 hover:shadow-md";
  };

  // Get a color for the day number icon based on day of week
  const getDayColor = () => {
    const dayOfWeek = dayjs(date, "YYYYMMDD").day();
    const colors = [
      "bg-blue-500", // Sunday
      "bg-green-500", // Monday
      "bg-purple-500", // Tuesday
      "bg-orange-500", // Wednesday
      "bg-pink-500", // Thursday
      "bg-cyan-500", // Friday
      "bg-indigo-500", // Saturday
    ];
    return colors[dayOfWeek];
  };

  return (
    <Link href={`/epg/${date}?source=${xmltvDataSource}`} key={date} passHref>
      <Card
        className={cn(
          "group relative h-full overflow-hidden transition-all duration-200 hover:shadow-lg",
          getCardClassName()
        )}
      >
        <CardContent className="flex h-full flex-col">
          <div className="mb-3 flex items-start justify-between">
            <div
              className={cn(
                "flex h-8 w-14 shrink-0 items-center justify-center rounded-lg font-bold text-base text-white shadow-sm",
                isToday(date) ? "bg-primary" : getDayColor()
              )}
            >
              {dayjs(date, "YYYYMMDD").format("D/M")}
            </div>

            <ChevronRight className="size-8 text-muted-foreground/90 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>

          <div className="mb-3 flex-1 space-y-0.5">
            <h3 className="font-semibold text-base text-foreground">
              {getDayOfWeek(date)}
            </h3>
          </div>

          {getRelativeDay(date) && (
            <div className="mt-auto">
              <Badge
                className={cn(
                  "text-sm",
                  isToday(date)
                    ? "bg-primary"
                    : "bg-muted text-muted-foreground"
                )}
                variant={isToday(date) ? "default" : "secondary"}
              >
                {getRelativeDay(date)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

DateCard.displayName = "DateCard";

const DateListItem = memo(({ date, xmltvDataSource }: DateListItemProps) => {
  const isToday = (dateString: string): boolean =>
    dateString === dayjs().format("YYYYMMDD");

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

  const getDayOfWeek = (dateString: string): string =>
    formatDateFromYYYYMMDD(dateString, "dddd");

  const getFormattedDate = (dateString: string): string =>
    formatDateFromYYYYMMDD(dateString, "MMM D, YYYY");

  return (
    <Link href={`/epg/${date}?source=${xmltvDataSource}`} key={date} passHref>
      <Card
        className={cn(
          "group transition-all duration-200 hover:bg-muted/5 hover:shadow-md",
          isToday(date)
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border"
        )}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm",
                isToday(date)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {dayjs(date, "YYYYMMDD").format("D")}
            </div>

            <div>
              <h3 className="mb-1 flex items-center font-bold text-base">
                {getDayOfWeek(date)}
                {getRelativeDay(date) && (
                  <Badge className="ml-2 px-2 text-[10px]" variant="outline">
                    {getRelativeDay(date)}
                  </Badge>
                )}
              </h3>
              <p className="text-muted-foreground text-xl">
                {getFormattedDate(date)}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Button className="gap-1.5" size="sm" variant="ghost">
              <Calendar className="size-4" />
              <span>View</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <SidebarLayout
        contentClassName="overflow-auto"
        sidebar={null}
        title="EPG Guide"
      >
        <div className="flex h-full items-center justify-center p-6">
          <ErrorAlert message={error} onRetry={handleRefresh} />
        </div>
      </SidebarLayout>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Tabs
        defaultValue="grid"
        onValueChange={(v) => setView(v as "grid" | "list")}
        value={view}
      >
        <TabsList className="grid w-[160px] grid-cols-2">
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => {
            const key = `skeleton-${index}`;
            return <DateSkeleton key={key} />;
          })}
        </div>
      );
    }

    if (dates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-lg">No dates available</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            There are no EPG dates available for the selected source.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      );
    }

    if (view === "grid") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      <div className="mx-auto max-w-4xl space-y-2">
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
    <SidebarLayout
      actions={headerActions}
      contentClassName="overflow-auto"
      sidebar={null}
      title="EPG Guide"
    >
      <div className="p-4 pb-4">
        {/* Content */}
        {renderContent()}
        <div aria-hidden="true" className="h-24" /> {/* Spacer element */}
      </div>
    </SidebarLayout>
  );
}

export default function EPGDayListClient() {
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
