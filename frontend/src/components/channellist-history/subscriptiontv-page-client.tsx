"use client";

import { ChevronDown } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
} from "@/components/layouts/sidebar-layout";
import LoadingSpinner from "@/components/loading-spinner";
import { ProgramPageErrorBoundary } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  TimelineItem,
  VerticalTimeline,
  VerticalTimelineProgress,
} from "@/components/vertical-timeline";
import {
  EventTypeFilter,
  ProviderFilter,
} from "@/components/vertical-timeline/provider-badge";
import { subscriptionTVEvents } from "@/data/vertical-timeline-events";
import {
  formatVerticalTimelineEvents,
  getEventTypesFromEvents,
  getProvidersFromEvents,
} from "@/lib/vertical-timeline-utils";

function SubscriptionTVHistoryContent() {
  const allProviderIds = useMemo(
    () => getProvidersFromEvents(subscriptionTVEvents),
    []
  );

  const allEventTypes = useMemo(
    () => getEventTypesFromEvents(subscriptionTVEvents),
    []
  );

  // Start with nothing selected (empty arrays), but show everything until filters are applied
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // Collapsible state
  const [isProvidersOpen, setIsProvidersOpen] = useState(true);
  const [isEventTypesOpen, setIsEventTypesOpen] = useState(true);

  const events = useMemo(() => {
    // If no filters are selected, show all events
    // Otherwise, filter based on selections
    const providerFilter =
      selectedProviders.length > 0 ? selectedProviders : undefined;
    const eventTypeFilter =
      selectedEventTypes.length > 0 ? selectedEventTypes : undefined;

    return formatVerticalTimelineEvents(
      subscriptionTVEvents,
      providerFilter,
      eventTypeFilter
    );
  }, [selectedProviders, selectedEventTypes]);

  // Calculate spacing multipliers based on time gaps between consecutive events
  const spacingMultipliers = useMemo(() => {
    if (events.length <= 1) {
      return [1];
    }

    // Calculate time gaps between consecutive events
    const gaps: number[] = [];
    for (let i = 1; i < events.length; i += 1) {
      const currentEvent = events[i];
      const previousEvent = events[i - 1];
      if (currentEvent && previousEvent) {
        const gap = currentEvent.sortKey - previousEvent.sortKey;
        gaps.push(gap);
      }
    }

    // Calculate average gap
    const averageGap =
      gaps.length > 0
        ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
        : 1;

    // If averageGap is 0 or invalid, use base spacing for all
    if (!Number.isFinite(averageGap) || averageGap <= 0) {
      return events.map(() => 1);
    }

    // Calculate multipliers: gap / averageGap
    // First event gets base spacing (multiplier = 1)
    const multipliers: number[] = [1];
    for (const gap of gaps) {
      // Use the gap ratio, with a minimum of 1.5x to prevent overlapping boxes
      // and maximum of 5x to prevent extreme spacing
      const multiplier = Math.max(1.5, Math.min(5, gap / averageGap));
      multipliers.push(multiplier);
    }

    return multipliers;
  }, [events]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Find the scroll container (the ScrollArea viewport)
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLElement>(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        scrollContainerRef.current = viewport;
      }
    }
  }, []);

  const handleToggleProvider = (providerId: string) => {
    setSelectedProviders((prev) => {
      if (prev.includes(providerId)) {
        return prev.filter((id) => id !== providerId);
      }
      return [...prev, providerId];
    });
  };

  const handleToggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) => {
      if (prev.includes(eventType)) {
        return prev.filter((type) => type !== eventType);
      }
      return [...prev, eventType];
    });
  };

  const handleSelectAllProviders = () => {
    setSelectedProviders(allProviderIds);
  };

  const handleDeselectAllProviders = () => {
    setSelectedProviders([]);
  };

  const handleSelectAllEventTypes = () => {
    setSelectedEventTypes(allEventTypes);
  };

  const handleDeselectAllEventTypes = () => {
    setSelectedEventTypes([]);
  };

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <div className="p-2">
          <h2 className="font-medium text-sm">Filters</h2>
          <p className="mt-1 text-muted-foreground text-xs">
            Filter timeline events by provider and type
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="space-y-3">
          {/* Providers Filter */}
          <Collapsible onOpenChange={setIsProvidersOpen} open={isProvidersOpen}>
            <div className="flex w-full items-center gap-1">
              <CollapsibleTrigger className="flex flex-1 items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
                <h3 className="font-semibold text-xs">Providers</h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isProvidersOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2 px-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleSelectAllProviders}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Select All
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleDeselectAllProviders}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Clear All
                  </Button>
                </div>
                <ProviderFilter
                  onToggle={handleToggleProvider}
                  providers={allProviderIds}
                  selectedProviders={selectedProviders}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Event Types Filter */}
          <Collapsible
            onOpenChange={setIsEventTypesOpen}
            open={isEventTypesOpen}
          >
            <div className="flex w-full items-center gap-1">
              <CollapsibleTrigger className="flex flex-1 items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50">
                <h3 className="font-semibold text-xs">Event Types</h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isEventTypesOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2 px-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleSelectAllEventTypes}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Select All
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleDeselectAllEventTypes}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Clear All
                  </Button>
                </div>
                <EventTypeFilter
                  eventTypes={allEventTypes}
                  onToggle={handleToggleEventType}
                  selectedEventTypes={selectedEventTypes}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {events.length} {events.length === 1 ? "event" : "events"}
          {selectedProviders.length > 0 && (
            <>
              {" "}
              from {selectedProviders.length}{" "}
              {selectedProviders.length === 1 ? "provider" : "providers"}
            </>
          )}
          {selectedEventTypes.length > 0 && (
            <>
              {" "}
              ({selectedEventTypes.length}{" "}
              {selectedEventTypes.length === 1 ? "type" : "types"} selected)
            </>
          )}
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  return (
    <SidebarLayout
      contentClassName="overflow-hidden"
      sidebar={sidebar}
      title="Australian Subscription TV History"
    >
      <div className="relative flex h-full flex-col" ref={contentRef}>
        {/* Progress bar above timeline */}
        {events.length > 0 && (
          <div className="shrink-0 border-b bg-background">
            <VerticalTimelineProgress
              events={events}
              scrollContainerRef={scrollContainerRef}
            />
          </div>
        )}
        <ScrollArea
          className="flex h-full flex-col p-4"
          ref={scrollAreaRef as never}
        >
          <VerticalTimeline>
            {events.map((event, index) => (
              <TimelineItem
                date={event.date}
                description={event.description}
                itemIndex={index}
                key={`${event.sortKey}-${event.title}-${index}`}
                spacingMultiplier={spacingMultipliers[index]}
                tags={event.providers}
                title={event.title}
              />
            ))}
          </VerticalTimeline>
        </ScrollArea>
      </div>
    </SidebarLayout>
  );
}

export default function SubscriptionTVHistoryPageClient() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ProgramPageErrorBoundary pageName="subscription TV history">
        <Suspense fallback={<LoadingSpinner />}>
          <SubscriptionTVHistoryContent />
        </Suspense>
      </ProgramPageErrorBoundary>
    </div>
  );
}
