"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Tag } from "lucide-react"
import { TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatDate, parseISODate, differenceInMinutes } from "@/lib/date-utils"
import type { Program } from "./types"
import { decodeHtml } from "@/lib/html-utils"

export type ProgramStatus = "now-playing" | "upcoming" | "ended"

interface ProgramTooltipProps {
  program: Program
  status: ProgramStatus
  progressPercentage?: number
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  className?: string
}

export function ProgramTooltip({
  program,
  status,
  progressPercentage = 0,
  side = "top",
  sideOffset = 5,
  className,
}: ProgramTooltipProps) {
  // Parse times
  const startTime = parseISODate(program.start_time)
  const endTime = parseISODate(program.end_time)

  // Format date and calculate duration
  const formattedDate = formatDate(startTime, "EEE, MMM do")
  const duration = `${formatDate(startTime, "HH:mm")}-${formatDate(endTime, "HH:mm")}`
  const durationMinutes = Math.round(differenceInMinutes(endTime, startTime))

  // Check if program is new or premiere
  const isPremiere =
    program.premiere || (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("premiere")))
  const isNew =
    program.new || (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("new")))

  // Check if subtitle is valid
  const hasValidSubtitle = program.subtitle && program.subtitle !== "N/A"

  return (
    <TooltipContent
      side={side}
      className={cn("max-w-md p-0 z-[1000] shadow-lg border-0", className)}
      sideOffset={sideOffset}
    >
      <div className="rounded-md overflow-hidden">
        {/* Header with status indicator - improved contrast */}
        <div
          className={cn(
            "p-3 border-b",
            status === "now-playing"
              ? "bg-[hsl(var(--primary))] text-white" // Darker blue with white text
              : status === "ended"
                ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" // Muted background with dark text
                : "bg-[hsl(var(--accent))] text-white", // Accent color with white text
          )}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {status === "now-playing" && (
                  <Badge
                    variant="secondary"
                    className="bg-white px-2 py-0.5 font-bold text-[10px] text-[hsl(var(--primary))]"
                  >
                    NOW PLAYING
                  </Badge>
                )}
                {isPremiere && (
                  <Badge
                    variant="secondary"
                    className="bg-white px-2 py-0.5 font-bold text-[10px] text-[hsl(var(--program-premiere))]"
                  >
                    PREMIERE
                  </Badge>
                )}
                {isNew && !isPremiere && (
                  <Badge
                    variant="secondary"
                    className="bg-white px-2 py-0.5 font-bold text-[10px] text-[hsl(var(--program-new))]"
                  >
                    NEW
                  </Badge>
                )}
              </div>
              <h4 className="font-bold text-lg leading-tight">{decodeHtml(program.title)}</h4>
              {hasValidSubtitle && <p className="opacity-90 font-medium text-sm">{decodeHtml(program.subtitle || "")}</p>}
            </div>
            {program.rating && program.rating !== "N/A" && (
              <Badge
                variant="outline"
                className="bg-white px-2 py-1 border-2 font-bold text-[hsl(var(--foreground))] text-xs"
              >
                {program.rating}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 bg-card p-3">
          {/* Time and duration */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <span className="font-medium">{duration}</span>
              <span className="text-muted-foreground">({durationMinutes} min)</span>
            </div>
            {program.categories && program.categories.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Tag className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                <span className="font-medium">{program.categories.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Progress bar for currently airing */}
          {status === "now-playing" && progressPercentage > 0 && (
            <div className="bg-muted rounded-full w-full h-2 overflow-hidden">
              <div className="bg-[hsl(var(--primary))] h-full" style={{ width: `${progressPercentage}%` }} />
            </div>
          )}

          {/* Description */}
          {program.description && program.description !== "N/A" && (
            <div className="pt-1 border-t">
              <p className="text-[hsl(var(--foreground))] text-sm">{decodeHtml(program.description)}</p>
            </div>
          )}
        </div>
      </div>
    </TooltipContent>
  )
}
