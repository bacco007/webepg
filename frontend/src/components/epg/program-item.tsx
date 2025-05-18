"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { formatDate, parseISODate } from "@/lib/date-utils"
import { Star, Circle, X } from "lucide-react"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Program } from "./types"
import { ProgramTooltip, type ProgramStatus } from "./program-tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { getSpecialTitleClass, isPlaceholderProgram } from "./utils"
import { decodeHtml } from "@/lib/html-utils"

interface ProgramItemProps {
  program: Program & {
    left: number
    width: number
    isPast?: boolean
    isCurrentlyAiring?: boolean
    progressPercentage?: number
  }
  left: number
  width: number
  isPast?: boolean
  isCurrentlyAiring?: boolean
  progressPercentage?: number
  showDetails?: boolean
  onSelect?: (program: Program) => void
  isSelected?: boolean
}

export function ProgramItem({
  program,
  left,
  width,
  isPast = false,
  isCurrentlyAiring = false,
  progressPercentage = 0,
  showDetails = true,
  onSelect,
  isSelected = false,
}: ProgramItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTitleTruncated, setIsTitleTruncated] = useState(false)
  const [isTimeTruncated, setIsTimeTruncated] = useState(false)
  const [textOffset, setTextOffset] = useState(0)
  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const startTime = parseISODate(program.start_time)
  const endTime = parseISODate(program.end_time)

  const formattedStartTime = formatDate(startTime, "HH:mm")
  const formattedEndTime = formatDate(endTime, "HH:mm")
  const duration = `${formattedStartTime} - ${formattedEndTime}`

  // Determine program status for tooltip
  const programStatus: ProgramStatus = isCurrentlyAiring ? "now-playing" : isPast ? "ended" : "upcoming"

  // Determine if the program is too narrow to show full content
  const isNarrow = width < 100
  const isVeryNarrow = width < 50

  // Check if subtitle is "N/A" and should be omitted
  const hasValidSubtitle = program.subtitle && program.subtitle !== "N/A"

  // Check if program is new or premiere
  const isPremiere =
    program.premiere || (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("premiere")))
  const isNew =
    program.new || (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("new")))

  // Check if program has special styling
  const specialTitleClass = getSpecialTitleClass(program.title)
  const isPlaceholder = isPlaceholderProgram(program.title)

  // Calculate text offset when program overlaps with channel sidebar
  useEffect(() => {
    if (!containerRef.current) return

    // Get the container's bounding rectangle
    const rect = containerRef.current.getBoundingClientRect()

    // Check if the program starts before the visible area (negative left position)
    if (left < 0) {
      // Calculate how much of the program is hidden
      const hiddenWidth = Math.abs(left)

      // Set text offset to make it visible in the visible portion
      setTextOffset(Math.min(hiddenWidth, width / 2))
    } else {
      setTextOffset(0)
    }
  }, [left, width])

  // Check if title or time is truncated
  useEffect(() => {
    if (!titleRef.current || !timeRef.current) return

    // Check if title is truncated
    setIsTitleTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth)

    // Check if time is truncated
    setIsTimeTruncated(timeRef.current.scrollWidth > timeRef.current.clientWidth)
  }, [width, program.title, duration])

  // Determine background color based on program status
  let bgColor = ""
  let textColor = ""
  let hoverBgColor = "hover:bg-accent"

  // Apply special styling for placeholder programs
  if (specialTitleClass) {
    bgColor = specialTitleClass
    textColor = ""
    hoverBgColor = ""
  } else if (isPast) {
    bgColor = "bg-[hsl(var(--program-past))]"
    textColor = "text-[hsl(var(--program-past-foreground))]"
    hoverBgColor = "hover:bg-[hsl(var(--program-past))]"
  } else if (isCurrentlyAiring) {
    bgColor = "bg-[hsl(var(--program-current))]"
    textColor = "text-[hsl(var(--program-current-foreground))] font-medium"
    hoverBgColor = "hover:bg-[hsl(var(--program-current))]"
  }

  // Determine if we should show expanded view on hover
  const shouldExpandOnHover = isTitleTruncated || isTimeTruncated || isVeryNarrow || (hasValidSubtitle && isNarrow)

  // Handle program click for mobile
  const handleProgramClick = () => {
    if (isMobile) {
      if (onSelect && !isPlaceholder) {
        onSelect(program)
      } else {
        setShowMobileTooltip(!showMobileTooltip)
      }
    }
  }

  // Close mobile tooltip
  const closeMobileTooltip = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMobileTooltip(false)
  }

  // Determine if we should use tooltip or direct click
  const useTooltip = !isMobile && showDetails && !isPlaceholder

  // Render the program item
  const programItem = (
    <div
      ref={containerRef}
      className={cn("absolute top-0 h-full cursor-pointer", isSelected && "ring-2 ring-primary ring-offset-1")}
      style={{
        left: `${left}px`,
        width: `${Math.max(width - 2, 10)}px`, // Subtract 2px for horizontal gap
        zIndex: isHovered || isSelected || showMobileTooltip ? 100 : isPast ? 1 : isCurrentlyAiring ? 2 : 1,
        padding: "1px 1px", // 1px padding on all sides (halved from 2px)
        height: "calc(100% - 2px)", // Adjust height to account for padding
      }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={handleProgramClick}
      data-program-id={program.guideid}
      data-program-title={program.title}
      aria-label={`${decodeHtml(program.title)} from ${formatDate(parseISODate(program.start_time), "HH:mm")} to ${formatDate(
        parseISODate(program.end_time),
        "HH:mm",
      )}`}
    >
      <Card
        ref={cardRef}
        className={cn(
          "h-full p-2 overflow-hidden shadow-sm transition-all relative",
          bgColor,
          textColor,
          !isMobile && !isPlaceholder && hoverBgColor,
          // Add a subtle left border for new or premiere programs
          isPremiere && "border-l-[3px] border-l-[hsl(var(--program-premiere))]",
          isNew && !isPremiere && "border-l-[3px] border-l-[hsl(var(--program-new))]",
          isCurrentlyAiring && !isPlaceholder && "ring-1 ring-[hsl(var(--program-current-border))]",
          // Add active state for mobile
          isMobile && showMobileTooltip && "bg-accent text-accent-foreground",
        )}
        style={{
          ...((isHovered && shouldExpandOnHover) || (isMobile && showMobileTooltip && shouldExpandOnHover)
            ? {
                position: "absolute",
                width: "200px",
                zIndex: 999, // Much higher z-index to ensure it's always on top
                height: "auto",
                minHeight: "100%",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              }
            : {}),
        }}
      >
        <div className="flex flex-col justify-between h-full" style={{ paddingLeft: `${textOffset}px` }}>
          {/* Title with indicators */}
          <div className="flex items-center gap-1">
            {/* Show a dot for currently airing programs */}
            {isCurrentlyAiring && !isVeryNarrow && !isPlaceholder && (
              <Circle className="flex-shrink-0 mr-0.5 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))] w-2 h-2" />
            )}

            <div ref={titleRef} className="flex-1 text-xs truncate">
              {isVeryNarrow && !isHovered && !showMobileTooltip ? "..." : decodeHtml(program.title)}
            </div>

            {/* Show indicators for new/premiere if there's space */}
            {!isVeryNarrow && !isPlaceholder && (
              <>
                {isPremiere && <Star className="flex-shrink-0 w-3 h-3 text-[hsl(var(--program-premiere))]" />}
                {isNew && !isPremiere && (
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 ml-1 px-1 border-[hsl(var(--program-new))] h-4 font-bold text-[8px] text-[hsl(var(--program-new))]"
                  >
                    NEW
                  </Badge>
                )}
              </>
            )}

            {/* Close button for mobile expanded view */}
            {isMobile && showMobileTooltip && shouldExpandOnHover && (
              <button
                onClick={closeMobileTooltip}
                className="top-1 right-1 absolute bg-muted/80 p-0.5 rounded-full text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Show subtitle if valid and enough space */}
          {(!isNarrow || isHovered || (isMobile && showMobileTooltip)) && hasValidSubtitle && (
            <div className={`text-[10px] ${isPast ? "text-muted-foreground/70" : "text-muted-foreground"} truncate`}>
              {decodeHtml(program.subtitle || "")}
            </div>
          )}

          {/* Show time */}
          <div ref={timeRef} className="flex items-center mt-auto text-[10px]">
            <span className="truncate">{duration}</span>
            {program.rating && program.rating !== "N/A" && (
              <span className="bg-muted ml-1 px-1 rounded text-[9px] shrink-0">{program.rating}</span>
            )}
          </div>
        </div>

        {/* Progress bar for currently airing programs - don't show for placeholder programs */}
        {isCurrentlyAiring && !isPlaceholder && (
          <div className="right-0 bottom-0 left-0 absolute rounded-b-md h-1.5 overflow-hidden">
            <div
              className="bg-[hsl(var(--program-current-border))] h-full"
              style={{
                width: `${progressPercentage}%`,
                opacity: 0.5,
              }}
            />
          </div>
        )}
      </Card>

      {/* Mobile tooltip - shown directly in the UI instead of as a hover tooltip */}
      {isMobile && showMobileTooltip && !useTooltip && showDetails && !isPlaceholder && (
        <div
          className="top-full left-0 z-[1000] absolute mt-2 w-[280px] max-w-[95vw]"
          style={{
            // Ensure tooltip doesn't go off-screen to the right
            left: left + 280 > window.innerWidth ? "auto" : left,
            right: left + 280 > window.innerWidth ? "0" : "auto",
          }}
        >
          <ProgramTooltip
            program={program}
            status={programStatus}
            progressPercentage={progressPercentage}
            side="top"
            className="shadow-xl"
          />
        </div>
      )}
    </div>
  )

  // For non-mobile or when not showing mobile tooltip, wrap in Tooltip
  if (useTooltip && showDetails) {
    return (
      <TooltipProvider>
        <Tooltip open={isHovered}>
          <TooltipTrigger asChild>{programItem}</TooltipTrigger>
          <ProgramTooltip program={program} status={programStatus} progressPercentage={progressPercentage} side="top" />
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Otherwise just return the program item
  return programItem
}
