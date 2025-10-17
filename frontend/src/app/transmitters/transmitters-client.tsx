"use client";

import { ArrowRight, Radio, Tv } from "lucide-react";
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

type TransmitterRoute = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  features?: string[];
};

const transmitterRoutes: TransmitterRoute[] = [
  {
    badge: "Radio",
    description: "View radio transmitter information and coverage maps",
    features: ["Transmitter locations"],
    href: "/transmitters/radio",
    icon: <Radio className="h-6 w-6" />,
    title: "Radio Transmitters",
  },
  {
    badge: "Television",
    description: "View television transmitter information and coverage maps",
    features: ["Transmitter locations"],
    href: "/transmitters/television",
    icon: <Tv className="h-6 w-6" />,
    title: "Television Transmitters",
  },
];

const TransmitterCard = memo(({ route }: { route: TransmitterRoute }) => (
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
              View Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
));

TransmitterCard.displayName = "TransmitterCard";

function TransmittersContent() {
  return (
    <div className="flex size-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="w-full p-4">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Tv className="h-8 w-8 text-primary" />
              <h1 className="font-bold text-4xl">
                Transmitter Maps (Australia)
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Explore transmitter information for radio and television
              broadcasting services in Australia.
            </p>
          </div>

          {/* Transmitter Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {transmitterRoutes.map((route) => (
              <TransmitterCard key={route.href} route={route} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransmittersPageClient() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <TransmittersContent />
      </Suspense>
    </main>
  );
}
