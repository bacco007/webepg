"use client";

import { Bug, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import type { Channel } from "./types";

interface DebugPanelProps {
  rawChannels: Channel[];
  processedChannels: Channel[];
  onToggleDeduplication: (strategy: string) => void;
  currentStrategy: string;
}

export function DebugPanel({
  rawChannels,
  processedChannels,
  onToggleDeduplication,
  currentStrategy,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"raw" | "processed">("raw");
  const [expandedChannels, setExpandedChannels] = useState<
    Record<string, boolean>
  >({});

  // Count channels with the same ID
  const channelIdCounts: Record<string, { count: number; lcns: string[] }> = {};
  for (const channel of rawChannels) {
    const id = channel.channel.id;
    if (!channelIdCounts[id]) {
      channelIdCounts[id] = { count: 0, lcns: [] };
    }
    channelIdCounts[id].count += 1;
    channelIdCounts[id].lcns.push(channel.channel.lcn);
  }

  // Find duplicate channels (same ID, different LCN)
  const duplicateChannels = Object.entries(channelIdCounts)
    .filter(([_, data]) => data.count > 1)
    .map(([id, data]) => ({
      count: data.count,
      id,
      lcns: data.lcns,
    }));

  // Toggle channel expansion
  const toggleChannel = (channelKey: string) => {
    setExpandedChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  };

  // Render channel details
  const renderChannelDetails = (channel: Channel) => {
    const channelKey = `${channel.channel.id}-${channel.channel.lcn}`;
    const isDuplicate = channelIdCounts[channel.channel.id]?.count > 1;

    return (
      <div
        className="mb-2 overflow-hidden rounded-md border"
        key={channelKey}
        style={{ borderColor: isDuplicate ? "red" : "transparent" }}
      >
        <div
          className="flex cursor-pointer items-center justify-between bg-muted/20 p-2 hover:bg-muted/30"
          onClick={() => toggleChannel(channelKey)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{channel.channel.name.clean}</span>
            <Badge variant="outline">{channel.channel.lcn}</Badge>
            <Badge variant="secondary">ID: {channel.channel.id}</Badge>
            {isDuplicate && (
              <Badge variant="destructive">
                Duplicate ID ({channelIdCounts[channel.channel.id].count})
              </Badge>
            )}
          </div>
          {expandedChannels[channelKey] ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </div>

        {expandedChannels[channelKey] && (
          <div className="bg-muted/10 p-2 text-xs">
            <div className="mb-2">
              <strong>Channel Data:</strong>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/20 p-2">
                {JSON.stringify(
                  {
                    id: channel.channel.id,
                    lcn: channel.channel.lcn,
                    name: channel.channel.name,
                    slug: channel.channel.slug,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div>
              <strong>Programs ({channel.programs.length}):</strong>
              <div className="mt-1 max-h-40 overflow-x-auto rounded bg-muted/20 p-2">
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
                        <td className="pr-2">
                          {new Date(program.start_time).toLocaleTimeString()}
                        </td>
                        <td>
                          {new Date(program.end_time).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {channel.programs.length > 5 && (
                      <tr>
                        <td className="text-center" colSpan={4}>
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
    );
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed right-4 bottom-4 z-50 flex items-center gap-1"
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
      >
        <Bug size={16} />
        <span>Debug</span>
        {duplicateChannels.length > 0 && (
          <Badge className="ml-1" variant="destructive">
            {duplicateChannels.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[80vh] w-[90vw] max-w-4xl flex-col rounded-lg bg-background shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold text-xl">EPG Debug Panel</h2>
          <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
            <X size={18} />
          </Button>
        </div>

        <div className="border-b p-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-2 font-medium">Channel Statistics</h3>
              <div className="flex gap-4">
                <div className="rounded-md bg-muted/20 p-3">
                  <div className="font-bold text-2xl">{rawChannels.length}</div>
                  <div className="text-muted-foreground text-sm">
                    Raw Channels
                  </div>
                </div>
                <div className="rounded-md bg-muted/20 p-3">
                  <div className="font-bold text-2xl">
                    {processedChannels.length}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Processed Channels
                  </div>
                </div>
                <div className="rounded-md bg-muted/20 p-3">
                  <div className="font-bold text-2xl">
                    {duplicateChannels.length}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Channels with Duplicate IDs
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Deduplication Strategy</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentStrategy === "none"}
                    id="none"
                    onCheckedChange={() => onToggleDeduplication("none")}
                  />
                  <Label htmlFor="none">None (Show all channels)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentStrategy === "id-only"}
                    id="id-only"
                    onCheckedChange={() => onToggleDeduplication("id-only")}
                  />
                  <Label htmlFor="id-only">
                    Deduplicate by ID only (Keep first occurrence)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentStrategy === "id-lcn"}
                    id="id-lcn"
                    onCheckedChange={() => onToggleDeduplication("id-lcn")}
                  />
                  <Label htmlFor="id-lcn">
                    Deduplicate by ID+LCN (Current strategy)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 px-4 py-2 text-center ${selectedTab === "raw" ? "bg-muted font-medium" : ""}`}
            onClick={() => setSelectedTab("raw")}
            type="button"
          >
            Raw Channels ({rawChannels.length})
          </button>
          <button
            className={`flex-1 px-4 py-2 text-center ${selectedTab === "processed" ? "bg-muted font-medium" : ""}`}
            onClick={() => setSelectedTab("processed")}
            type="button"
          >
            Processed Channels ({processedChannels.length})
          </button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {selectedTab === "raw" ? (
            <>
              <h3 className="mb-2 font-medium">Raw Channels (from API)</h3>
              {duplicateChannels.length > 0 && (
                <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                  <h4 className="mb-2 font-medium">Duplicate Channel IDs</h4>
                  <div className="space-y-1">
                    {duplicateChannels.map(({ id, count, lcns }) => (
                      <div className="flex items-center gap-2" key={id}>
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
              <h3 className="mb-2 font-medium">
                Processed Channels (after filtering/deduplication)
              </h3>
              {processedChannels.map(renderChannelDetails)}
            </>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
