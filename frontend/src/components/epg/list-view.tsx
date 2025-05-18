"use client"

import { useState } from "react"
import Link from "next/link"
import { Circle, Star, Music, Film, Tv, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Channel, Program } from "./types"
import { parseISODate, formatDate, isAfter, isBefore, differenceInMinutes } from "@/lib/date-utils"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProgramTooltip, type ProgramStatus } from "./program-tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { getSpecialTitleClass, isPlaceholderProgram } from "./utils"
import { decodeHtml } from "@/lib/html-utils"

interface ListViewProps {
  channels: Channel[]
  currentTime: Date
  displayNameType?: "clean" | "location" | "real"
  className?: string
  showProgramDetails?: boolean
  dataSource?: string
  onProgramSelect?: (program: Program) => void
}

// Get program category icon helper function
function getProgramCategoryIcon(categories?: string[]) {
  if (!categories || categories.length === 0) return null

  const category = categories[0]?.toLowerCase() || ""

  if (category.includes("music")) {
    return <Music className="w-3 h-3" />
  } else if (category.includes("movie") || category.includes("film")) {
    return <Film className="w-3 h-3" />
  } else if (category.includes("series") || category.includes("show")) {
    return <Tv className="w-3 h-3" />
  }

  return null
}

// Helper function to check if a channel has a valid LCN
const hasValidLCN = (channel: Channel): boolean => {
  return Boolean(channel.channel.lcn && channel.channel.lcn !== "N/A")
}

// Helper function to get channel name
const getChannelName = (channel: Channel, displayNameType: "clean" | "location" | "real"): string => {
  return channel.channel.name[displayNameType] || channel.channel.name.clean
}

