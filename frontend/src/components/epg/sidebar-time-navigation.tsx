"use client"

import { useState } from "react"
import { ChevronDown, Clock } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SidebarTimeNavigationProps {
  onJumpToTime: (hour: number) => void
}

export function SidebarTimeNavigation({ onJumpToTime }: SidebarTimeNavigationProps) {
  const [isOpen, setIsOpen] = useState(true)

  const timeSlots = [
    { label: "Now", hour: new Date().getHours() },
    { label: "06:00", hour: 6 },
    { label: "12:00", hour: 12 },
    { label: "15:00", hour: 15 },
    { label: "18:00", hour: 18 },
    { label: "21:00", hour: 21 },
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b">
      <CollapsibleTrigger className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">Time Navigation</span>
          <Badge variant="outline" className="font-normal text-xs">
            Jump
          </Badge>
        </div>
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="size-4 text-muted-foreground rotate-180 transition-transform" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="slide-in-from-top-2 animate-in duration-200">
        <div className="gap-2 grid grid-cols-2 px-4 pb-3">
          {timeSlots.map((slot) => (
            <Button
              key={slot.label}
              variant={slot.label === "Now" ? "default" : "outline"}
              size="sm"
              onClick={() => onJumpToTime(slot.hour)}
              className={cn(
                "justify-start",
                slot.label === "Now" && "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md",
              )}
            >
              <Clock className={cn("mr-2 h-3.5 w-3.5", slot.label === "Now" && "text-primary-foreground")} />
              {slot.label}
            </Button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
