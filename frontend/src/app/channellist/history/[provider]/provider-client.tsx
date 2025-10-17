"use client";

import { ChevronLeft, ChevronRight, Tv } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
} from "@/components/layouts/sidebar-layout";
import LoadingState from "@/components/loading-state";
import { calculatePxPerYear } from "@/components/timeline/spacing-utils";
import {
  type TimelineSpacingMode,
  TimelineSpacingSelector,
} from "@/components/timeline/TimelineSpacingSelector";
import { TimelineUnified } from "@/components/timeline/TimelineUnified";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getAllProviderIds,
  getProvidersByCategory,
  timelineProviders,
} from "@/lib/timeline-data";

type ChannelHistoryClientProps = {
  params: Promise<{
    provider: string;
  }>;
};

export default function ChannelHistoryClient({
  params,
}: ChannelHistoryClientProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { provider: providerId } = unwrappedParams;
  const isMobile = useIsMobile();

  const providersByCategory = useMemo(() => getProvidersByCategory(), []);
  const validProviderIds = useMemo(() => getAllProviderIds(), []);
  const selectedProvider = timelineProviders[providerId];

  // Spacing state
  const [spacingMode, setSpacingMode] = useState<TimelineSpacingMode>("fill");
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Track container width for fill-space mode
  useEffect(() => {
    const container = document.querySelector("[data-timeline-container]");

    if (!container) {
      // Fallback if container not found yet
      const timeoutId = setTimeout(() => {
        setContainerWidth(window.innerWidth - 300);
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    // Use ResizeObserver for accurate container size tracking
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    resizeObserver.observe(container);

    // Also set initial width immediately
    setContainerWidth(container.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Validate provider and redirect if invalid
  useEffect(() => {
    if (!validProviderIds.includes(providerId)) {
      // Redirect to the first available provider
      const firstProviderId = validProviderIds[0];
      if (firstProviderId) {
        router.replace(`/channellist/history/${firstProviderId}`);
      }
    }
  }, [providerId, validProviderIds, router]);

  // Handle provider change
  const handleProviderChange = (newProviderId: string) => {
    router.push(`/channellist/history/${newProviderId}`);
  };

  // Navigation functions
  const handlePrevProvider = () => {
    const currentIndex = validProviderIds.indexOf(providerId);
    if (currentIndex > 0) {
      const prevProviderId = validProviderIds[currentIndex - 1];
      handleProviderChange(prevProviderId);
    }
  };

  const handleNextProvider = () => {
    const currentIndex = validProviderIds.indexOf(providerId);
    if (currentIndex < validProviderIds.length - 1) {
      const nextProviderId = validProviderIds[currentIndex + 1];
      handleProviderChange(nextProviderId);
    }
  };

  // Create the sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Select Provider</h3>
          <p className="text-muted-foreground text-xs">
            Choose a TV provider to view its channel history
          </p>
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarContent>
          {Object.entries(providersByCategory).map(([category, providers]) => (
            <div className="mb-4" key={category}>
              <h4 className="mb-2 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {category}
              </h4>
              <div className="space-y-1">
                {providers.map((provider) => (
                  <Button
                    className="w-full justify-start"
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    variant={providerId === provider.id ? "secondary" : "ghost"}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tv className="h-4 w-4" />
                        <span className="text-sm">{provider.name}</span>
                      </div>
                      {providerId === provider.id && (
                        <Badge className="ml-2 text-xs" variant="default">
                          Active
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </SidebarContent>
      </ScrollArea>
      <SidebarFooter>
        <div className="space-y-2">
          {selectedProvider && (
            <div className="rounded-md bg-muted p-3">
              <div className="mb-1 flex items-center gap-2">
                <Tv className="h-3 w-3" />
                <span className="font-medium text-xs">
                  {selectedProvider.name}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {selectedProvider.description}
              </p>
              <div className="mt-2 flex gap-1">
                <Badge className="text-xs" variant="outline">
                  {selectedProvider.country}
                </Badge>
                <Badge className="text-xs" variant="outline">
                  {selectedProvider.data.axis.start}-
                  {selectedProvider.data.axis.end}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // Calculate pixels per year based on spacing mode
  const pxPerYear = useMemo(() => {
    if (!selectedProvider) {
      return;
    }

    return calculatePxPerYear({
      isMobile,
      mode: spacingMode,
      timelineEnd: selectedProvider.data.axis.end,
      timelineStart: selectedProvider.data.axis.start,
      viewportWidth: containerWidth,
    });
  }, [spacingMode, isMobile, containerWidth, selectedProvider]);

  // Header actions for the sidebar layout (similar to EPG)
  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          disabled={validProviderIds.indexOf(providerId) === 0}
          onClick={handlePrevProvider}
          size="icon"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Select onValueChange={handleProviderChange} value={providerId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(providersByCategory).map(
              ([category, providers]) => (
                <div key={category}>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({provider.data.axis.start}-{provider.data.axis.end})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              )
            )}
          </SelectContent>
        </Select>

        <Button
          disabled={
            validProviderIds.indexOf(providerId) === validProviderIds.length - 1
          }
          onClick={handleNextProvider}
          size="icon"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Spacing selector */}
      <TimelineSpacingSelector onChange={setSpacingMode} value={spacingMode} />
    </div>
  );

  // Show loading state while validating/redirecting
  if (!selectedProvider) {
    return <LoadingState text="Loading channel history..." />;
  }

  // Create the page title
  const pageTitle = `${selectedProvider.name} Channel History`;

  return (
    <SidebarLayout
      actions={headerActions}
      contentClassName="overflow-hidden p-0"
      sidebar={sidebar}
      title={pageTitle}
    >
      <div className="flex h-full flex-col" data-timeline-container>
        <TimelineUnified
          doc={selectedProvider.data}
          onEventClick={() => {
            // Handle event click
          }}
          onSpanClick={() => {
            // Handle span click
          }}
          pxPerYear={pxPerYear}
        />
      </div>
    </SidebarLayout>
  );
}
