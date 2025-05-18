"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronUp, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { Channel } from "./types"

interface DebugPanelProps {
  rawChannels: Channel[]
  processedChannels: Channel[]
  onToggleDeduplication: (strategy: string) => void
  currentStrategy: string
}

export function DebugPanel({
  rawChannels,
  processedChannels,
  onToggleDeduplication,
  currentStrategy,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"raw" | "processed">("raw")
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({})

  // Count channels with the same ID
  const channelIdCounts: Record<string, { count: number; lcns: string[] }> = {}
  rawChannels.forEach((channel) => {
    const id = channel.channel.id
    if (!channelIdCounts[id]) {
      channelIdCounts[id] = { count: 0, lcns: [] }
    }
    channelIdCounts[id].count++
    channelIdCounts[id].lcns.push(channel.channel.lcn)
  })

  // Find duplicate channels (same ID, different LCN)
  const duplicateChannels = Object.entries(channelIdCounts)
    .filter(([_, data]) => data.count > 1)
    .map(([id, data]) => ({
      id,
      count: data.count,
      lcns: data.lcns,
    }))

  // Toggle channel expansion
  const toggleChannel = (channelKey: string) => {
    setExpandedChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }))
  }

  // Render channel details
  const renderChannelDetails = (channel: Channel) => {
    const channelKey = `${channel.channel.id}-${channel.channel.lcn}`
    const isDuplicate = channelIdCounts[channel.channel.id]?.count > 1

    return (
      <div
        key={channelKey}
        className="mb-2 border rounded-md overflow-hidden"
        style={{ borderColor: isDuplicate ? "red" : "transparent" }}
      >
        <div
          className="flex justify-between items-center bg-muted/20 hover:bg-muted/30 p-2 cursor-pointer"
          onClick={() => toggleChannel(channelKey)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{channel.channel.name.clean}</span>
            <Badge variant="outline">{channel.channel.lcn}</Badge>
            <Badge variant="secondary">ID: {channel.channel.id}</Badge>
            {isDuplicate && (
              <Badge variant="destructive">Duplicate ID ({channelIdCounts[channel.channel.id].count})</Badge>
            )}
          </div>
          {expandedChannels[channelKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {expandedChannels[channelKey] && (
          <div className="bg-muted/10 p-2 text-xs">
            <div className="mb-2">
              <strong>Channel Data:</strong>
              <pre className="bg-muted/20 mt-1 p-2 rounded overflow-x-auto">
                {JSON.stringify(
                  {
                    id: channel.channel.id,
                    lcn: channel.channel.lcn,
                    name: channel.channel.name,
                    slug: channel.channel.slug,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            <div>
              <strong>Programs ({channel.programs.length}):</strong>
              <div className="bg-muted/20 mt-1 p-2 rounded max-h-40 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="pr-2">Guide ID</th>
                      <th className="pr-2">Title</th>
                      <th className="pr-2">Start</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channel.programs.slice(0, 5).map((program, idx) => (
                      <tr key={`${program.guideid || idx}`}>
                        <td className="pr-2">{program.guideid || "N/A"}</td>
                        <td className="pr-2">{program.title}</td>
                        <td className="pr-2">{new Date(program.start_time).toLocaleTimeString()}</td>
                        <td>{new Date(program.end_time).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                    {channel.programs.length > 5 && (
                      <tr>
                        <td colSpan={4} className="text-center">
                          ... and {channel.programs.length - 5} more programs
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="right-4 bottom-4 z-50 fixed flex items-center gap-1"
        onClick={() => setIsOpen(true)}
      >
        <Bug size={16} />
        <span>Debug</span>
        {duplicateChannels.length > 0 && (
          <Badge variant="destructive" className="ml-1">
            {duplicateChannels.length}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50">
      <div className="flex flex-col bg-background shadow-lg rounded-lg w-[90vw] max-w-4xl h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-xl">EPG Debug Panel</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-2 font-medium">Channel Statistics</h3>
              <div className="flex gap-4">
                <div className="bg-muted/20 p-3 rounded-md">
                  <div className="font-bold text-2xl">{rawChannels.length}</div>
                  <div className="text-muted-foreground text-sm">Raw Channels</div>
                </div>
                <div className="bg-muted/20 p-3 rounded-md">
                  <div className="font-bold text-2xl">{processedChannels.length}</div>
                  <div className="text-muted-foreground text-sm">Processed Channels</div>
                </div>
                <div className="bg-muted/20 p-3 rounded-md">
                  <div className="font-bold text-2xl">{duplicateChannels.length}</div>
                  <div className="text-muted-foreground text-sm">Channels with Duplicate IDs</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Deduplication Strategy</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="none"
                    checked={currentStrategy === "none"}
                    onCheckedChange={() => onToggleDeduplication("none")}
                  />
                  <Label htmlFor="none">None (Show all channels)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="id-only"
                    checked={currentStrategy === "id-only"}
                    onCheckedChange={() => onToggleDeduplication("id-only")}
                  />
                  <Label htmlFor="id-only">Deduplicate by ID only (Keep first occurrence)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="id-lcn"
                    checked={currentStrategy === "id-lcn"}
                    onCheckedChange={() => onToggleDeduplication("id-lcn")}
                  />
                  <Label htmlFor="id-lcn">Deduplicate by ID+LCN (Current strategy)</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-2 px-4 text-center ${selectedTab === "raw" ? "bg-muted font-medium" : ""}`}
            onClick={() => setSelectedTab("raw")}
          >
            Raw Channels ({rawChannels.length})
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${selectedTab === "processed" ? "bg-muted font-medium" : ""}`}
            onClick={() => setSelectedTab("processed")}
          >
            Processed Channels ({processedChannels.length})
          </button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {selectedTab === "raw" ? (
            <>
              <h3 className="mb-2 font-medium">Raw Channels (from API)</h3>
              {duplicateChannels.length > 0 && (
                <div className="bg-destructive/10 mb-4 p-3 border border-destructive/20 rounded-md">
                  <h4 className="mb-2 font-medium">Duplicate Channel IDs</h4>
                  <div className="space-y-1">
                    {duplicateChannels.map(({ id, count, lcns }) => (
                      <div key={id} className="flex items-center gap-2">
                        <Badge variant="outline">ID: {id}</Badge>
                        <span>appears {count} times with LCNs:</span>
                        <div className="flex gap-1">
                          {lcns.map((lcn) => (
                            <Badge key={lcn} variant="secondary">
                              {lcn}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {rawChannels.map(renderChannelDetails)}
            </>
          ) : (
            <>
              <h3 className="mb-2 font-medium">Processed Channels (after filtering/deduplication)</h3>
              {processedChannels.map(renderChannelDetails)}
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
