"use client";

import { ArrowRight, Globe, Map as MapIcon, Tv } from "lucide-react";
import Link from "next/link";
import { memo, Suspense } from "react";
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
import { cn } from "@/lib/utils";

interface ChannelListRoute {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  features?: string[];
}

const channelListRoutesData: ChannelListRoute[] = [
  {
    badge: "Australia - Subscription",
    description: "Fetch TV internet protocol television service",
    features: ["IPTV", "Internet TV", "On-demand content"],
    href: "/channellist/fetch",
    icon: <Tv className="h-6 w-6" />,
    title: "Fetch",
  },
  {
    badge: "Australia - Subscription",
    description: "Australian pay television and streaming service channels",
    features: ["Pay TV", "Premium content", "Sports & entertainment"],
    href: "/channellist/foxtel",
    icon: <Tv className="h-6 w-6" />,
    title: "Foxtel",
  },
  {
    badge: "Australia - Free-to-air",
    description:
      "Australian free-to-air television channels and program guides",
    features: ["Free-to-air TV", "Regional channels", "HD & SD channels"],
    href: "/channellist/freeview-au",
    icon: <Tv className="h-6 w-6" />,
    title: "Freeview (AU)",
  },
  {
    badge: "Australia - Subscription",
    description: "Hubbl streaming platform channels and content",
    features: ["Streaming", "Aggregated content", "Multiple services"],
    href: "/channellist/hubbl",
    icon: <Tv className="h-6 w-6" />,
    title: "Hubbl",
  },
  {
    badge: "Australia - Free-to-air",
    description:
      "Viewer Access Satellite Television for remote Australian areas",
    features: ["Satellite TV", "Remote areas", "Government service"],
    href: "/channellist/vast",
    icon: <Tv className="h-6 w-6" />,
    title: "VAST",
  },
  {
    badge: "Australia - Free-to-air",
    description: "Interactive map showing Freeview channel coverage by region",
    features: ["Coverage map", "Regional data", "Interactive interface"],
    href: "/channellist/freeview-au/regionmap",
    icon: <MapIcon className="h-6 w-6" />,
    title: "Freeview Region Map",
  },
  {
    badge: "New Zealand - Free-to-air",
    description:
      "New Zealand free-to-air television channels and program guides",
    features: ["Free-to-air TV", "Local channels", "Regional coverage"],
    href: "/channellist/freeview-nz",
    icon: <Tv className="h-6 w-6" />,
    title: "Freeview (NZ)",
  },
  {
    badge: "New Zealand - Subscription",
    description: "Sky New Zealand satellite and streaming channels",
    features: ["Satellite TV", "Premium channels", "Sports & movies"],
    href: "/channellist/skynz",
    icon: <Tv className="h-6 w-6" />,
    title: "Sky NZ",
  },
];

// Sort by badge first, then by title
const channelListRoutes = channelListRoutesData.sort((a, b) => {
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

const ChannelCard = memo(({ route }: { route: ChannelListRoute }) => (
  <Link href={route.href} passHref>
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
          "bg-linear-to-r from-primary/10 to-transparent"
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
              {route.features.map((feature, _index) => (
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
              View Channels
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
));

ChannelCard.displayName = "ChannelCard";

function ChannelListContent() {
  return (
    <div className="flex size-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="w-full p-4">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              <h1 className="font-bold text-4xl">Channel Lists</h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Explore comprehensive channel listings and program guides for
              various television services across Australia and New Zealand.
            </p>
          </div>

          {/* Channel List Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {channelListRoutes.map((route) => (
              <ChannelCard key={route.href} route={route} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChannelListIndexPageClient() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <ChannelListContent />
      </Suspense>
    </main>
  );
}
