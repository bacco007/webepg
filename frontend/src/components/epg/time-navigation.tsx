"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimeNavigationProps = {
  onJumpToTime: (hour: number) => void;
  className?: string;
};

export function TimeNavigation({
  onJumpToTime,
  className,
}: TimeNavigationProps) {
  const timeSlots = [
    { hour: 6, label: "06:00" },
    { hour: 12, label: "12:00" },
    { hour: 15, label: "15:00" },
    { hour: 18, label: "18:00" },
    { hour: 21, label: "21:00" },
  ];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {timeSlots.map((slot) => (
        <Button
          key={slot.label}
          onClick={() => onJumpToTime(slot.hour)}
          size="sm"
          variant="outline"
        >
          {slot.label}
        </Button>
      ))}
    </div>
  );
}
