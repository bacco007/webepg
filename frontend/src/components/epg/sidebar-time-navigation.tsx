"use client";

import { ChevronDown, Clock } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SidebarTimeNavigationProps {
  onJumpToTime: (hour: number) => void;
}

export function SidebarTimeNavigation({
  onJumpToTime,
}: SidebarTimeNavigationProps) {
  const [isOpen, setIsOpen] = useState(true);

  const timeSlots = [
    { label: "Now", hour: new Date().getHours() },
    { label: "06:00", hour: 6 },
    { label: "12:00", hour: 12 },
    { label: "15:00", hour: 15 },
    { label: "18:00", hour: 18 },
    { label: "21:00", hour: 21 },
  ];

  return (
    <Collapsible className="border-b" onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">
            Time Navigation
          </span>
          <Badge className="font-normal text-xs" variant="outline">
            Jump
          </Badge>
        </div>
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="size-4 rotate-180 text-muted-foreground transition-transform" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="slide-in-from-top-2 animate-in duration-200">
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          {timeSlots.map((slot) => (
            <Button
              className={cn(
                "justify-start",
                slot.label === "Now" &&
                  "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md"
              )}
              key={slot.label}
              onClick={() => onJumpToTime(slot.hour)}
              size="sm"
              variant={slot.label === "Now" ? "default" : "outline"}
            >
              <Clock
                className={cn(
                  "mr-2 h-3.5 w-3.5",
                  slot.label === "Now" && "text-primary-foreground"
                )}
              />
              {slot.label}
            </Button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
