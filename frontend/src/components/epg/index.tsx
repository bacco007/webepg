"use client"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import type React from "react"

import Link from "next/link"
import { Loader2, Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"

import { CurrentTimeIndicator } from "./current-time-indicator"
import { TimeHeader } from "./time-header"
import { ChannelRow } from "./channel-row"
import { ListView } from "./list-view"
import { ProgramDetails } from "./program-details"
import { DebugPanel } from "./debug-panel"
import type { TVGuideData, DateData, Channel, Program, ChannelData, ChannelsResponse } from "./types"
import { formatDate, parseISODate, isDateToday } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
// Use your existing hook
import { useIsMobile } from "@/hooks/use-mobile"

interface TVGuideProps {
  initialDate?: string
  initialViewMode?: "grid" | "list"
  channelFilters?: string[]
  categoryFilters?: string[]
  networkFilters?: string[]
  searchTerm?: string
  className?: string
  hideDateHeader?: boolean
  dataSource?: string
  timezone?: string
  rowHeight?: number
  channelNetworkMap?: Record<string, string>
  displayNameType?: "clean" | "real" | "location"
  sortBy?: string
  groupBy?: string
  debug?: boolean
}

// Main TV Guide Component
export function TVGuide({
  initialDate = "",
  initialViewMode = "grid",
  channelFilters = [],
  categoryFilters = [],
  networkFilters = [],
  searchTerm = "",
  className = "",
  hideDateHeader = false,
  dataSource, // Remove default value to prevent automatic fetching
  timezone = "Australia/Sydney",
  rowHeight = 70,
  channelNetworkMap = {},
  displayNameType = "clean",
  sortBy = "channelNumber",
  groupBy = "none",
  debug = false, // Disable debug by default, enable only when needed
}: TVGuideProps) {
  const [data, setData] = useState<TVGuideData | null>(null)
  const [channelList, setChannelList] = useState<ChannelData[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState(searchTerm)
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [currentTime] = useState(new Date())
  const initialRenderRef = useRef(true)
  const isMobile = useIsMobile()
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [deduplicationStrategy, setDeduplicationStrategy] = useState<string>("none")

  // Hour width in pixels - smaller on mobile
  const hourWidth = isMobile ? 150 : 200

  // Add this debug helper function
  const debugPrograms = (channel: Channel) => {
    if (process.env.NODE_ENV === "development") {
      console.group(`Channel: ${channel.channel.name.clean} (${channel.channel.lcn})`)
      channel.programs.forEach((program) => {
        console.log(`Program: ${program.title}`)
        console.log(`Time: ${program.start_time} to ${program.end_time}`)
        console.log(
          `Duration: ${new Date(new Date(program.end_time).getTime() - new Date(program.start_time).getTime()).toISOString().substr(11, 8)}`,
        )
        console.log(`guideid: ${program.guideid}`)
        console.log("---")
      })
      console.groupEnd()
    }
  }

  // Helper function to check if a channel has a valid LCN
  const hasValidLCN = (channel: Channel): boolean => {
    return Boolean(channel.channel.lcn && channel.channel.lcn !== "N/A")
  }

  // Helper function to get channel name for sorting
  const getChannelName = (channel: Channel): string => {
    return channel.channel.name[displayNameType] || channel.channel.name.clean
  }

  // Update state when props change
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate)
    }
  }, [initialDate, selectedDate])

  useEffect(() => {
    setViewMode(initialViewMode)
  }, [initialViewMode])

  useEffect(() => {
    setChannelFilter(searchTerm)
  }, [searchTerm])

  // Fetch available dates if not provided
  useEffect(() => {
    // Only fetch if we have a dataSource and it's not the initial render
    if (availableDates.length === 0 && dataSource && timezone) {
      const fetchDates = async () => {
        try {
          setLoading(true)
          const response = await fetch(
            `/api/py/dates/${dataSource}?timezone=${encodeURIComponent(timezone)}`,
          )
          if (!response.ok) {
            throw new Error(`Failed to fetch dates: ${response.status}`)
          }
          const result: DateData = await response.json()
          setAvailableDates(result.data)

          // Set the default selected date to the first available date if not already set
          if (result.data.length > 0 && !selectedDate) {
            setSelectedDate(result.data[0])
          }
        } catch (err) {
          console.error("Error fetching dates:", err)
        } finally {
          setLoading(false)
        }
      }

      fetchDates()
    }
  }, [availableDates.length, selectedDate, dataSource, timezone])

  // Fetch channel list first
  useEffect(() => {
    if (!dataSource) return

    const fetchChannels = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/py/channels/${dataSource}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch channels: ${response.status}`)
        }
        const result: ChannelsResponse = await response.json()

        // Log the channel data for debugging
        if (debug) {
          console.log("Channel list from API:", result)
        }

        // Store the channel list
        setChannelList(result.data.channels)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error("Error fetching channels:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [dataSource, debug])

  // Fetch guide data when selected date changes
  useEffect(() => {
    if (!selectedDate || !dataSource || !timezone || channelList.length === 0) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/py/epg/date/${selectedDate}/${dataSource}?timezone=${encodeURIComponent(timezone)}`,
        )
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }
        const result: TVGuideData = await response.json()

        // Log the raw data for debugging
        if (debug) {
          console.log("Program data from API:", result)
        }

        // Create a map of channel ID to programs
        const programsByChannelId: Record<string, Program[]> = {}

        // Process the programs from the result
        if (result.channels) {
          result.channels.forEach((channel: Channel) => {
            // Use only channel ID as the key
            const channelId = channel.channel.id
            programsByChannelId[channelId] = channel.programs || []
          })
        }

        // Convert the channel list to the Channel format and associate programs
        const channels: Channel[] = channelList.map((channelData) => {
          // Create a channel object from the channel data
          const channel: Channel = {
            channel: {
              id: channelData.channel_id,
              name: channelData.channel_names,
              icon: channelData.channel_logo,
              slug: channelData.channel_slug,
              lcn: channelData.channel_number,
            },
            programs: [],
            channel_group: channelData.channel_group,
          }

          // Find programs for this channel by ID only
          const channelId = channel.channel.id
          channel.programs = programsByChannelId[channelId] || []

          return channel
        })

        // Create a new data object using the channel list and associating programs
        const mergedData: TVGuideData = {
          ...result,
          channels,
        }

        setData(mergedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, dataSource, timezone, channelList, debug])

  // Scroll to current time on initial load
  useEffect(() => {
    if (timelineRef.current && !loading && viewMode === "grid") {
      const scrollableElement = timelineRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollableElement) {
        const now = new Date()
        const currentHour = now.getHours()
        const scrollPosition = currentHour * hourWidth - (isMobile ? 50 : 200) // Scroll to current hour minus some offset

        // Use smooth scrolling for initial load
        scrollableElement.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: "smooth",
        })
      }
    }
  }, [loading, hourWidth, viewMode, isMobile])

  // Set first channel as selected when data loads or when changing view mode to list
  useEffect(() => {
    if (data?.channels && data.channels.length > 0 && viewMode === "list" && !selectedChannelId) {
      setSelectedChannelId(data.channels[0].channel.id)
    }
  }, [data, viewMode, selectedChannelId])

  // Handle program selection
  const handleProgramSelect = useCallback((program: Program) => {
    setSelectedProgram(program)
    setIsProgramDetailsOpen(true)
  }, [])

  // Jump to time function
  const jumpToTime = (hour: number) => {
    if (timelineRef.current && viewMode === "grid") {
      // Get the scrollable element inside the ScrollArea
      const scrollableElement = timelineRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollableElement) {
        const scrollPosition = hour * hourWidth

        // Use smooth scrolling for a nice transition
        scrollableElement.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        })
      }
    }
  }

  // Handle touch events for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
    setIsScrolling(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return

    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY

    // Calculate distance moved
    const deltaX = touchStartX - touchX
    const deltaY = touchStartY - touchY

    // If vertical scrolling is dominant, mark as scrolling
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setIsScrolling(true)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || isScrolling) {
      setTouchStartX(null)
      setTouchStartY(null)
      setIsScrolling(false)
      return
    }

    const touchEndX = e.changedTouches[0].clientX
    const deltaX = touchStartX - touchEndX

    // If horizontal swipe is significant
    if (Math.abs(deltaX) > 50) {
      // Swipe left (next date)
      if (deltaX > 0) {
        const currentIndex = availableDates.indexOf(selectedDate)
        if (currentIndex < availableDates.length - 1) {
          setSelectedDate(availableDates[currentIndex + 1])
        }
      }
      // Swipe right (previous date)
      else {
        const currentIndex = availableDates.indexOf(selectedDate)
        if (currentIndex > 0) {
          setSelectedDate(availableDates[currentIndex - 1])
        }
      }
    }

    setTouchStartX(null)
    setTouchStartY(null)
  }

  // Handle deduplication strategy change
  const handleDeduplicationStrategyChange = (strategy: string) => {
    setDeduplicationStrategy(strategy)
    if (debug) {
      console.log(`Changed deduplication strategy to: ${strategy}`)
    }
  }

  // Sort and group channels based on settings
  const processedChannels = useMemo(() => {
    if (!data?.channels) return []

    // First filter channels
    let channels = data.channels.filter((channel) => {
      // First apply search filter
      const searchMatch =
        !channelFilter ||
        channel.channel.name.clean.toLowerCase().includes(channelFilter.toLowerCase()) ||
        channel.channel.lcn.includes(channelFilter)

      // Then apply channel name filters - check if any filter matches the channel name
      const channelNameMatch =
        channelFilters.length === 0 ||
        channelFilters.some((filter) => {
          // Split the filter to check if it contains both ID and LCN
          const parts = filter.split("|")
          if (parts.length === 2) {
            // If filter has ID|LCN format, match both ID and LCN exactly
            return channel.channel.id === parts[0] && channel.channel.lcn === parts[1]
          }
          // Otherwise just check the name
          return channel.channel.name.clean === filter
        })

      // Apply category filters if any
      const categoryMatch =
        categoryFilters.length === 0 ||
        channel.programs.some(
          (program) => program.categories && program.categories.some((category) => categoryFilters.includes(category)),
        )

      // Apply network filters if any
      // Use the channelNetworkMap to determine the network for this channel
      const channelNetwork = channelNetworkMap[channel.channel.id]
      const networkMatch = networkFilters.length === 0 || (channelNetwork && networkFilters.includes(channelNetwork))

      return searchMatch && channelNameMatch && categoryMatch && networkMatch
    })

    // Apply deduplication strategy
    if (deduplicationStrategy !== "none") {
      // Create a map to track unique channels based on the selected strategy
      const uniqueChannelMap = new Map<string, boolean>()

      // Filter out duplicate channels based on the selected strategy
      channels = channels.filter((channel) => {
        let key: string

        if (deduplicationStrategy === "id-only") {
          // Deduplicate by ID only
          key = channel.channel.id
        } else {
          // Deduplicate by ID + LCN (default)
          key = `${channel.channel.id}-${channel.channel.lcn}`
        }

        if (uniqueChannelMap.has(key)) {
          return false
        }
        uniqueChannelMap.set(key, true)
        return true
      })
    }

    // Then sort channels
    channels = [...channels].sort((a, b) => {
      if (sortBy === "channelNumber") {
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
        return getChannelName(a).localeCompare(getChannelName(b))
      } else if (sortBy === "channelName") {
        // Use fallback to clean name if the specified display name type doesn't exist
        return getChannelName(a).localeCompare(getChannelName(b))
      } else if (sortBy === "networkName") {
        const aNetwork = channelNetworkMap[a.channel.id] || ""
        const bNetwork = channelNetworkMap[b.channel.id] || ""

        // If networks are the same, sort by channel name
        if (aNetwork === bNetwork) {
          return getChannelName(a).localeCompare(getChannelName(b))
        }

        return aNetwork.localeCompare(bNetwork)
      }
      return 0
    })

    // Group channels if needed
    if (groupBy === "network") {
      // Create a map of networks to channels
      const networkGroups: Record<string, Channel[]> = {}

      channels.forEach((channel) => {
        const network = channelNetworkMap[channel.channel.id] || "Unknown"
        if (!networkGroups[network]) {
          networkGroups[network] = []
        }
        networkGroups[network].push(channel)
      })

      // Flatten the grouped channels
      const groupedChannels: Channel[] = []
      Object.keys(networkGroups)
        .sort()
        .forEach((network) => {
          // Sort channels within each network group
          const sortedNetworkChannels = [...networkGroups[network]].sort((a, b) => {
            // First try to sort by LCN if available
            const aHasLCN = hasValidLCN(a)
            const bHasLCN = hasValidLCN(b)

            if (aHasLCN && bHasLCN) {
              const aNum = Number.parseInt(a.channel.lcn) || 0
              const bNum = Number.parseInt(b.channel.lcn) || 0
              return aNum - bNum
            }

            // Fall back to name sorting
            return getChannelName(a).localeCompare(getChannelName(b))
          })

          groupedChannels.push(...sortedNetworkChannels)
        })

      return groupedChannels
    }

    return channels
  }, [
    data,
    channelFilter,
    channelFilters,
    categoryFilters,
    networkFilters,
    channelNetworkMap,
    sortBy,
    groupBy,
    displayNameType,
    deduplicationStrategy,
  ])

  // Navigation buttons for mobile
  const renderMobileNavigation = () => {
    if (!isMobile) return null

    const currentIndex = availableDates.indexOf(selectedDate)
    const prevDate = currentIndex > 0 ? availableDates[currentIndex - 1] : null
    const nextDate = currentIndex < availableDates.length - 1 ? availableDates[currentIndex + 1] : null

    return (
      <div className="flex justify-between items-center mb-2 px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => prevDate && setSelectedDate(prevDate)}
          disabled={!prevDate}
          className="justify-start w-[80px]"
        >
          <ChevronLeft className="mr-1 w-4 h-4" />
          {prevDate ? formatDateLabel(prevDate) : "Prev"}
        </Button>

        <div className="font-medium text-sm text-center">{formatDateLabel(selectedDate, true)}</div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => nextDate && setSelectedDate(nextDate)}
          disabled={!nextDate}
          className="justify-end w-[80px]"
        >
          {nextDate ? formatDateLabel(nextDate) : "Next"}
          <ChevronRight className="ml-1 w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Format date for mobile display
  const formatDateLabel = (dateStr: string, isLong = false) => {
    if (!dateStr) return ""

    const dateObj = parseISODate(`${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`)

    if (isDateToday(dateObj)) {
      return isLong ? "Today" : "Today"
    }

    return isLong ? formatDate(dateObj, "EEE, MMM d") : formatDate(dateObj, "EEE")
  }

  // Mobile time navigation
  const renderMobileTimeNav = () => {
    if (!isMobile || viewMode !== "grid") return null

    return (
      <div className="flex gap-1 mb-1 px-2 py-1 overflow-x-auto no-scrollbar">
        {[6, 9, 12, 15, 18, 21, 0].map((hour) => (
          <Button
            key={hour}
            variant="outline"
            size="sm"
            onClick={() => jumpToTime(hour)}
            className="flex-shrink-0 px-2 py-1 h-8 text-xs"
          >
            {hour === 0 ? "00:00" : `${hour}:00`}
          </Button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="size-8 text-muted-foreground animate-spin" />
        <span className="ml-2">Loading TV guide data...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  const date = data.date
  const formattedDate = date ? formatDate(parseISODate(date), "EEEE, do MMMM yyyy") : ""

  // Calculate the actual row height with padding
  const actualRowHeight = rowHeight + 2 // Match the +2 in ChannelRow

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ width: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!hideDateHeader && !isMobile && (
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-2xl">Daily EPG - {formattedDate}</h1>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => jumpToTime(6)} disabled={viewMode !== "grid"}>
                  06:00
                </Button>
                <Button variant="outline" size="sm" onClick={() => jumpToTime(12)} disabled={viewMode !== "grid"}>
                  12:00
                </Button>
                <Button variant="outline" size="sm" onClick={() => jumpToTime(18)} disabled={viewMode !== "grid"}>
                  18:00
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation */}
      {isMobile && renderMobileNavigation()}
      {isMobile && renderMobileTimeNav()}

      <div
        className={`relative border rounded-md overflow-hidden bg-background ${hideDateHeader ? "flex-1" : ""}`}
        style={{ width: isMobile ? "100%" : "calc(100%)" }}
      >
        {processedChannels.length > 0 ? (
          viewMode === "grid" ? (
            // Grid View
            <ScrollArea className={hideDateHeader ? "h-full" : "h-[calc(100vh-230px)]"} ref={timelineRef}>
              <div className="grid grid-cols-[180px_1fr]" ref={scrollContainerRef}>
                {/* Channel sidebar - fixed position */}
                <div className="left-0 z-10 sticky bg-card border-r">
                  <div className="flex items-center px-4 border-b h-12 font-medium">
                    Channels {processedChannels.length !== data.channels.length && `(${processedChannels.length})`}
                  </div>
                  <div className="flex flex-col">
                    {processedChannels.map((channel, index) => (
                      <div
                        key={`${channel.channel.id}-${channel.channel.lcn}`}
                        className={index < processedChannels.length - 1 ? "border-b" : ""} // Keep border for all but last channel
                        style={{ height: `${actualRowHeight}px` }}
                      >
                        <div className="flex items-center px-4 py-1 h-full">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center w-10">
                              <img
                                src={channel.channel.icon.light || "/placeholder.svg"}
                                alt={channel.channel.name.clean}
                                className="w-8 h-8 object-contain"
                              />
                            </div>
                            <div className="flex flex-col max-w-[120px]">
                              <div className="font-medium line-clamp-2">
                                <Link
                                  href={`/channel/${channel.channel.slug}?source=${dataSource}`}
                                  className={cn("text-xs font-medium hover:underline block break-words")}
                                >
                                  {channel.channel.name[displayNameType] || channel.channel.name.clean}
                                </Link>
                              </div>
                              {channel.channel.lcn && channel.channel.lcn !== "N/A" && (
                                <Badge variant="outline" className="mt-1 px-1 py-0 w-fit text-[10px]">
                                  {channel.channel.lcn}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline and programs */}
                <div className="relative">
                  <TimeHeader hourWidth={hourWidth} />
                  <div className="relative" style={{ width: `${hourWidth * 24}px` }}>
                    <CurrentTimeIndicator hourWidth={hourWidth} />
                    {processedChannels.map((channel) => (
                      <ChannelRow
                        key={`${channel.channel.id}-${channel.channel.lcn}`}
                        channel={channel}
                        date={date}
                        hourWidth={hourWidth}
                        currentTime={currentTime}
                        rowHeight={rowHeight}
                        onProgramSelect={handleProgramSelect}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            // List View
            <ListView
              channels={processedChannels}
              currentTime={currentTime}
              className={hideDateHeader ? "h-full" : "h-[calc(100vh-230px)]"}
              displayNameType={displayNameType}
              dataSource={dataSource}
              onProgramSelect={handleProgramSelect}
            />
          )
        ) : (
          <div className="flex flex-col justify-center items-center p-8 h-full text-center">
            <div className="mb-2 text-muted-foreground">
              <Search className="opacity-20 mx-auto mb-4 size-12" />
              <h3 className="font-medium text-lg">No channels found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Program details sheet for mobile */}
      {isMobile && (
        <Sheet open={isProgramDetailsOpen} onOpenChange={setIsProgramDetailsOpen}>
          <SheetContent side="bottom" className="p-0 h-[80vh] overflow-hidden">
            <SheetHeader className="px-4 pt-4 pb-2">
              <div className="flex justify-between items-center">
                <SheetTitle className="text-left">{selectedProgram?.title}</SheetTitle>
                <SheetClose className="flex justify-center items-center rounded-full w-8 h-8">
                  <X className="w-4 h-4" />
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="pb-safe h-full overflow-auto">
              {selectedProgram && <ProgramDetails program={selectedProgram} />}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Debug Panel */}
      {debug && data && (
        <DebugPanel
          rawChannels={data.channels}
          processedChannels={processedChannels}
          onToggleDeduplication={handleDeduplicationStrategyChange}
          currentStrategy={deduplicationStrategy}
        />
      )}
    </div>
  )
}
