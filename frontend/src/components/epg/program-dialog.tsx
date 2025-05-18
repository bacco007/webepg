"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Clock, Tag, X, Circle } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate, parseISODate, differenceInMinutes } from "@/lib/date-utils"
import type { Program } from "@/components/epg/types"
import type { ProgramStatus } from "./program-tooltip"
// Add import for decodeHtml at the top of the file
import { decodeHtml } from "@/lib/html-utils"

interface ProgramDialogProps {
  program: Program
  trigger: React.ReactNode
  onOpenChange?: (open: boolean) => void
}

export function ProgramDialog({ program, trigger, onOpenChange }: ProgramDialogProps) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (onOpenChange) {
      onOpenChange(newOpen)
    }
  }

  // Parse times
  const startTime = parseISODate(program.start_time)
  const endTime = parseISODate(program.end_time)
  const now = new Date()

  // Determine program status
  const isLive = now > startTime && now < endTime
  const hasEnded = now > endTime
  const isUpNext = !isLive && !hasEnded && startTime.getTime() - now.getTime() <= 30 * 60 * 1000

  const status: ProgramStatus = isLive ? "now-playing" : hasEnded ? "ended" : "upcoming"

  // Format date and calculate duration
  const formattedDate = formatDate(startTime, "EEEE, MMMM d, yyyy")
  const duration = `${formatDate(startTime, "HH:mm")}-${formatDate(endTime, "HH:mm")}`
  const durationMinutes = Math.round(differenceInMinutes(endTime, startTime))

  // Check if program is new or premiere
  const isPremiere =
    program.premiere || (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("premiere")))
  const isNew =
    program.new || (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("new")))

  // Check if subtitle is valid
  const hasValidSubtitle = program.subtitle && program.subtitle !== "N/A"

  // Calculate progress percentage if currently airing
  const progressPercentage = isLive
    ? Math.min(100, ((now.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="shadow-lg p-0 border-0 max-w-md">
        <div className="rounded-md overflow-hidden">
          {/* Header with status indicator - improved contrast */}
          <div
            className={cn(
              "p-4 border-b relative",
              status === "now-playing"
                ? "bg-[hsl(var(--primary))] text-white" // Darker blue with white text
                : status === "ended"
                  ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" // Muted background with dark text
                  : "bg-[hsl(var(--accent))] text-white", // Accent color with white text
            )}
          >
            <DialogClose className="top-2 right-2 absolute data-[state=open]:bg-accent opacity-70 hover:opacity-100 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring ring-offset-background focus:ring-offset-2 data-[state=open]:text-muted-foreground transition-opacity disabled:pointer-events-none">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="flex justify-between items-start mb-2 pr-6">
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
                {/* Update the title display */}
                <h4 className="font-bold text-xl leading-tight">{decodeHtml(program.title)}</h4>
                {/* Update the subtitle display */}
                {hasValidSubtitle && <p className="opacity-90 font-medium text-sm">{decodeHtml(program.subtitle || '')}</p>}
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
          <div className="space-y-4 bg-card p-4">
            {/* Time and duration */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-[hsl(var(--primary))]" />
                <span className="font-medium">{duration}</span>
                <span className="text-muted-foreground">({durationMinutes} min)</span>
              </div>
              {program.categories && program.categories.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Tag className="w-4 h-4 text-[hsl(var(--primary))]" />
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
            {/* Update the description display */}
            {program.description && program.description !== "N/A" && (
              <div className="pt-2 border-t">
                <p className="text-[hsl(var(--foreground))] text-sm">{decodeHtml(program.description || "")}</p>
              </div>
            )}

            {/* Channel info if available */}
            {program.channel && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Circle className="w-4 h-4 text-[hsl(var(--primary))]" />
                <span className="font-medium text-sm">{program.channel}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
