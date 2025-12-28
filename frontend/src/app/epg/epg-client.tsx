"use client";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { Calendar, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { memo, Suspense, useCallback, useEffect, useState } from "react";
import {
  SidebarContainer,
  SidebarLayout,
} from "@/components/layouts/sidebar-layout";
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

// Update dayjs locale to use shorter day names
dayjs.updateLocale("en", {
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
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
      return `In ${diffDays}d`;
    }
    if (diffDays < 0 && diffDays > -RELATIVE_DAY_THRESHOLD) {
      return `${Math.abs(diffDays)}d ago`;
    }

    return "";
  };

  const getDayOfWeek = (dateString: string): string =>
    formatDateFromYYYYMMDD(dateString, "ddd");

  const getFormattedDate = (dateString: string): string =>
    formatDateFromYYYYMMDD(dateString, "MMM D, YYYY");

  const getCardClassName = () => {
    if (isToday(date)) {
      return "border-primary bg-primary/5 shadow-sm";
    }
    if (isPast(date)) {
      return "border-muted/50 bg-muted/5";
    }
    return "border-border";
  };

  return (
    <Link href={`/epg/${date}?source=${xmltvDataSource}`} key={date} passHref>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
          getCardClassName()
        )}
      >
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
            "bg-linear-to-r from-primary/10 to-transparent"
          )}
        />

        <CardContent className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm",
                isToday(date)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {dayjs(date, "YYYYMMDD").format("D")}
            </div>

            {getRelativeDay(date) && (
              <Badge
                className="px-2 text-[10px]"
                variant={isToday(date) ? "default" : "outline"}
              >
                {getRelativeDay(date)}
              </Badge>
            )}
          </div>

          <div className="mb-3 space-y-1">
            <h3 className="font-semibold text-base">{getDayOfWeek(date)}</h3>

            <p className="text-muted-foreground text-sm">
              {getFormattedDate(date)}
            </p>
          </div>

          <div className="mt-auto flex items-center text-muted-foreground text-xs">
            <Calendar className="mr-1.5 size-3.5" />
            <span>View Guide</span>
            <ChevronRight className="ml-auto size-3.5" />
          </div>
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
    formatDateFromYYYYMMDD(dateString, "ddd");

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
              <h3 className="mb-1 flex items-center font-semibold text-base">
                {getDayOfWeek(date)}
                {getRelativeDay(date) && (
                  <Badge className="ml-2 px-2 text-[10px]" variant="outline">
                    {getRelativeDay(date)}
                  </Badge>
                )}
              </h3>
              <p className="text-muted-foreground text-sm">
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
        sidebar={<SidebarContainer>{null}</SidebarContainer>}
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

  const sidebar = <SidebarContainer>{null}</SidebarContainer>;

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="overflow-auto"
      sidebar={sidebar}
      title="EPG Guide"
    >
      <div className="p-4 pb-4">
        {/* Description */}
        <div className="mb-6">
          <p className="text-muted-foreground text-sm">
            Browse electronic program guide dates and schedules for television
            channels.
          </p>
        </div>
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
