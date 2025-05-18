"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Loader2, RefreshCw, RotateCw, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSearch,
  SidebarLayout,
} from "@/components/layouts/sidebar-layout"
import { FilterSection } from "@/components/filter-section"
import { useDebounce } from "@/hooks/use-debounce"

interface ChannelData {
  channel_id: string
  channel_slug: string
  channel_name: string
  channel_number: string
  channel_group: string
  channel_logo: {
    light: string
    dark: string
  }
  channel_names: {
    clean: string
    location: string
    real: string
  }
  other_data?: {
    channel_type?: string
    channel_specs?: string
  }
}

interface ApiResponse {
  date_pulled: string
  query: string
  source: string
  data: {
    channels: ChannelData[]
  }
}

interface ZoneConfig {
  name: string
  states: {
    code: string
    name: string
  }[]
  color: string
}

interface MergedCell {
  startIndex: number
  endIndex: number
  channel: ChannelData | null // Allow null for empty cells
}

interface EmptyStreak {
  startIndex: number
  endIndex: number
}

const ZONES: ZoneConfig[] = [
  {
    name: "South Zone",
    states: [
      { code: "NSW", name: "NSW" },
      { code: "VIC", name: "VIC" },
      { code: "TAS", name: "TAS" },
      { code: "SA", name: "SA" },
    ],
    color: "bg-blue-100 dark:bg-blue-950/30",
  },
  {
    name: "North Zone",
    states: [
      { code: "QLD", name: "QLD" },
      { code: "NT", name: "NT" },
    ],
    color: "bg-green-100 dark:bg-green-950/30",
  },
  {
    name: "West Zone",
    states: [{ code: "WA", name: "WA" }],
    color: "bg-amber-100 dark:bg-amber-950/30",
  },
]

// Flatten all states into a single array for easier indexing
const ALL_STATES = ZONES.flatMap((zone) => zone.states)

