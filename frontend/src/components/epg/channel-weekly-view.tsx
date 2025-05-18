"use client"

// Create a new component for the weekly channel view
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar, Clock, RefreshCw, Layers, Tv, Film } from "lucide-react"
import { format, isAfter, isBefore, differenceInMinutes } from "date-fns"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { parseISODate } from "@/lib/date-utils"
import { getProgramCategoryIcon } from "@/components/epg/utils"
import { WeeklyGridView } from "@/components/epg/weekly-grid-view"
import { WeeklyListView } from "@/components/epg/weekly-list-view"
import { ChannelDropdown } from "@/components/epg/channel-dropdown"

// Types
import type { Channel, Program } from "@/components/epg/types"

// Enhanced category colors with better contrast and accessibility
const categoryColors: { [key: string]: string } = {
  Sports: "bg-emerald-600 hover:bg-emerald-500",
  News: "bg-blue-600 hover:bg-blue-500",
  Movie: "bg-purple-600 hover:bg-purple-500",
  Series: "bg-amber-600 hover:bg-amber-500",
  Documentary: "bg-teal-600 hover:bg-teal-500",
  Kids: "bg-pink-600 hover:bg-pink-500",
  Music: "bg-indigo-600 hover:bg-indigo-500",
  Reality: "bg-orange-600 hover:bg-orange-500",
  Comedy: "bg-cyan-600 hover:bg-cyan-500",
  Drama: "bg-rose-600 hover:bg-rose-500",
}

// Time block definitions for grouping programs
const timeBlocks = [
  { name: "Early Morning", start: 0, end: 6 },
  { name: "Morning", start: 6, end: 12 },
  { name: "Afternoon", start: 12, end: 17 },
  { name: "Evening", start: 17, end: 20 },
  { name: "Prime Time", start: 20, end: 23 },
  { name: "Late Night", start: 23, end: 24 },
]

type DensityOption = "compact" | "normal" | "detailed"

interface ChannelWeeklyViewProps {
  channelSlug: string
  dataSource?: string
}

