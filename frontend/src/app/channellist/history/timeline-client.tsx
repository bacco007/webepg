"use client";

import { ArrowRight, Calendar, History } from "lucide-react";
import Link from "next/link";
import { memo, Suspense, useMemo } from "react";
import LoadingSpinner from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timelineProviders } from "@/lib/timeline-data";
import { cn } from "@/lib/utils";

type TimelineRoute = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  features?: string[];
  period?: string;
};

// Helper function to generate features from provider data
function generateFeatures(
  provider: (typeof timelineProviders)[string]
): string[] {
  const features: string[] = [];

  // Add period
  const period = `${provider.data.axis.start}-${provider.data.axis.end}`;
  features.push(period);

  // Add category-specific feature
  features.push(provider.category);

  // Add channel count
  const channelCount = Object.keys(provider.data.channels).length;
  features.push(`${channelCount} channels`);

  return features;
}

// Helper function to determine icon based on end year
function getIcon(endYear: number): React.ReactNode {
  const currentYear = new Date().getFullYear();
  // If timeline extends to current year or beyond, use Calendar icon
  return endYear >= currentYear ? (
    <Calendar className="h-6 w-6" />
  ) : (
    <History className="h-6 w-6" />
  );
}

// Convert timeline providers to route data
function getTimelineRoutes(): TimelineRoute[] {
  return Object.values(timelineProviders).map((provider) => ({
    badge: `${provider.country} - ${provider.category}`,
    description: provider.description,
    features: generateFeatures(provider),
    href: `/channellist/history/${provider.id}`,
    icon: getIcon(provider.data.axis.end),
    period: `${provider.data.axis.start}-${provider.data.axis.end}`,
    title: provider.name,
  }));
}

const TimelineCard = memo(({ route }: { route: TimelineRoute }) => (
  <Link href={route.href} passHref>
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
          "bg-gradient-to-r from-primary/10 to-transparent"
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              {route.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{route.title}</CardTitle>
              {route.badge && (
                <Badge className="mt-1" variant="secondary">
                  {route.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">
          {route.description}
        </CardDescription>

        {route.features && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {route.features.map((feature) => (
                <Badge
                  className="text-xs"
                  key={`${route.title}-${feature}`}
                  variant="outline"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            asChild
            className="w-full transition-colors group-hover:bg-primary/90"
          >
            <div>
              View Timeline
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
));

TimelineCard.displayName = "TimelineCard";

function TimelineContent() {
  // Get and sort timeline routes
  const timelineRoutes = useMemo(() => {
    const routes = getTimelineRoutes();
    // Sort by badge first, then by title
    return routes.sort((a, b) => {
      // First sort by badge (handle undefined badges)
      const badgeA = a.badge || "";
      const badgeB = b.badge || "";
      const badgeComparison = badgeA.localeCompare(badgeB);
      if (badgeComparison !== 0) {
        return badgeComparison;
      }
      // If badges are the same, sort by title
      return a.title.localeCompare(b.title);
    });
  }, []);

  return (
    <div className="flex size-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="w-full p-4">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="font-bold text-4xl">Channel History Timelines</h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Explore historical channel lineup timelines showing how television
              services evolved over time. Track channel changes, launches, and
              transitions across different providers.
            </p>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {timelineRoutes.map((route) => (
              <TimelineCard key={route.href} route={route} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimelineIndexPageClient() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <TimelineContent />
      </Suspense>
    </main>
  );
}