export default function ChannelMapPage() {
  const [channelData, setChannelData] = useState<Record<string, ChannelData[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [networkGroups, setNetworkGroups] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState<string>("all")
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([])
  const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>([])
  const [selectedChannelSpecs, setSelectedChannelSpecs] = useState<string[]>([])
  const [networkSearch, setNetworkSearch] = useState("")
  const [typeSearch, setTypeSearch] = useState("")
  const [specsSearch, setSpecsSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)
  // State to track collapsed network groups
  const [collapsedNetworks, setCollapsedNetworks] = useState<Record<string, boolean>>({})

  const debouncedGlobalSearch = useDebounce(globalFilter, 300)

  // Toggle sidebar function
  const toggleSidebar = () => {
    setDesktopSidebarCollapsed(!desktopSidebarCollapsed)
  }

  // Toggle network collapse state
  const toggleNetworkCollapse = (network: string) => {
    setCollapsedNetworks((prev) => ({
      ...prev,
      [network]: !prev[network],
    }))
  }

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", desktopSidebarCollapsed.toString())
  }, [desktopSidebarCollapsed])

  useEffect(() => {
    fetchAllChannelData()
  }, [])

  const fetchAllChannelData = async () => {
    try {
      setLoading(true)
      setError(null)
      const stateData: Record<string, ChannelData[]> = {}
      const allNetworks = new Set<string>()
      const allChannelTypes = new Set<string>()
      const allChannelSpecs = new Set<string>()

      // Fetch data for each state
      for (const zone of ZONES) {
        for (const state of zone.states) {
          const response = await fetch(`/api/py/channels/xmlepg_VAST${state.code}`)
          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${state.code}: ${response.status}`)
          }
          const data: ApiResponse = await response.json()
          stateData[state.code] = data.data.channels

          // Collect all network groups, channel types, and specs
          data.data.channels.forEach((channel) => {
            if (channel.channel_group) {
              allNetworks.add(channel.channel_group)
            }
            if (channel.other_data?.channel_type) {
              allChannelTypes.add(channel.other_data.channel_type)
            }
            if (channel.other_data?.channel_specs) {
              allChannelSpecs.add(channel.other_data.channel_specs)
            }
          })
        }
      }

      setChannelData(stateData)
      setNetworkGroups(Array.from(allNetworks).sort())
    } catch (err) {
      console.error("Error fetching channel data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Group channels by network and channel number
  const getChannelMap = () => {
    const channelMap: Record<string, Record<string, Record<string, ChannelData>>> = {}
    const networks: Record<string, Set<string>> = {}

    // First pass: collect all unique channel numbers by network
    Object.entries(channelData).forEach(([stateCode, channels]) => {
      channels.forEach((channel) => {
        const network = channel.channel_group || "Other"
        if (!networks[network]) {
          networks[network] = new Set()
        }

        // Use channel number as the identifier
        if (channel.channel_number) {
          networks[network].add(channel.channel_number)
        }
      })
    })

    // Second pass: organize channels by network, channel number, and state
    Object.entries(networks).forEach(([network, channelNumbers]) => {
      channelMap[network] = {}

      channelNumbers.forEach((channelNumber) => {
        channelMap[network][channelNumber] = {}

        // Find this channel number in each state
        Object.entries(channelData).forEach(([stateCode, channels]) => {
          // Find channels with matching number and network
          const matchingChannels = channels.filter(
            (c) => c.channel_number === channelNumber && c.channel_group === network,
          )

          // If multiple channels match, use the first one
          if (matchingChannels.length > 0) {
            // Make sure we're only adding channels to their correct state
            // For West Digital Television, ensure they only appear in WA
            if (network.includes("West Digital Television") && stateCode !== "WA") {
              // Skip adding this channel to non-WA states
              return
            }

            // For other networks that might have state-specific naming
            if (network.includes("Southern Cross") && network.includes("WA") && stateCode !== "WA") {
              return
            }
            if (network.includes("Southern Cross") && network.includes("NT") && stateCode !== "NT") {
              return
            }
            if (network.includes("Southern Cross") && network.includes("QLD") && stateCode !== "QLD") {
              return
            }

            channelMap[network][channelNumber][stateCode] = matchingChannels[0]
          }
        })
      })
    })

    return channelMap
  }

  // Get a representative channel name for display in the first column
  const getChannelDisplayName = (stateChannels: Record<string, ChannelData>): string => {
    // Get the first available channel
    const firstChannel = Object.values(stateChannels)[0]
    if (!firstChannel) return "Unknown Channel"

    // Use the clean name as it's usually the most generic
    return firstChannel.channel_names.clean
  }

  // Replace the getMergedCells function with this improved version
  const getMergedCells = (stateChannels: Record<string, ChannelData>): MergedCell[] => {
    const mergedCells: MergedCell[] = []
    const stateIndices: Record<string, number> = {}

    // Create a mapping of state codes to their index in ALL_STATES
    ALL_STATES.forEach((state, index) => {
      stateIndices[state.code] = index
    })

    // Check if this is channel 245 for debugging
    const isDebugChannel = Object.values(stateChannels)[0]?.channel_number === "245"

    if (isDebugChannel) {
      console.log("Starting getMergedCells for channel 245")
    }

    // First, identify which states have channels
    const statesWithChannels = new Set(Object.keys(stateChannels))

    // For each state in ALL_STATES, check if it has a channel
    let currentMergeStart = -1
    let currentChannelName: string | null = null

    for (let i = 0; i < ALL_STATES.length; i++) {
      const stateCode = ALL_STATES[i].code
      const hasChannel = statesWithChannels.has(stateCode)

      if (hasChannel) {
        const channel = stateChannels[stateCode]
        const channelName = channel.channel_names.location || channel.channel_name

        if (isDebugChannel) {
          console.log(`State ${stateCode} has channel: ${channelName}`)
        }

        // If we're not in a merge or the channel name is different, start a new merge
        if (currentMergeStart === -1 || channelName !== currentChannelName) {
          // If we were in a merge, end it
          if (currentMergeStart !== -1) {
            mergedCells.push({
              startIndex: currentMergeStart,
              endIndex: i - 1,
              channel: currentChannelName
                ? {
                    channel_names: {
                      location: currentChannelName,
                      clean: currentChannelName,
                      real: currentChannelName,
                    },
                    // Add other required properties with placeholder values
                    channel_id: "",
                    channel_slug: "",
                    channel_name: currentChannelName,
                    channel_number: "",
                    channel_group: "",
                    channel_logo: { light: "", dark: "" },
                  }
                : null,
            })
          }

          // Start a new merge
          currentMergeStart = i
          currentChannelName = channelName
        }
        // If the channel name is the same, continue the current merge
      } else {
        // This state doesn't have a channel

        // If we're in a merge, check if we should end it
        if (currentMergeStart !== -1) {
          // End the current merge
          mergedCells.push({
            startIndex: currentMergeStart,
            endIndex: i - 1,
            channel: currentChannelName
              ? {
                  channel_names: { location: currentChannelName, clean: currentChannelName, real: currentChannelName },
                  // Add other required properties with placeholder values
                  channel_id: "",
                  channel_slug: "",
                  channel_name: currentChannelName,
                  channel_number: "",
                  channel_group: "",
                  channel_logo: { light: "", dark: "" },
                }
              : null,
          })

          // Start a new "Not available" merge
          currentMergeStart = i
          currentChannelName = null
        } else if (currentMergeStart === -1) {
          // Start a new "Not available" merge
          currentMergeStart = i
          currentChannelName = null
        }
      }
    }

    // Add the last merge if there is one
    if (currentMergeStart !== -1) {
      mergedCells.push({
        startIndex: currentMergeStart,
        endIndex: ALL_STATES.length - 1,
        channel: currentChannelName
          ? {
              channel_names: { location: currentChannelName, clean: currentChannelName, real: currentChannelName },
              // Add other required properties with placeholder values
              channel_id: "",
              channel_slug: "",
              channel_name: currentChannelName,
              channel_number: "",
              channel_group: "",
              channel_logo: { light: "", dark: "" },
            }
          : null,
      })
    }

    if (isDebugChannel) {
      console.log("Final merged cells:", mergedCells)
    }

    return mergedCells
  }

  // Update the renderChannelRow function to better handle the merged cells
  const renderChannelRow = (network: string, channelNumber: string, stateChannels: Record<string, ChannelData>) => {
    // Add this line to debug channel 245
    debugChannelMerging(channelNumber, stateChannels)

    const mergedCells = getMergedCells(stateChannels)

    return (
      <TableRow key={`${network}-${channelNumber}`} className="hover:bg-muted/50">
        <TableCell className="border font-medium">
          <div className="flex items-center gap-2">
            {/* Show channel logo if available */}
            {Object.values(stateChannels)[0]?.channel_logo?.light && (
              <div className="flex justify-center items-center bg-muted/50 rounded-md size-10">
                <img
                  src={Object.values(stateChannels)[0].channel_logo.light || "/placeholder.svg"}
                  alt=""
                  className="p-1 max-w-full max-h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                  }}
                />
              </div>
            )}
            <div>
              <div>{getChannelDisplayName(stateChannels)}</div>
              <div className="text-muted-foreground text-xs">Ch {channelNumber}</div>
            </div>
          </div>
        </TableCell>

        {/* Render each state column */}
        {ALL_STATES.map((state, stateIndex) => {
          // Find the merged cell that contains this state index
          const mergedCell = mergedCells.find((cell) => stateIndex >= cell.startIndex && stateIndex <= cell.endIndex)

          // If we found a merged cell and this is the first state in the merged range,
          // render it with the appropriate colspan
          if (mergedCell && stateIndex === mergedCell.startIndex) {
            const colspan = mergedCell.endIndex - mergedCell.startIndex + 1

            if (mergedCell.channel) {
              // This is a channel cell
              return (
                <TableCell key={`state-${state.code}`} colSpan={colspan} className="border text-center">
                  <div className="font-medium text-sm">
                    {mergedCell.channel.channel_names.location || mergedCell.channel.channel_name}
                  </div>
                </TableCell>
              )
            } else {
              // This is a "Not available" cell
              return (
                <TableCell key={`state-${state.code}`} colSpan={colspan} className="border text-center">
                  <span className="text-muted-foreground text-xs">Not available</span>
                </TableCell>
              )
            }
          } else if (!mergedCell || stateIndex !== mergedCell.startIndex) {
            // Skip this cell as it's part of a colspan
            return null
          }

          // Fallback - should not reach here
          return (
            <TableCell key={`state-${state.code}`} className="border text-center">
              <span className="text-muted-foreground text-xs">Error</span>
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  // Add this debugging function right after the getMergedCells function
  const debugChannelMerging = (channelNumber: string, stateChannels: Record<string, ChannelData>) => {
    if (channelNumber === "245") {
      console.group(`Debugging Channel ${channelNumber} (ABC RN)`)

      // Log all state channels
      console.log("State channels:", stateChannels)

      // Log each state's channel name
      console.log("Channel names by state:")
      Object.entries(stateChannels).forEach(([stateCode, channel]) => {
        console.log(`${stateCode}: ${channel.channel_names.location || channel.channel_name}`)
      })

      // Test the merging logic
      const mergedCells = getMergedCells(stateChannels)
      console.log("Merged cells result:", mergedCells)

      // Log the comparison results
      if (Object.keys(stateChannels).length > 1) {
        console.log("Comparison results:")
        const states = Object.keys(stateChannels)
        for (let i = 0; i < states.length - 1; i++) {
          const state1 = states[i]
          const state2 = states[i + 1]
          const name1 = stateChannels[state1].channel_names.location || stateChannels[state1].channel_name
          const name2 = stateChannels[state2].channel_names.location || stateChannels[state2].channel_name
          console.log(
            `Comparing ${state1} (${name1}) with ${state2} (${name2}): ${name1 === name2 ? "MATCH" : "NO MATCH"}`,
          )
        }
      }

      console.groupEnd()
    }
  }

  // Get all unique channel types and specs
  const channelTypes = React.useMemo(() => {
    const types = new Set<string>()
    Object.values(channelData).forEach((channels) => {
      channels.forEach((channel) => {
        if (channel.other_data?.channel_type) {
          types.add(channel.other_data.channel_type)
        }
      })
    })
    return Array.from(types).sort()
  }, [channelData])

  const channelSpecs = React.useMemo(() => {
    const specs = new Set<string>()
    Object.values(channelData).forEach((channels) => {
      channels.forEach((channel) => {
        if (channel.other_data?.channel_specs) {
          specs.add(channel.other_data.channel_specs)
        }
      })
    })
    return Array.from(specs).sort()
  }, [channelData])

  // Apply filters to the channel map
  const filteredChannelMap = React.useMemo(() => {
    const channelMap = getChannelMap()

    if (
      !debouncedGlobalSearch &&
      selectedNetworks.length === 0 &&
      selectedChannelTypes.length === 0 &&
      selectedChannelSpecs.length === 0
    ) {
      return channelMap
    }

    const filteredMap: Record<string, Record<string, Record<string, ChannelData>>> = {}

    Object.entries(channelMap).forEach(([network, channels]) => {
      // Filter by network
      if (selectedNetworks.length > 0 && !selectedNetworks.includes(network)) {
        return
      }

      // Add network to filtered map
      filteredMap[network] = {}

      Object.entries(channels).forEach(([channelNumber, stateChannels]) => {
        // Check if any state's channel matches the filters
        const anyStateMatches = Object.values(stateChannels).some((channel) => {
          // Filter by channel type
          if (
            selectedChannelTypes.length > 0 &&
            (!channel.other_data?.channel_type || !selectedChannelTypes.includes(channel.other_data.channel_type))
          ) {
            return false
          }

          // Filter by channel specs
          if (
            selectedChannelSpecs.length > 0 &&
            (!channel.other_data?.channel_specs || !selectedChannelSpecs.includes(channel.other_data.channel_specs))
          ) {
            return false
          }

          // Filter by search term
          if (debouncedGlobalSearch) {
            const searchTerm = debouncedGlobalSearch.toLowerCase()
            return (
              channel.channel_name.toLowerCase().includes(searchTerm) ||
              channel.channel_names.real.toLowerCase().includes(searchTerm) ||
              channel.channel_number.toLowerCase().includes(searchTerm) ||
              channel.channel_group.toLowerCase().includes(searchTerm) ||
              (channel.other_data?.channel_type || "").toLowerCase().includes(searchTerm) ||
              (channel.other_data?.channel_specs || "").toLowerCase().includes(searchTerm)
            )
          }

          return true
        })

        if (anyStateMatches) {
          filteredMap[network][channelNumber] = stateChannels
        }
      })

      // Remove empty networks
      if (Object.keys(filteredMap[network]).length === 0) {
        delete filteredMap[network]
      }
    })

    return filteredMap
  }, [channelData, debouncedGlobalSearch, selectedNetworks, selectedChannelTypes, selectedChannelSpecs])

  // Calculate counts for filter options
  const networkCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    const channelMap = getChannelMap()

    Object.entries(channelMap).forEach(([network, channels]) => {
      // Count channels that would match other filters
      let count = 0

      Object.values(channels).forEach((stateChannels) => {
        const anyStateMatches = Object.values(stateChannels).some((channel) => {
          // Filter by channel type
          if (
            selectedChannelTypes.length > 0 &&
            (!channel.other_data?.channel_type || !selectedChannelTypes.includes(channel.other_data.channel_type))
          ) {
            return false
          }

          // Filter by channel specs
          if (
            selectedChannelSpecs.length > 0 &&
            (!channel.other_data?.channel_specs || !selectedChannelSpecs.includes(channel.other_data.channel_specs))
          ) {
            return false
          }

          // Filter by search term
          if (debouncedGlobalSearch) {
            const searchTerm = debouncedGlobalSearch.toLowerCase()
            return (
              channel.channel_name.toLowerCase().includes(searchTerm) ||
              channel.channel_names.real.toLowerCase().includes(searchTerm) ||
              channel.channel_number.toLowerCase().includes(searchTerm) ||
              channel.channel_group.toLowerCase().includes(searchTerm) ||
              (channel.other_data?.channel_type || "").toLowerCase().includes(searchTerm) ||
              (channel.other_data?.channel_specs || "").toLowerCase().includes(searchTerm)
            )
          }

          return true
        })

        if (anyStateMatches) {
          count++
        }
      })

      counts[network] = count
    })

    return counts
  }, [channelData, debouncedGlobalSearch, selectedChannelTypes, selectedChannelSpecs])

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}

    channelTypes.forEach((type) => {
      // Count channels that match this type and other filters
      let count = 0

      Object.values(channelData).forEach((channels) => {
        channels.forEach((channel) => {
          if (channel.other_data?.channel_type !== type) return

          // Filter by network
          if (selectedNetworks.length > 0 && !selectedNetworks.includes(channel.channel_group)) {
            return
          }

          // Filter by specs
          if (
            selectedChannelSpecs.length > 0 &&
            (!channel.other_data?.channel_specs || !selectedChannelSpecs.includes(channel.other_data.channel_specs))
          ) {
            return
          }

          // Filter by search
          if (debouncedGlobalSearch) {
            const searchTerm = debouncedGlobalSearch.toLowerCase()
            if (
              !channel.channel_name.toLowerCase().includes(searchTerm) &&
              !channel.channel_names.real.toLowerCase().includes(searchTerm) &&
              !channel.channel_number.toLowerCase().includes(searchTerm) &&
              !channel.channel_group.toLowerCase().includes(searchTerm) &&
              !(channel.other_data?.channel_type || "").toLowerCase().includes(searchTerm) &&
              !(channel.other_data?.channel_specs || "").toLowerCase().includes(searchTerm)
            ) {
              return
            }
          }

          count++
        })
      })

      counts[type] = count
    })

    return counts
  }, [channelData, channelTypes, debouncedGlobalSearch, selectedNetworks, selectedChannelSpecs])

  const specsCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}

    channelSpecs.forEach((spec) => {
      // Count channels that match this spec and other filters
      let count = 0

      Object.values(channelData).forEach((channels) => {
        channels.forEach((channel) => {
          if (channel.other_data?.channel_specs !== spec) return

          // Filter by network
          if (selectedNetworks.length > 0 && !selectedNetworks.includes(channel.channel_group)) {
            return
          }

          // Filter by type
          if (
            selectedChannelTypes.length > 0 &&
            (!channel.other_data?.channel_type || !selectedChannelTypes.includes(channel.other_data.channel_type))
          ) {
            return
          }

          // Filter by search
          if (debouncedGlobalSearch) {
            const searchTerm = debouncedGlobalSearch.toLowerCase()
            if (
              !channel.channel_name.toLowerCase().includes(searchTerm) &&
              !channel.channel_names.real.toLowerCase().includes(searchTerm) &&
              !channel.channel_number.toLowerCase().includes(searchTerm) &&
              !channel.channel_group.toLowerCase().includes(searchTerm) &&
              !(channel.other_data?.channel_type || "").toLowerCase().includes(searchTerm) &&
              !(channel.other_data?.channel_specs || "").toLowerCase().includes(searchTerm)
            ) {
              return
            }
          }

          count++
        })
      })

      counts[spec] = count
    })

    return counts
  }, [channelData, channelSpecs, debouncedGlobalSearch, selectedNetworks, selectedChannelTypes])

  // Clear all filters
  const clearFilters = () => {
    setGlobalFilter("")
    setSelectedNetworks([])
    setSelectedChannelTypes([])
    setSelectedChannelSpecs([])
    setNetworkSearch("")
    setTypeSearch("")
    setSpecsSearch("")
  }

  // Count total channels and filtered channels
  const totalChannels = React.useMemo(() => {
    let count = 0
    Object.values(getChannelMap()).forEach((network) => {
      count += Object.keys(network).length
    })
    return count
  }, [channelData])

  const filteredChannels = React.useMemo(() => {
    let count = 0
    Object.values(filteredChannelMap).forEach((network) => {
      count += Object.keys(network).length
    })
    return count
  }, [filteredChannelMap])

  // Render a row with merged cells

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch value={globalFilter} onChange={setGlobalFilter} placeholder="Search channels..." />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          title="Network"
          options={networkGroups}
          filters={selectedNetworks}
          onFilterChange={(value) => {
            setSelectedNetworks((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
          }}
          searchValue={networkSearch}
          onSearchChange={setNetworkSearch}
          counts={networkCounts}
          showSearch={networkGroups.length > 10}
        />
        <FilterSection
          title="Channel Type"
          options={channelTypes}
          filters={selectedChannelTypes}
          onFilterChange={(value) => {
            setSelectedChannelTypes((prev) =>
              prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
            )
          }}
          searchValue={typeSearch}
          onSearchChange={setTypeSearch}
          counts={typeCounts}
          showSearch={channelTypes.length > 10}
        />
        <FilterSection
          title="Channel Specs"
          options={channelSpecs}
          filters={selectedChannelSpecs}
          onFilterChange={(value) => {
            setSelectedChannelSpecs((prev) =>
              prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
            )
          }}
          searchValue={specsSearch}
          onSearchChange={setSpecsSearch}
          counts={specsCounts}
          showSearch={channelSpecs.length > 10}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full text-xs">
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredChannels} of {totalChannels} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  )

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button onClick={fetchAllChannelData} variant="outline" size="sm" className="gap-1" disabled={loading}>
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      {/* Debug button - only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <Button
          onClick={() => {
            // Find channel 245 in the data and log it
            console.group("Channel 245 Debug")
            Object.entries(channelData).forEach(([stateCode, channels]) => {
              const ch245 = channels.find((c) => c.channel_number === "245")
              if (ch245) {
                console.log(`${stateCode}: ${ch245.channel_names.location || ch245.channel_name}`)
              } else {
                console.log(`${stateCode}: No channel 245`)
              }
            })
            console.groupEnd()
          }}
          variant="outline"
          size="sm"
        >
          Debug Ch 245
        </Button>
      )}
    </div>
  )

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-destructive text-xl">Error</h2>
          <p>{error}</p>
          <Button onClick={fetchAllChannelData} className="mt-4">
            <RotateCw className="mr-2 w-4 h-4" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout sidebar={sidebar} title="VAST Channel List - Mapped by State" actions={headerActions}>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          <span className="ml-2 text-lg">Loading channel data...</span>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          <Table>
            <TableBody>
              {Object.entries(filteredChannelMap).map(([network, channels]) => {
                const sortedChannels = Object.entries(channels).sort(([numA, _], [numB, __]) => {
                  // Sort by channel number numerically
                  return Number.parseInt(numA) - Number.parseInt(numB)
                })

                const isCollapsed = collapsedNetworks[network]

                return (
                  <React.Fragment key={network}>
                    <TableRow
                      className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                      onClick={() => toggleNetworkCollapse(network)}
                    >
                      <TableCell colSpan={1 + ZONES.flatMap((z) => z.states).length} className="border font-bold">
                        <div className="flex justify-between items-center">
                          <span>{network}</span>
                          <Button variant="ghost" size="sm" className="p-0 w-6 h-6">
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {!isCollapsed && (
                      <>
                        <TableRow>
                          <TableHead className="bg-muted border">Channel</TableHead>
                          {ZONES.flatMap((zone) =>
                            zone.states.map((state) => (
                              <TableHead key={state.code} className={`text-center border ${zone.color}`}>
                                {state.name}
                              </TableHead>
                            )),
                          )}
                        </TableRow>
                        {sortedChannels.map(([channelNumber, stateChannels]) =>
                          renderChannelRow(network, channelNumber, stateChannels),
                        )}
                      </>
                    )}
                  </React.Fragment>
                )
              })}
              {Object.keys(filteredChannelMap).length === 0 && (
                <TableRow>
                  <TableCell colSpan={1 + ZONES.flatMap((z) => z.states).length} className="h-24 text-center">
                    No results found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="h-24" aria-hidden="true"></div> {/* Spacer element */}
        </div>
      )}
    </SidebarLayout>
  )
}
