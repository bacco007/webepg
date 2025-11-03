"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TimelineItem, VerticalTimeline } from "@/components/vertical-timeline";
import { ProviderFilter } from "@/components/vertical-timeline/provider-badge";
import { subscriptionTVEvents } from "@/data/vertical-timeline-events";
import {
  formatVerticalTimelineEvents,
  getProvidersFromEvents,
} from "@/lib/vertical-timeline-utils";

export default function SubscriptionTVHistoryPageClient() {
  const allProviderIds = useMemo(
    () => getProvidersFromEvents(subscriptionTVEvents),
    []
  );

  const [selectedProviders, setSelectedProviders] =
    useState<string[]>(allProviderIds);

  const events = useMemo(
    () => formatVerticalTimelineEvents(subscriptionTVEvents, selectedProviders),
    [selectedProviders]
  );

  const handleToggleProvider = (providerId: string) => {
    setSelectedProviders((prev) => {
      if (prev.includes(providerId)) {
        return prev.filter((id) => id !== providerId);
      }
      return [...prev, providerId];
    });
  };

  const handleSelectAll = () => {
    setSelectedProviders(allProviderIds);
  };

  const handleDeselectAll = () => {
    setSelectedProviders([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-4xl tracking-tight">
          Australian Subscription TV History
        </h1>
        <p className="text-lg text-muted-foreground">
          A comprehensive timeline of major events across Australian
          subscription television providers
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Filter by Provider</CardTitle>
              <CardDescription>
                Select providers to view their timeline events
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSelectAll}
                size="sm"
                type="button"
                variant="outline"
              >
                Select All
              </Button>
              <Button
                onClick={handleDeselectAll}
                size="sm"
                type="button"
                variant="outline"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProviderFilter
            onToggle={handleToggleProvider}
            providers={allProviderIds}
            selectedProviders={selectedProviders}
          />
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No events found. Please select at least one provider.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <VerticalTimeline>
              {events.map((event, index) => (
                <TimelineItem
                  date={event.date}
                  description={event.description}
                  key={`${event.sortKey}-${event.title}-${index}`}
                  tags={event.providers}
                  title={event.title}
                />
              ))}
            </VerticalTimeline>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>
          Showing {events.length} {events.length === 1 ? "event" : "events"}{" "}
          from {selectedProviders.length}{" "}
          {selectedProviders.length === 1 ? "provider" : "providers"}
        </p>
      </div>
    </div>
  );
}