export function ListView({
  channels,
  currentTime,
  displayNameType = "clean",
  className,
  showProgramDetails = true,
  dataSource = "xmlepg_FTASYD",
  onProgramSelect,
}: ListViewProps) {
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({})
  const isMobile = useIsMobile()

  // Sort channels by channel number then name
  const sortedChannels = [...channels].sort((a, b) => {
    // Check if both channels have valid LCNs
    const aHasLCN = hasValidLCN(a)
    const bHasLCN = hasValidLCN(b)

    // If both have LCNs, sort by LCN
    if (aHasLCN && bHasLCN) {
      // Extract the numeric part for proper numeric sorting
      const aLCN = a.channel.lcn
      const bLCN = b.channel.lcn

      // Check if both LCNs are purely numeric
      const aIsNumeric = /^\d+$/.test(aLCN)
      const bIsNumeric = /^\d+$/.test(bLCN)

      // If both are numeric, sort numerically
      if (aIsNumeric && bIsNumeric) {
        return Number.parseInt(aLCN) - Number.parseInt(bLCN)
      }

      // If only one is numeric, prioritize numeric values
      if (aIsNumeric) return -1
      if (bIsNumeric) return 1

      // If both are non-numeric, sort alphabetically
      return aLCN.localeCompare(bLCN)
    }

    // If only one has LCN, prioritize the one with LCN
    if (aHasLCN) return -1
    if (bHasLCN) return 1

    // If neither has LCN, sort by name
    return getChannelName(a, displayNameType).localeCompare(getChannelName(b, displayNameType))
  })

  // Get current program for each channel
  const getCurrentProgram = (channelId: string) => {
    const channelData = channels.find((c) => c.channel.id === channelId)
    if (!channelData) return null

    const now = currentTime
    return channelData.programs.find((program) => {
      const startTime = parseISODate(program.start_time)
      const endTime = parseISODate(program.end_time)
      return isAfter(now, startTime) && isBefore(now, endTime)
    })
  }

  // Get all programs for a channel
  const getChannelPrograms = (channelId: string, channelLcn: string) => {
    const channelData = channels.find((c) => c.channel.id === channelId && c.channel.lcn === channelLcn)
    if (!channelData) return []

    // Create a map to track unique programs by guideid
    const uniquePrograms = new Map<string, Program>()

    // Process each program
    channelData.programs.forEach((program) => {
      // If guideid is missing, generate one based on start time
      const programId = program.guideid || `${program.start_time}-${program.title}`

      // Only add if we haven't seen this program before
      if (!uniquePrograms.has(programId)) {
        uniquePrograms.set(programId, program)
      }
    })

    // Convert back to array and sort by start time
    return Array.from(uniquePrograms.values()).sort(
      (a, b) => parseISODate(a.start_time).getTime() - parseISODate(b.start_time).getTime(),
    )
  }

  // Get program status
  const getProgramStatus = (program: Program): ProgramStatus => {
    const startTime = parseISODate(program.start_time)
    const endTime = parseISODate(program.end_time)

    if (isAfter(currentTime, startTime) && isBefore(currentTime, endTime)) {
      return "now-playing"
    } else if (isBefore(currentTime, startTime)) {
      return "upcoming"
    } else {
      return "ended"
    }
  }

  // Toggle channel expansion
  const toggleChannel = (channelId: string, channelNumber: string) => {
    const key = `${channelId}-${channelNumber}`
    setExpandedChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Handle program selection
  const handleProgramClick = (program: Program) => {
    if (onProgramSelect && !isPlaceholderProgram(program.title)) {
      onProgramSelect(program)
    }
  }

  return (
    <ScrollArea className={cn("pr-4", className)}>
      {sortedChannels.map((channel) => {
        const currentProgram = getCurrentProgram(channel.channel.id)
        const allPrograms = getChannelPrograms(channel.channel.id, channel.channel.lcn)
        const channelKey = `${channel.channel.id}-${channel.channel.lcn}`

        return (
          <div key={channelKey} className="shadow-sm mb-4 border rounded-md overflow-hidden">
            <div
              className="flex items-center bg-muted/20 hover:bg-muted/30 p-3 cursor-pointer"
              onClick={() => toggleChannel(channel.channel.id, channel.channel.lcn)}
            >
              <div className="flex-shrink-0 mr-3 w-10 h-10">
                <img
                  className="dark:hidden rounded-sm w-full h-full object-contain"
                  src={channel.channel.icon.light || "/placeholder.svg"}
                  alt=""
                />
                <img
                  className="hidden dark:block rounded-sm w-full h-full object-contain"
                  src={channel.channel.icon.dark || "/placeholder.svg"}
                  alt=""
                />
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/channel/${channel.channel.slug}?source=${dataSource}`}
                    className={cn("text-sm font-medium hover:underline break-words max-w-[200px]")}
                    onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking the link
                  >
                    {channel.channel.name[displayNameType] || channel.channel.name.clean}
                  </Link>
                  {channel.channel.lcn && channel.channel.lcn !== "N/A" && (
                    <Badge variant="outline" className="h-5 text-xs">
                      {channel.channel.lcn}
                    </Badge>
                  )}
                </div>

                {currentProgram && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1">
                      <Circle className="flex-shrink-0 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))] w-2 h-2" />
                      <span className="font-medium text-sm truncate">{decodeHtml(currentProgram.title)}</span>
                    </div>
                    {currentProgram.subtitle && currentProgram.subtitle !== "N/A" && (
                      <p className="pl-3 text-muted-foreground text-xs truncate">
                        {decodeHtml(currentProgram.subtitle)}
                      </p>
                    )}
                  </div>
                )}

                {!currentProgram && (
                  <div className="mt-1 text-muted-foreground text-xs">No program currently airing</div>
                )}
              </div>
              <ChevronDown
                className={cn("h-5 w-5 transition-transform", expandedChannels[channelKey] ? "rotate-180" : "")}
              />
            </div>

            {expandedChannels[channelKey] && (
              <div className="divide-y">
                {allPrograms.length > 0 ? (
                  allPrograms.map((program) => {
                    const status = getProgramStatus(program)
                    const categoryIcon = getProgramCategoryIcon(program.categories)
                    const isPremiere =
                      program.premiere ||
                      (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("premiere")))
                    const isNew =
                      program.new ||
                      (program.categories && program.categories.some((cat) => cat.toLowerCase().includes("new")))

                    // Check if program has special styling
                    const specialTitleClass = getSpecialTitleClass(program.title)
                    const isPlaceholder = isPlaceholderProgram(program.title)

                    // Calculate progress percentage for currently playing programs
                    const progressPercentage =
                      status === "now-playing"
                        ? Math.min(
                            100,
                            (differenceInMinutes(currentTime, parseISODate(program.start_time)) /
                              differenceInMinutes(parseISODate(program.end_time), parseISODate(program.start_time))) *
                              100,
                          )
                        : 0

                    // For mobile, we'll use a direct click handler instead of tooltips
                    if (isMobile) {
                      return (
                        <div
                          key={`${channel.channel.id}-${channel.channel.lcn}-${program.guideid}`}
                          className={cn(
                            "hover:bg-muted/50 flex cursor-pointer items-center px-3 py-2 relative",
                            "border-l-[3px]",
                            isPlaceholder
                              ? specialTitleClass
                                ? "border-l-gray-400 text-white"
                                : "border-l-transparent"
                              : status === "now-playing"
                                ? "border-l-[hsl(var(--program-current-border))] bg-[hsl(var(--program-current))/20]"
                                : status === "upcoming"
                                  ? "border-l-[hsl(var(--program-new))]"
                                  : "border-l-transparent",
                          )}
                          onClick={() => handleProgramClick(program)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="mr-2 font-medium text-muted-foreground text-xs whitespace-nowrap">
                                {formatDate(program.start_time, "HH:mm")}-{formatDate(program.end_time, "HH:mm")}
                              </div>

                              <div className="flex flex-1 items-center gap-1">
                                {status === "now-playing" && !isPlaceholder && (
                                  <Circle className="flex-shrink-0 mr-0.5 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))] w-2 h-2" />
                                )}
                                <span
                                  className={cn(
                                    "font-medium text-sm truncate",
                                    isPlaceholder
                                      ? "text-white"
                                      : status === "now-playing" && "text-[hsl(var(--program-current-foreground))]",
                                  )}
                                >
                                  {decodeHtml(program.title)}
                                </span>
                                {!isPlaceholder && isPremiere && (
                                  <Star className="ml-1 w-3 h-3 text-[hsl(var(--program-premiere))]" />
                                )}
                                {!isPlaceholder && isNew && (
                                  <Badge
                                    variant="outline"
                                    className="ml-1 px-1 border-[hsl(var(--program-new))] h-4 font-bold text-[8px] text-[hsl(var(--program-new))]"
                                  >
                                    NEW
                                  </Badge>
                                )}
                                {!isPlaceholder && categoryIcon && <span className="ml-1">{categoryIcon}</span>}
                              </div>
                            </div>

                            {program.subtitle && program.subtitle !== "N/A" && (
                              <p className="mt-0.5 pl-12 text-muted-foreground text-xs truncate">
                                {decodeHtml(program.subtitle)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-2">
                            {!isPlaceholder && program.categories && program.categories.length > 0 && (
                              <Badge variant="secondary" className="text-[10px]">
                                {program.categories[0]}
                              </Badge>
                            )}
                            <div className="font-medium text-muted-foreground text-xs whitespace-nowrap">
                              {differenceInMinutes(parseISODate(program.end_time), parseISODate(program.start_time))}
                              min
                            </div>
                          </div>

                          {/* Progress indicator for currently playing programs */}
                          {status === "now-playing" && !isPlaceholder && (
                            <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                              <div
                                className="right-0 bottom-0 left-0 absolute bg-[hsl(var(--program-current-border))/30] h-1.5"
                                style={{
                                  clipPath: `polygon(0 0, ${progressPercentage}% 0, ${progressPercentage}% 100%, 0 100%)`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    }

                    // For desktop, use tooltips for non-placeholder programs
                    if (isPlaceholder) {
                      return (
                        <div
                          key={`${channel.channel.id}-${channel.channel.lcn}-${program.guideid}`}
                          className={cn(
                            "flex items-center px-3 py-2 relative",
                            "border-l-[3px] border-l-muted",
                            specialTitleClass,
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="mr-2 font-medium text-muted-foreground text-xs whitespace-nowrap">
                                {formatDate(program.start_time, "HH:mm")}-{formatDate(program.end_time, "HH:mm")}
                              </div>

                              <div className="flex flex-1 items-center gap-1">
                                <span className="font-medium text-sm truncate">{decodeHtml(program.title)}</span>
                              </div>
                            </div>

                            {program.subtitle && program.subtitle !== "N/A" && (
                              <p className="mt-0.5 pl-12 text-muted-foreground text-xs truncate">
                                {decodeHtml(program.subtitle)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-2">
                            <div className="font-medium text-muted-foreground text-xs whitespace-nowrap">
                              {differenceInMinutes(parseISODate(program.end_time), parseISODate(program.start_time))}
                              min
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <TooltipProvider key={`${channel.channel.id}-${channel.channel.lcn}-${program.guideid}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "hover:bg-muted/50 flex cursor-pointer items-center px-3 py-2 relative",
                                "border-l-[3px]",
                                status === "now-playing"
                                  ? "border-l-[hsl(var(--program-current-border))] bg-[hsl(var(--program-current))/20]"
                                  : status === "upcoming"
                                    ? "border-l-[hsl(var(--program-new))]"
                                    : "border-l-transparent",
                              )}
                              onClick={() => handleProgramClick(program)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="mr-2 font-medium text-muted-foreground text-xs whitespace-nowrap">
                                    {formatDate(program.start_time, "HH:mm")}-{formatDate(program.end_time, "HH:mm")}
                                  </div>

                                  <div className="flex flex-1 items-center gap-1">
                                    {status === "now-playing" && (
                                      <Circle className="flex-shrink-0 mr-0.5 fill-[hsl(var(--program-current-border))] text-[hsl(var(--program-current-border))] w-2 h-2" />
                                    )}
                                    <span
                                      className={cn(
                                        "font-medium text-sm truncate",
                                        status === "now-playing" && "text-[hsl(var(--program-current-foreground))]",
                                      )}
                                    >
                                      {decodeHtml(program.title)}
                                    </span>
                                    {isPremiere && (
                                      <Star className="ml-1 w-3 h-3 text-[hsl(var(--program-premiere))]" />
                                    )}
                                    {isNew && (
                                      <Badge
                                        variant="outline"
                                        className="ml-1 px-1 border-[hsl(var(--program-new))] h-4 font-bold text-[8px] text-[hsl(var(--program-new))]"
                                      >
                                        NEW
                                      </Badge>
                                    )}
                                    {categoryIcon && <span className="ml-1">{categoryIcon}</span>}
                                  </div>
                                </div>

                                {program.subtitle && program.subtitle !== "N/A" && (
                                  <p className="mt-0.5 pl-12 text-muted-foreground text-xs truncate">
                                    {decodeHtml(program.subtitle)}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 ml-2">
                                {program.categories && program.categories.length > 0 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {program.categories[0]}
                                  </Badge>
                                )}
                                <div className="font-medium text-muted-foreground text-xs whitespace-nowrap">
                                  {differenceInMinutes(
                                    parseISODate(program.end_time),
                                    parseISODate(program.start_time),
                                  )}
                                  min
                                </div>
                              </div>

                              {/* Progress indicator for currently playing programs */}
                              {status === "now-playing" && (
                                <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                                  <div
                                    className="right-0 bottom-0 left-0 absolute bg-[hsl(var(--program-current-border))/30] h-1.5"
                                    style={{
                                      clipPath: `polygon(0 0, ${progressPercentage}% 0, ${progressPercentage}% 100%, 0 100%)`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {showProgramDetails && (
                            <ProgramTooltip
                              program={program}
                              status={status}
                              progressPercentage={progressPercentage}
                              side="right"
                            />
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })
                ) : (
                  <div className="p-3 text-muted-foreground text-sm italic">No programs available for this channel</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </ScrollArea>
  )
}
