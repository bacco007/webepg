/**
 * Timeline Event Popover Component
 * Shows event details in a popover on hover/tap using Shadcn UI
 */

import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { EVENT_TYPE_BADGES } from "./constants";
import type { TimelineEvent } from "./types";

interface TimelineEventPopoverProps {
  events: TimelineEvent[];
  children: React.ReactNode;
  className?: string;
}

export const TimelineEventPopover: React.FC<TimelineEventPopoverProps> = ({
  events,
  children,
  className,
}) => {
  if (!events || events.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild className={className}>
        {children}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">
              Timeline Events ({events.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((event, index) => (
              <div key={`${event.when}-${event.type}-${index}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                    {EVENT_TYPE_BADGES[event.type]}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {event.label || event.type}
                      </span>
                      <Badge className="text-xs" variant="secondary">
                        {event.type}
                      </Badge>
                    </div>
                    {event.note && (
                      <p className="text-muted-foreground text-xs">
                        {event.note}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Year: {event.when}
                    </p>
                  </div>
                </div>
                {index < events.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
