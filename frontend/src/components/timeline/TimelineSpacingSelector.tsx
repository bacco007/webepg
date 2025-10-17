/**
 * Timeline Spacing Selector Component
 * Allows users to choose between different spacing modes for the timeline
 */

import { Maximize2, Minimize2, Space } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type TimelineSpacingMode = "standard" | "half" | "fill";

type TimelineSpacingSelectorProps = {
  value: TimelineSpacingMode;
  onChange: (mode: TimelineSpacingMode) => void;
  className?: string;
};

export function TimelineSpacingSelector({
  value,
  onChange,
  className,
}: TimelineSpacingSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Space className="h-4 w-4 text-muted-foreground" />
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Timeline spacing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">
            <div className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              <span>Standard Gap</span>
            </div>
          </SelectItem>
          <SelectItem value="half">
            <div className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4" />
              <span>Half Gap</span>
            </div>
          </SelectItem>
          <SelectItem value="fill">
            <div className="flex items-center gap-2">
              <Space className="h-4 w-4" />
              <span>Fill Space</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
