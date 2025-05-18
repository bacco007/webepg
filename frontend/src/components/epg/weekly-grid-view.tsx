"use client"

import { Badge } from "@/components/ui/badge"

import React from "react"

import { useMemo } from "react"
import { format } from "date-fns"
import { Tv } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate, parseISODate } from "@/lib/date-utils"
import { getProgramCategoryIcon, getSpecialTitleClass, isPlaceholderProgram } from "@/components/epg/utils"
import { ProgramDialog } from "@/components/epg/program-dialog"
import type { Program } from "@/components/epg/types"

// Add import for decodeHtml at the top of the file
import { decodeHtml } from "@/lib/html-utils"

// Improved layout constants
const timeSlotHeight = 60 // Height of each 30-minute slot in pixels
const timeColumnWidth = 60 // Width of time column in pixels
const gridGap = 4 // Gap between grid items in pixels
const headerHeight = 48 // Height of the sticky header

// Default colors
const defaultColorClasses = ["bg-primary/20 hover:bg-primary/30 text-primary-foreground"]
const liveColor =
  "bg-[hsl(var(--program-current))] hover:bg-[hsl(var(--program-current))] text-[hsl(var(--program-current-foreground))]"
const pastColor =
  "bg-[hsl(var(--program-past))] hover:bg-[hsl(var(--program-past))] text-[hsl(var(--program-past-foreground))]"
const upNextColor = "bg-[hsl(var(--program-new))] hover:bg-[hsl(var(--program-new))] text-white"

type DensityOption = "compact" | "normal" | "detailed"

interface WeeklyGridViewProps {
  days: Date[]
  programs: Program[]
  startDayIndex: number
  visibleDays: number
  now: Date
  filteredCategory: string | null
  showPastPrograms: boolean
  searchTerm: string
  useCategories: boolean
  density: DensityOption
  categoryColors: { [key: string]: string }
  getProgramStatus: (program: Program) => { isLive: boolean; hasEnded: boolean; isUpNext: boolean }
  calculateProgress: (start: string, end: string) => number
  gridRef: React.RefObject<HTMLDivElement | null>
}

