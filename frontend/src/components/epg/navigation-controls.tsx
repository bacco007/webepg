"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavigationControlsProps = {
  startDayIndex: number;
  visibleDays: number;
  daysLength: number;
  days: Date[];
  onPrevious: () => void;
  onNext: () => void;
};

export function NavigationControls({
  startDayIndex,
  visibleDays,
  daysLength,
  days,
  onPrevious,
  onNext,
}: NavigationControlsProps) {
  return (
    <div className="border-b bg-background px-4 py-2">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Previous day"
                disabled={startDayIndex === 0}
                onClick={onPrevious}
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous day</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div aria-live="polite" className="font-semibold">
          {days[startDayIndex] && format(days[startDayIndex], "MMM d")} -{" "}
          {days[startDayIndex + visibleDays - 1] &&
            format(days[startDayIndex + visibleDays - 1], "MMM d")}{" "}
          ({visibleDays} of {daysLength} days)
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Next day"
                disabled={startDayIndex + visibleDays >= daysLength}
                onClick={onNext}
                variant="outline"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next day</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
