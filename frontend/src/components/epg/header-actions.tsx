"use client";

import { Clock, RefreshCw } from "lucide-react";
import { ChannelDropdown } from "@/components/epg/channel-dropdown";
import { Button } from "@/components/ui/button";

interface HeaderActionsProps {
  channelSlug: string;
  viewMode: "grid" | "list";
  isLoading: boolean;
  onRefresh: () => void;
  onScrollToCurrentTime: () => void;
}

export function HeaderActions({
  channelSlug,
  viewMode,
  isLoading,
  onRefresh,
  onScrollToCurrentTime,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <ChannelDropdown channelSlug={channelSlug} />
      {viewMode === "grid" && (
        <Button
          className="flex items-center gap-1"
          onClick={onScrollToCurrentTime}
          size="sm"
          variant="outline"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Now</span>
        </Button>
      )}
      <Button
        className="gap-1"
        disabled={isLoading}
        onClick={onRefresh}
        size="sm"
        variant="outline"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );
}
