import {
  ChevronDown,
  LayoutGrid,
  List,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GroupBy, ViewMode } from "@/lib/nownext-types";

type ViewControlsProps = {
  groupBy: GroupBy;
  viewMode: ViewMode;
  onGroupByChange: (groupBy: GroupBy) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onRefresh: () => void;
  isLoading?: boolean;
};

export function ViewControls({
  groupBy,
  viewMode,
  onGroupByChange,
  onViewModeChange,
  onRefresh,
  isLoading = false,
}: ViewControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="sm:w-auto" variant="outline">
            {groupBy === "none"
              ? "Group By"
              : `Grouped by ${groupBy === "channel_group" ? "Channel Group" : "Channel Type"}`}
            <ChevronDown className="ml-2 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onGroupByChange("none")}>
            No Grouping
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onGroupByChange("channel_group")}>
            Group by Channel Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="justify-start" variant="outline">
            {(() => {
              if (viewMode === "card") {
                return <LayoutGrid className="mr-2 size-4" />;
              }
              if (viewMode === "table") {
                return <List className="mr-2 size-4" />;
              }
              return <Smartphone className="mr-2 size-4" />;
            })()}
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewModeChange("card")}>
            <LayoutGrid className="mr-2 size-4" />
            Card
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewModeChange("table")}>
            <List className="mr-2 size-4" />
            Table
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewModeChange("mobile")}>
            <Smartphone className="mr-2 size-4" />
            Mobile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        aria-label="Refresh data"
        disabled={isLoading}
        onClick={onRefresh}
        size="icon"
        variant="outline"
      >
        <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