export function ChannelWeeklyView({ channelSlug, dataSource = "xmlepg_FTASYD" }: ChannelWeeklyViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [allPrograms, setAllPrograms] = useState<Program[]>([])
  const [daysLength, setDaysLength] = useState<number>(7)
  const [channelData, setChannelData] = useState<Channel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [clientTimezone, setClientTimezone] = useState<string>("Australia/Sydney")
  const [visibleDays, setVisibleDays] = useState<number>(7)
  const [startDayIndex, setStartDayIndex] = useState(0)
  const [useCategories, setUseCategories] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [totalDays, setTotalDays] = useState<number>(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null)
  const [showPastPrograms, setShowPastPrograms] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [density, setDensity] = useState<DensityOption>("normal")
  const [showTimeBlocks, setShowTimeBlocks] = useState(true)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Set client timezone
  useEffect(() => {
    // In a real implementation, we would use a timezone library
    // For now, we'll just use the browser's timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setClientTimezone(detectedTimezone)
  }, [])

  // Fetch data source from cookies or URL
  useEffect(() => {
    const fetchDataSource = async () => {
      const urlSource = searchParams.get("source")
      if (urlSource && urlSource !== dataSource) {
        router.replace(`/channel/${channelSlug}?source=${urlSource}`)
      }
    }

    fetchDataSource()
  }, [searchParams, channelSlug, dataSource, router])

  // Process API data
  const processApiData = useCallback(
    (data: any) => {
      if (!data || !data.programs) {
        setError("Invalid data received from API")
        return
      }

      const dates = Object.keys(data.programs)
      if (dates.length === 0) {
        setError("No program data available")
        return
      }

      const startDay = parseISODate(dates[0])

      setStartDate(startDay)
      setDaysLength(dates.length)
      setTotalDays(dates.length)
      setChannelData({
        channel: {
          id: data.channel.channel_id,
          name: {
            clean: data.channel.channel_names.clean,
            location: data.channel.channel_names.location,
            real: data.channel.channel_names.real,
          },
          icon: {
            light: data.channel.channel_logo.light,
            dark: data.channel.channel_logo.dark,
          },
          slug: data.channel.channel_slug,
          lcn: data.channel.channel_number,
        },
        programs: [],
        channel_group: "",
      })

      const programs = dates.flatMap((date, dayIndex) => {
        return data.programs[date].map((program: any, programIndex: number) => {
          const category = program.categories[0] || "No Data Available"

          return {
            guideid: `${dayIndex}-${programIndex}`,
            start_time: program.start_time,
            end_time: program.end_time,
            title: program.title,
            subtitle: program.subtitle,
            description: program.description,
            categories: program.categories,
            rating: program.rating,
            new: false,
            premiere: false,
            channel: data.channel.channel_name,
          }
        })
      })

      setAllPrograms(programs)
      setError(null)
    },
    [clientTimezone],
  )

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!channelSlug || !dataSource) {
      setError("No channel or data source selected")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const url = `/api/py/epg/channels/${dataSource}/${channelSlug}?timezone=${encodeURIComponent(clientTimezone)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      processApiData(data)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [channelSlug, clientTimezone, dataSource, processApiData])

  // Initial data fetch and timer setup
  useEffect(() => {
    if (dataSource && channelSlug) {
      fetchData()
    }

    const timer = setInterval(() => {
      setNow(new Date())
    }, 60_000)

    return () => clearInterval(timer)
  }, [fetchData, dataSource, channelSlug])

  // Generate days array
  const days = useMemo(() => {
    if (!startDate) return []
    return Array.from({ length: daysLength }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + index)
      return date
    })
  }, [startDate, daysLength])

  // Navigation handlers
  const handlePreviousDay = useCallback(() => {
    setStartDayIndex((previous) => Math.max(0, previous - 1))
  }, [])

  const handleNextDay = useCallback(() => {
    setStartDayIndex((previous) => Math.min(daysLength - visibleDays, previous + 1))
  }, [daysLength, visibleDays])

  // Scroll to current time
  const scrollToCurrentTime = useCallback(() => {
    // Find the current time position
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const totalMinutes = currentHour * 60 + currentMinute
    const timeSlotHeight = 60 // Height of each 30-minute slot in pixels
    const scrollPosition = (totalMinutes / 30) * timeSlotHeight - 100

    // Use setTimeout to ensure the scroll happens after render
    setTimeout(() => {
      if (gridRef.current) {
        gridRef.current.scrollTop = scrollPosition
      }
    }, 0)
  }, [now])

  // Update visible days based on container width
  useEffect(() => {
    const updateVisibleDays = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const timeColumnWidth = 60 // Width of time column in pixels
        const minDayWidth = 200 // Minimum width for each day column
        const availableWidth = containerWidth - timeColumnWidth
        const possibleDays = Math.floor(availableWidth / minDayWidth)
        setVisibleDays(Math.min(possibleDays, 7, daysLength))
      }
    }

    updateVisibleDays()
    window.addEventListener("resize", updateVisibleDays)

    return () => window.removeEventListener("resize", updateVisibleDays)
  }, [daysLength])

  // Get unique categories from programs
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    allPrograms.forEach((program) => {
      program.categories?.forEach((category) => categories.add(category))
    })
    return Array.from(categories).sort()
  }, [allPrograms])

  // Filter programs for list view
  const filteredPrograms = useMemo(() => {
    if (!days[selectedDay]) return []

    const selectedDayStart = new Date(days[selectedDay])
    selectedDayStart.setHours(0, 0, 0, 0)

    const selectedDayEnd = new Date(days[selectedDay])
    selectedDayEnd.setHours(23, 59, 59, 999)

    return allPrograms
      .filter((program) => {
        const programStart = parseISODate(program.start_time)
        const programEnd = parseISODate(program.end_time)

        // Check if program is on the selected day
        const isOnSelectedDay =
          (isAfter(programStart, selectedDayStart) || programStart.getTime() === selectedDayStart.getTime()) &&
          (isBefore(programStart, selectedDayEnd) || programStart.getTime() === selectedDayEnd.getTime())

        // Check category filter
        const matchesCategory = !filteredCategory || program.categories?.includes(filteredCategory)

        // Check past programs filter
        const isPast = isAfter(now, programEnd)
        const showBasedOnPastSetting = showPastPrograms || !isPast

        // Check search term
        const matchesSearch =
          !debouncedSearchTerm ||
          program.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (program.subtitle && program.subtitle.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
          (program.description && program.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

        return isOnSelectedDay && matchesCategory && showBasedOnPastSetting && matchesSearch
      })
      .sort((a, b) => parseISODate(a.start_time).getTime() - parseISODate(b.start_time).getTime())
  }, [allPrograms, days, selectedDay, filteredCategory, showPastPrograms, now, debouncedSearchTerm])

  // Group programs by time blocks
  const groupedPrograms = useMemo(() => {
    if (!showTimeBlocks) return { "All Programs": filteredPrograms }

    const grouped: Record<string, Program[]> = {}

    timeBlocks.forEach((block) => {
      grouped[block.name] = filteredPrograms.filter((program) => {
        const hour = parseISODate(program.start_time).getHours()
        return hour >= block.start && hour < block.end
      })
    })

    // Filter out empty blocks
    return Object.fromEntries(Object.entries(grouped).filter(([_, programs]) => programs.length > 0))
  }, [filteredPrograms, showTimeBlocks])

  // Get program status (live, upcoming, past)
  const getProgramStatus = useCallback(
    (program: Program) => {
      const programStart = parseISODate(program.start_time)
      const programEnd = parseISODate(program.end_time)
      const isLive = isAfter(now, programStart) && isBefore(now, programEnd)
      const hasEnded = isAfter(now, programEnd)
      const isUpNext = !isLive && !hasEnded && differenceInMinutes(programStart, now) <= 30

      return { isLive, hasEnded, isUpNext }
    },
    [now],
  )

  // Calculate progress percentage for live programs
  const calculateProgress = useCallback(
    (start: string, end: string) => {
      const startTime = parseISODate(start)
      const endTime = parseISODate(end)
      const currentTime = now

      const totalDuration = endTime.getTime() - startTime.getTime()
      const elapsedDuration = currentTime.getTime() - startTime.getTime()

      return Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100)
    },
    [now],
  )

  // Define header actions
  const headerActions = (
    <div className="flex items-center space-x-2">
      <ChannelDropdown channelSlug={channelSlug} />
      {viewMode === "grid" && (
        <Button variant="outline" size="sm" onClick={scrollToCurrentTime} className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Now</span>
        </Button>
      )}
      <Button onClick={fetchData} variant="outline" size="sm" className="gap-1" disabled={isLoading}>
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  )

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch value={searchTerm} onChange={setSearchTerm} placeholder="Search programs..." />
      </SidebarHeader>
      <SidebarContent>
        <div className="px-4 py-3 border-b">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">View Mode</span>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="w-auto">
                <TabsList>
                  <TabsTrigger value="grid" className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Display Density</span>
              <ToggleGroup
                type="single"
                value={density}
                onValueChange={(value) => value && setDensity(value as DensityOption)}
              >
                <ToggleGroupItem value="compact" aria-label="Compact view">
                  <Layers className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="normal" aria-label="Normal view">
                  <Tv className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="detailed" aria-label="Detailed view">
                  <Film className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex justify-between items-center">
              <label htmlFor="use-categories" className="font-medium text-sm">
                Color by category
              </label>
              <Switch
                id="use-categories"
                checked={useCategories}
                onCheckedChange={setUseCategories}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex justify-between items-center">
              <label htmlFor="show-past" className="font-medium text-sm">
                Show past programs
              </label>
              <Switch
                id="show-past"
                checked={showPastPrograms}
                onCheckedChange={setShowPastPrograms}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {viewMode === "list" && (
              <div className="flex justify-between items-center">
                <label htmlFor="show-timeblocks" className="font-medium text-sm">
                  Group by time blocks
                </label>
                <Switch
                  id="show-timeblocks"
                  checked={showTimeBlocks}
                  onCheckedChange={setShowTimeBlocks}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            )}
          </div>
        </div>

        {uniqueCategories.length > 0 && (
          <div className="px-4 py-3 border-b">
            <div className="mb-2 font-medium text-sm">Filter by Category</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              <div
                className={cn(
                  "hover:bg-muted cursor-pointer rounded px-2 py-1 text-sm",
                  !filteredCategory && "bg-muted font-medium",
                )}
                onClick={() => setFilteredCategory(null)}
              >
                All Categories
              </div>
              {uniqueCategories.map((category) => {
                const CategoryIcon = getProgramCategoryIcon(category ? [category] : [])
                return (
                  <div
                    key={category}
                    className={cn(
                      "hover:bg-muted flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm",
                      filteredCategory === category && "bg-muted font-medium",
                    )}
                    onClick={() => setFilteredCategory(category)}
                  >
                    {CategoryIcon ? <CategoryIcon className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                    <span>{category}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Channel info */}
        {channelData && (
          <div className="px-4 py-3 border-b">
            <div className="mb-2 font-medium text-sm">Channel Information</div>
            <div className="flex items-center space-x-3">
              {channelData.channel.icon.light && (
                <div className="flex-shrink-0">
                  <img
                    className="dark:hidden block w-auto h-10 object-contain"
                    src={channelData.channel.icon.light || "/placeholder.svg"}
                    alt={channelData.channel.name.real}
                  />
                  <img
                    className="hidden dark:block w-auto h-10 object-contain"
                    src={channelData.channel.icon.dark || "/placeholder.svg"}
                    alt={channelData.channel.name.real}
                  />
                </div>
              )}
              <div>
                <div className="font-medium">{channelData.channel.name.real}</div>
                {channelData.channel.lcn && (
                  <div className="text-muted-foreground text-sm">Channel {channelData.channel.lcn}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground text-xs text-center">
          {days[startDayIndex] && format(days[startDayIndex], "MMM d")} -{" "}
          {days[startDayIndex + visibleDays - 1] && format(days[startDayIndex + visibleDays - 1], "MMM d")} (
          {visibleDays} of {daysLength} days)
        </div>
      </SidebarFooter>
    </SidebarContainer>
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="mr-2 animate-spin">
          <RefreshCw className="w-5 h-5" />
        </div>
        <span>Loading channel data...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={fetchData} className="mt-4">
            <RefreshCw className="mr-2 w-4 h-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    )
  }

  const channelTitle = channelData ? channelData.channel.name.real : channelSlug

  return (
    <SidebarLayout title={`Weekly EPG - ${channelTitle}`} sidebar={sidebar} actions={headerActions}>
      <div className="flex flex-col h-full">
        {/* Navigation controls */}
        <div className="bg-background px-4 py-2 border-b">
          <div className="flex justify-between items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handlePreviousDay}
                    disabled={startDayIndex === 0}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous day</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="font-semibold" aria-live="polite">
              {days[startDayIndex] && format(days[startDayIndex], "MMM d")} -{" "}
              {days[startDayIndex + visibleDays - 1] && format(days[startDayIndex + visibleDays - 1], "MMM d")} (
              {visibleDays} of {daysLength} days)
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleNextDay}
                    disabled={startDayIndex + visibleDays >= daysLength}
                    aria-label="Next day"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next day</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden" ref={containerRef}>
          {viewMode === "grid" ? (
            <WeeklyGridView
              days={days}
              programs={allPrograms}
              startDayIndex={startDayIndex}
              visibleDays={visibleDays}
              now={now}
              filteredCategory={filteredCategory}
              showPastPrograms={showPastPrograms}
              searchTerm={debouncedSearchTerm}
              useCategories={useCategories}
              density={density}
              categoryColors={categoryColors}
              getProgramStatus={getProgramStatus}
              calculateProgress={calculateProgress}
              gridRef={gridRef}
            />
          ) : (
            <WeeklyListView
              days={days}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              groupedPrograms={groupedPrograms}
              showTimeBlocks={showTimeBlocks}
              getProgramStatus={getProgramStatus}
              calculateProgress={calculateProgress}
              density={density}
              filteredCategory={filteredCategory}
              showPastPrograms={showPastPrograms}
              setShowPastPrograms={setShowPastPrograms}
            />
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
