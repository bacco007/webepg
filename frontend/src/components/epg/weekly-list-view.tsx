"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Tv } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate, parseISODate } from "@/lib/date-utils"
import { getProgramCategoryIcon, getSpecialTitleClass, isPlaceholderProgram } from "@/components/epg/utils"
import { ProgramDialog } from "@/components/epg/program-dialog"
import type { Program } from "@/components/epg/types"

// Add import for decodeHtml at the top of the file
import { decodeHtml } from "@/lib/html-utils"

type DensityOption = "compact" | "normal" | "detailed"

interface WeeklyListViewProps {
  days: Date[]
  selectedDay: number
  setSelectedDay: (day: number) => void
  groupedPrograms: Record<string, Program[]>
  showTimeBlocks: boolean
  getProgramStatus: (program: Program) => { isLive: boolean; hasEnded: boolean; isUpNext: boolean }
  calculateProgress: (start: string, end: string) => number
  density: DensityOption
  filteredCategory: string | null
  showPastPrograms: boolean
  setShowPastPrograms: (show: boolean) => void
}

export function WeeklyListView({
  days,
  selectedDay,
  setSelectedDay,
  groupedPrograms,
  showTimeBlocks,
  getProgramStatus,
  calculateProgress,
  density,
  filteredCategory,
  showPastPrograms,
  setShowPastPrograms,
}: WeeklyListViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Day selector tabs */}
      <div className="bg-background px-4 border-b">
        <ScrollArea className="w-full">
          <div className="flex">
            {days.map((day, index) => (
              <Button
                key={index}
                variant={selectedDay === index ? "default" : "ghost"}
                className="px-4 py-2 border-transparent border-b-2 rounded-none font-medium"
                style={{
                  borderBottomColor: selectedDay === index ? "hsl(var(--primary))" : "transparent",
                }}
                onClick={() => setSelectedDay(index)}
              >
                {formatDate(day, "EEE, MMM d")}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Program list */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {Object.entries(groupedPrograms).length > 0 ? (
            Object.entries(groupedPrograms).map(([blockName, programs]) => (
              <div key={blockName} className="mb-6">
                {showTimeBlocks && <h3 className="mb-2 pb-1 border-b font-semibold text-lg">{blockName}</h3>}
                <div className="divide-y">
                  {programs.map((program) => {
                    const { isLive, hasEnded, isUpNext } = getProgramStatus(program)
                    const timeRange = `${formatDate(parseISODate(program.start_time), "HH:mm")} - ${formatDate(
                      parseISODate(program.end_time),
                      "HH:mm",
                    )}`

                    // Get category icon
                    const CategoryIcon = getProgramCategoryIcon(program.categories || [])

                    // Check if program has special styling
                    const specialTitleClass = getSpecialTitleClass(program.title)
                    const isPlaceholder = isPlaceholderProgram(program.title)

                    // For placeholder programs, render a div without the dialog
                    if (isPlaceholder) {
                      return (
                        <div
                          key={program.guideid}
                          className={cn(
                            "flex items-start gap-3 rounded-md p-3",
                            specialTitleClass,
                            density === "compact" ? "py-2" : density === "detailed" ? "py-4" : "py-3",
                          )}
                        >
                          {/* Time column */}
                          <div className="flex flex-col items-center w-16 text-center">
                            <div className="font-medium text-sm">
                              {formatDate(parseISODate(program.start_time), "HH:mm")}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatDate(parseISODate(program.end_time), "HH:mm")}
                            </div>
                          </div>

                          {/* Program content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              {/* Update the title display */}
                              <h3 className={cn("font-semibold", density === "compact" ? "text-sm" : "text-base")}>
                                {decodeHtml(program.title)}
                              </h3>
                            </div>

                            {/* Update the subtitle display */}
                            {program.subtitle && program.subtitle !== "N/A" && (
                              <div className="text-muted-foreground text-sm italic">{decodeHtml(program.subtitle)}</div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-1 text-muted-foreground text-xs">
                              <span>
                                {Math.round(
                                  (parseISODate(program.end_time).getTime() -
                                    parseISODate(program.start_time).getTime()) /
                                    (1000 * 60),
                                )}{" "}
                                min
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    const isPremiere = program.title.toLowerCase().includes("premiere")
                    const isNew = program.title.toLowerCase().includes("new")

                    return (
                      <ProgramDialog
                        key={program.guideid}
                        program={program}
                        trigger={
                          <div
                            className={cn(
                              "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-3",
                              isLive && "bg-[hsl(var(--program-current))]/10",
                              isUpNext && "bg-[hsl(var(--program-new))]/10",
                              hasEnded && "bg-[hsl(var(--program-past))]/10",
                              density === "compact" ? "py-2" : density === "detailed" ? "py-4" : "py-3",
                            )}
                          >
                            {/* Time column with status indicator */}
                            <div className="relative flex flex-col items-center w-16 text-center">
                              {isLive && (
                                <div className="top-0 bottom-0 left-0 absolute bg-[hsl(var(--program-current-border))] rounded-full w-1"></div>
                              )}
                              {isUpNext && (
                                <div className="top-0 bottom-0 left-0 absolute bg-[hsl(var(--program-new))] rounded-full w-1"></div>
                              )}
                              {hasEnded && (
                                <div className="top-0 bottom-0 left-0 absolute bg-[hsl(var(--program-past-foreground))]/30 rounded-full w-1"></div>
                              )}
                              <div className="font-medium text-sm">
                                {formatDate(parseISODate(program.start_time), "HH:mm")}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatDate(parseISODate(program.end_time), "HH:mm")}
                              </div>
                              <div className="flex flex-col gap-1 mt-1">
                                {isLive && (
                                  <Badge className="bg-[hsl(var(--program-current-border))] text-[10px] text-white">
                                    LIVE
                                  </Badge>
                                )}
                                {isUpNext && (
                                  <Badge variant="outline" className="bg-[hsl(var(--program-new))]/20 text-[10px]">
                                    UP NEXT
                                  </Badge>
                                )}
                                {isPremiere && (
                                  <Badge className="bg-[hsl(var(--program-premiere))] text-[10px] text-white">
                                    PREMIERE
                                  </Badge>
                                )}
                                {isNew && !isPremiere && !isUpNext && (
                                  <Badge className="bg-[hsl(var(--program-new))] text-[10px] text-white">NEW</Badge>
                                )}
                              </div>
                            </div>

                            {/* Program content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                {/* Update the title display */}
                                <h3 className={cn("font-semibold", density === "compact" ? "text-sm" : "text-base")}>
                                  {decodeHtml(program.title)}
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                  {program.categories?.map((category, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className={cn(
                                        "text-[10px]",
                                        filteredCategory === category && "bg-primary/20",
                                        density === "compact" && "hidden sm:inline-flex",
                                      )}
                                    >
                                      <span className="flex items-center gap-1">
                                        {CategoryIcon ? (
                                          <CategoryIcon className="w-3 h-3" />
                                        ) : (
                                          <Tv className="w-3 h-3" />
                                        )}
                                        <span>{category}</span>
                                      </span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Update the subtitle display */}
                              {program.subtitle && program.subtitle !== "N/A" && (
                                <div className="text-muted-foreground text-sm italic">
                                  {decodeHtml(program.subtitle)}
                                </div>
                              )}

                              {/* Update the description display */}
                              {density !== "compact" && program.description && (
                                <div
                                  className={cn(
                                    "text-muted-foreground mt-1 text-sm",
                                    density === "detailed" ? "line-clamp-3" : "line-clamp-2",
                                  )}
                                >
                                  {decodeHtml(program.description)}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 mt-1 text-muted-foreground text-xs">
                                <span>
                                  {Math.round(
                                    (parseISODate(program.end_time).getTime() -
                                      parseISODate(program.start_time).getTime()) /
                                      (1000 * 60),
                                  )}{" "}
                                  min
                                </span>
                                {program.rating && program.rating !== "N/A" && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {program.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        }
                      />
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center py-12 text-center">
              <div className="font-medium text-lg">No programs found</div>
              <p className="text-muted-foreground">
                {filteredCategory
                  ? `No ${filteredCategory} programs found for this day.`
                  : "No programs found for this day."}
              </p>
              {!showPastPrograms && (
                <Button variant="link" onClick={() => setShowPastPrograms(true)} className="mt-2">
                  Show past programs
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