export function WeeklyGridView({
  days,
  programs,
  startDayIndex,
  visibleDays,
  now,
  filteredCategory,
  showPastPrograms,
  searchTerm,
  useCategories,
  density,
  categoryColors,
  getProgramStatus,
  calculateProgress,
  gridRef,
}: WeeklyGridViewProps) {
  // Generate time slots array
  const timeSlots = useMemo(() => Array.from({ length: 48 }, (_, index) => index * 30), [])

  // Calculate event style for grid view
  const getEventStyle = (program: Program): React.CSSProperties => {
    if (!days.length) return {}

    const programStartDate = parseISODate(program.start_time)
    const programEndDate = parseISODate(program.end_time)

    // Calculate day index
    const startDay = new Date(days[0])
    startDay.setHours(0, 0, 0, 0)
    const programDay = new Date(programStartDate)
    programDay.setHours(0, 0, 0, 0)
    const dayDiff = Math.floor((programDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000))

    if (dayDiff < startDayIndex || dayDiff >= startDayIndex + visibleDays) {
      return { display: "none" }
    }

    const startMinutes = programStartDate.getHours() * 60 + programStartDate.getMinutes()
    const endMinutes = programEndDate.getHours() * 60 + programEndDate.getMinutes()
    const duration = endMinutes - startMinutes
    const startRow = Math.floor(startMinutes / 30) + 2
    const endRow = Math.ceil(endMinutes / 30) + 2
    const rowSpan = endRow - startRow
    const endTime = programEndDate.getMinutes()
    const gG = [0, 30].includes(endTime) ? 0 : -4

    return {
      gridColumnStart: dayDiff - startDayIndex + 2,
      gridColumnEnd: dayDiff - startDayIndex + 3,
      gridRowStart: startRow,
      gridRowEnd: endRow,
      marginTop: `${(startMinutes % 30) * (timeSlotHeight / 30)}px`,
      height: `calc(${duration * (timeSlotHeight / 30)}px + ${(rowSpan - 1) * gridGap + gG}px)`,
      width: "100%",
    }
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="w-full h-full overflow-auto" ref={gridRef}>
        <div className="p-4 min-w-fit">
          <div
            className="relative gap-1 grid"
            style={{
              gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays}, minmax(200px, 1fr))`,
            }}
            role="grid"
            aria-label="Weekly EPG Grid"
          >
            {/* Time column header */}
            <div
              className="top-0 left-0 z-20 sticky flex justify-center items-center bg-background/95 supports-backdrop-filter:bg-background/60 backdrop-blur-sm px-2 py-1 border-r border-b rounded-tl-md font-semibold text-sm"
              style={{
                width: `${timeColumnWidth}px`,
                height: `${headerHeight}px`,
              }}
            >
              Time
            </div>

            {/* Day headers */}
            {days.slice(startDayIndex, startDayIndex + visibleDays).map((day, index) => (
              <div
                key={`day-${index}`}
                className={cn(
                  "bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 flex items-center justify-center border-b px-2 py-1 text-center text-sm font-semibold backdrop-blur-sm",
                  index === visibleDays - 1 ? "rounded-tr-md" : "border-r",
                )}
                style={{ height: `${headerHeight}px` }}
              >
                {format(day, "EEE, MMM d")}
              </div>
            ))}

            {/* Time slots and grid cells */}
            {timeSlots.map((minutes, slotIndex) => (
              <React.Fragment key={minutes}>
                {/* Time label */}
                <div
                  className={cn(
                    "bg-background/95 supports-backdrop-filter:bg-background/60 text-muted-foreground sticky left-0 z-10 flex items-center justify-end border-r px-2 py-1 text-xs backdrop-blur-sm",
                    slotIndex === timeSlots.length - 1 ? "rounded-bl-md" : "border-b",
                  )}
                  style={{
                    width: `${timeColumnWidth}px`,
                    height: `${timeSlotHeight}px`,
                  }}
                >
                  {formatDate(new Date(0, 0, 0, Math.floor(minutes / 60), minutes % 60), "HH:mm")}
                </div>

                {/* Grid cells */}
                {Array.from({ length: visibleDays }).map((_, dayIndex) => {
                  const isCurrentTime = () => {
                    if (!days[startDayIndex + dayIndex]) return false

                    const currentDay = new Date(days[startDayIndex + dayIndex])
                    const today = new Date(now)

                    // Check if same day
                    if (
                      currentDay.getDate() !== today.getDate() ||
                      currentDay.getMonth() !== today.getMonth() ||
                      currentDay.getFullYear() !== today.getFullYear()
                    ) {
                      return false
                    }

                    const currentHour = now.getHours()
                    const currentMinute = now.getMinutes()
                    const slotStartHour = Math.floor(minutes / 60)
                    const slotStartMinute = minutes % 60
                    const slotEndHour = Math.floor((minutes + 30) / 60)
                    const slotEndMinute = (minutes + 30) % 60

                    // Check if current time is within this slot
                    if (
                      (currentHour > slotStartHour ||
                        (currentHour === slotStartHour && currentMinute >= slotStartMinute)) &&
                      (currentHour < slotEndHour || (currentHour === slotEndHour && currentMinute < slotEndMinute))
                    ) {
                      return true
                    }

                    return false
                  }

                  return (
                    <div
                      key={`timeslot-${dayIndex}-${minutes}`}
                      className={cn(
                        "relative border-t",
                        dayIndex === visibleDays - 1
                          ? slotIndex === timeSlots.length - 1
                            ? "rounded-br-md"
                            : "border-b"
                          : "border-r border-b",
                        isCurrentTime() && "bg-muted/30",
                      )}
                      style={{
                        height: `${timeSlotHeight}px`,
                      }}
                    >
                      {isCurrentTime() && (
                        <div
                          className="z-10 absolute inset-0 shadow-[0_0_8px_rgba(var(--time-indicator),0.5)] border-[hsl(var(--time-indicator))] border-l-2"
                          style={{
                            left: `${((now.getMinutes() % 30) / 30) * 100}%`,
                          }}
                        >
                          <div className="top-0 right-0 absolute bg-[hsl(var(--time-indicator))] shadow-[0_0_8px_rgba(var(--time-indicator),0.5)] ml-1 px-1 py-0.5 rounded-sm text-[10px] text-white translate-x-full">
                            {formatDate(now, "HH:mm")}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}

            {/* Program events */}
            {programs.map((program) => {
              const { isLive, hasEnded, isUpNext } = getProgramStatus(program)

              // Check if program is new or premiere
              const isPremiere =
                program.premiere ||
                (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("premiere")))
              const isNew =
                program.new ||
                (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("new")))

              // Skip if we're not showing past programs and this has ended
              if (!showPastPrograms && hasEnded) {
                return null
              }

              // Skip if there's a category filter and this doesn't match
              if (filteredCategory && !program.categories?.includes(filteredCategory)) {
                return null
              }

              // Skip if there's a search term and this doesn't match
              if (
                searchTerm &&
                !program.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (!program.subtitle || !program.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) &&
                (!program.description || !program.description.toLowerCase().includes(searchTerm.toLowerCase()))
              ) {
                return null
              }

              // Check if program has special styling
              const specialTitleClass = getSpecialTitleClass(program.title)
              const isPlaceholder = isPlaceholderProgram(program.title)
              // const isPremiere = program.is_premiere === "1"
              // const isNew = program.is_new === "1"

              // Determine program color based on status and settings
              let programColor = useCategories
                ? program.categories && program.categories[0] && categoryColors[program.categories[0]]
                  ? categoryColors[program.categories[0]]
                  : defaultColorClasses[0]
                : defaultColorClasses[0]

              // Apply special styling for placeholder programs
              if (specialTitleClass) {
                programColor = specialTitleClass
              } else if (isLive) {
                programColor = liveColor
              } else if (hasEnded) {
                programColor = pastColor
              } else if (isUpNext) {
                programColor = upNextColor
              }

              // Get category icon
              const CategoryIcon = getProgramCategoryIcon(program.categories || [])

              // For placeholder programs, just render a div without the dialog
              if (isPlaceholder) {
                return (
                  <div
                    key={program.guideid}
                    style={getEventStyle(program)}
                    className={cn(
                      "absolute overflow-hidden rounded-md p-2 text-xs text-white shadow-md",
                      programColor,
                      "cursor-default",
                      density === "compact" ? "p-1" : density === "detailed" ? "p-3" : "p-2",
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`${decodeHtml(program.title)} from ${formatDate(parseISODate(program.start_time), "HH:mm")} to ${formatDate(
                      parseISODate(program.end_time),
                      "HH:mm",
                    )}`}
                  >
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="font-semibold truncate">{decodeHtml(program.title)}</div>
                          <div className="opacity-90 ml-1 text-[10px] whitespace-nowrap">
                            {formatDate(parseISODate(program.start_time), "HH:mm")} -{" "}
                            {formatDate(parseISODate(program.end_time), "HH:mm")}
                          </div>
                        </div>
                        {program.subtitle && program.subtitle !== "N/A" && (
                          <div className="opacity-80 text-[10px] truncate italic">{decodeHtml(program.subtitle)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <ProgramDialog
                  key={program.guideid}
                  program={program}
                  trigger={
                    <div
                      style={getEventStyle(program)}
                      className={cn(
                        "absolute overflow-hidden rounded-md p-2 text-xs shadow-md transition-all",
                        programColor,
                        hasEnded && "opacity-70",
                        "cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
                        density === "compact" ? "p-1" : density === "detailed" ? "p-3" : "p-2",
                        // Add styling for premiere and new programs
                        isPremiere && "border-l-[3px] border-l-[hsl(var(--program-premiere))]",
                        isNew && !isPremiere && "border-l-[3px] border-l-[hsl(var(--program-new))]",
                        isLive && "ring-1 ring-[hsl(var(--program-current-border))]",
                      )}
                      role="button"
                      tabIndex={0}
                      aria-label={`${decodeHtml(program.title)} from ${formatDate(parseISODate(program.start_time), "HH:mm")} to ${formatDate(
                        parseISODate(program.end_time),
                        "HH:mm",
                      )}`}
                    >
                      <div className="flex flex-col justify-between h-full">
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="font-semibold truncate">{decodeHtml(program.title)}</div>
                            <div className="opacity-90 ml-1 text-[10px] whitespace-nowrap">
                              {formatDate(parseISODate(program.start_time), "HH:mm")} -{" "}
                              {formatDate(parseISODate(program.end_time), "HH:mm")}
                            </div>
                          </div>
                          {program.subtitle && program.subtitle !== "N/A" && (
                            <div className="opacity-80 text-[10px] truncate italic">{decodeHtml(program.subtitle)}</div>
                          )}
                          {density === "detailed" && program.description && (
                            <div className="opacity-80 mt-1 text-[10px] line-clamp-2">
                              {decodeHtml(program.description)}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          {program.categories && program.categories[0] && density !== "compact" && (
                            <div className="flex items-center gap-1">
                              {React.createElement(CategoryIcon || Tv, { className: "w-3 h-3" })}
                              <span className="text-[9px]">{program.categories[0]}</span>
                            </div>
                          )}
                          <div className="flex gap-1 ml-auto">
                            {isLive && (
                              <Badge className="px-1 py-0 bg-[hsl(var(--program-current-border))] font-medium text-[9px] text-white">
                                LIVE
                              </Badge>
                            )}
                            {isUpNext && (
                              <Badge
                                variant="secondary"
                                className="bg-[hsl(var(--program-new))]/20 px-1 py-0 text-[9px]"
                              >
                                UP NEXT
                              </Badge>
                            )}
                            {isPremiere && (
                              <Badge className="bg-[hsl(var(--program-premiere))] px-1 py-0 font-medium text-[9px] text-white">
                                PREMIERE
                              </Badge>
                            )}
                            {isNew && !isPremiere && !isUpNext && (
                              <Badge className="bg-[hsl(var(--program-new))] px-1 py-0 font-medium text-[9px] text-white">
                                NEW
                              </Badge>
                            )}
                            {program.rating && program.rating !== "N/A" && density === "detailed" && (
                              <Badge variant="outline" className="px-1 py-0 text-[9px]">
                                {program.rating}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar for currently airing programs */}
                      {isLive && (
                        <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                          <div
                            className="right-0 bottom-0 left-0 absolute bg-[hsl(var(--program-current-border))/30] h-1.5"
                            style={{
                              clipPath: `polygon(0 0, ${calculateProgress(program.start_time, program.end_time)}% 0, ${calculateProgress(program.start_time, program.end_time)}% 100%, 0 100%)`,
                              borderBottomLeftRadius: "0.375rem",
                              borderBottomRightRadius: "0.375rem",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  }
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
