"use client";

import { format } from "date-fns";
import { Calendar, Clock, Film, Layers, Tv } from "lucide-react";
import type { Channel } from "@/components/epg/types";
import { getProgramCategoryIcon } from "@/components/epg/utils";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type DensityOption = "compact" | "normal" | "detailed";

interface ChannelSidebarProps {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // View controls
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  density: DensityOption;
  setDensity: (density: DensityOption) => void;

  // Display options
  useCategories: boolean;
  setUseCategories: (use: boolean) => void;
  showPastPrograms: boolean;
  setShowPastPrograms: (show: boolean) => void;
  showTimeBlocks: boolean;
  setShowTimeBlocks: (show: boolean) => void;

  // Filters
  uniqueCategories: string[];
  filteredCategory: string | null;
  setFilteredCategory: (category: string | null) => void;

  // Channel info
  channelData: Channel | null;

  // Navigation info
  days: Date[];
  startDayIndex: number;
  visibleDays: number;
  daysLength: number;
}

export function ChannelSidebar({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  density,
  setDensity,
  useCategories,
  setUseCategories,
  showPastPrograms,
  setShowPastPrograms,
  showTimeBlocks,
  setShowTimeBlocks,
  uniqueCategories,
  filteredCategory,
  setFilteredCategory,
  channelData,
  days,
  startDayIndex,
  visibleDays,
  daysLength,
}: ChannelSidebarProps) {
  return (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setSearchTerm}
          placeholder="Search programs..."
          searchValue={searchTerm}
        />
      </SidebarHeader>
      <SidebarContent>
        <div className="border-b px-4 py-3">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">View Mode</span>
              <Tabs
                className="w-auto"
                onValueChange={(v) => setViewMode(v as "grid" | "list")}
                value={viewMode}
              >
                <TabsList>
                  <TabsTrigger className="flex items-center gap-1" value="grid">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </TabsTrigger>
                  <TabsTrigger className="flex items-center gap-1" value="list">
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Display Density</span>
              <ToggleGroup
                onValueChange={(value) =>
                  value && setDensity(value as DensityOption)
                }
                type="single"
                value={density}
              >
                <ToggleGroupItem aria-label="Compact view" value="compact">
                  <Layers className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="Normal view" value="normal">
                  <Tv className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem aria-label="Detailed view" value="detailed">
                  <Film className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-sm" htmlFor="use-categories">
                Color by category
              </label>
              <Switch
                checked={useCategories}
                className="data-[state=checked]:bg-primary"
                id="use-categories"
                onCheckedChange={setUseCategories}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-sm" htmlFor="show-past">
                Show past programs
              </label>
              <Switch
                checked={showPastPrograms}
                className="data-[state=checked]:bg-primary"
                id="show-past"
                onCheckedChange={setShowPastPrograms}
              />
            </div>

            {viewMode === "list" && (
              <div className="flex items-center justify-between">
                <label
                  className="font-medium text-sm"
                  htmlFor="show-timeblocks"
                >
                  Group by time blocks
                </label>
                <Switch
                  checked={showTimeBlocks}
                  className="data-[state=checked]:bg-primary"
                  id="show-timeblocks"
                  onCheckedChange={setShowTimeBlocks}
                />
              </div>
            )}
          </div>
        </div>

        {uniqueCategories.length > 0 && (
          <div className="border-b px-4 py-3">
            <div className="mb-2 font-medium text-sm">Filter by Category</div>
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
              <div
                className={cn(
                  "cursor-pointer rounded px-2 py-1 text-sm hover:bg-muted",
                  !filteredCategory && "bg-muted font-medium"
                )}
                onClick={() => setFilteredCategory(null)}
              >
                All Categories
              </div>
              {uniqueCategories.map((category) => {
                const CategoryIcon = getProgramCategoryIcon(
                  category ? [category] : []
                );
                return (
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm hover:bg-muted",
                      filteredCategory === category && "bg-muted font-medium"
                    )}
                    key={category}
                    onClick={() => setFilteredCategory(category)}
                  >
                    {CategoryIcon ? (
                      <CategoryIcon className="h-3 w-3" />
                    ) : (
                      <Tv className="h-3 w-3" />
                    )}
                    <span>{category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Channel info */}
        {channelData && (
          <div className="border-b px-4 py-3">
            <div className="mb-2 font-medium text-sm">Channel Information</div>
            <div className="flex items-center space-x-3">
              {channelData.channel.icon.light && (
                <div className="flex-shrink-0">
                  <img
                    alt={channelData.channel.name.real}
                    className="block h-10 w-auto object-contain dark:hidden"
                    src={channelData.channel.icon.light || "/placeholder.svg"}
                  />
                  <img
                    alt={channelData.channel.name.real}
                    className="hidden h-10 w-auto object-contain dark:block"
                    src={channelData.channel.icon.dark || "/placeholder.svg"}
                  />
                </div>
              )}
              <div>
                <div className="font-medium">
                  {channelData.channel.name.real}
                </div>
                {channelData.channel.lcn && (
                  <div className="text-muted-foreground text-sm">
                    Channel {channelData.channel.lcn}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-center text-muted-foreground text-xs">
          {days[startDayIndex] && format(days[startDayIndex], "MMM d")} -{" "}
          {days[startDayIndex + visibleDays - 1] &&
            format(days[startDayIndex + visibleDays - 1], "MMM d")}{" "}
          ({visibleDays} of {daysLength} days)
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );
}
