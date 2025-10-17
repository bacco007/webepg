import { Layers, Table2 } from "lucide-react";
import type React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewMode = "networks" | "flat";

type ViewModeToggleProps = {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
};

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  setViewMode,
}) => (
  <TooltipProvider>
    <ToggleGroup
      onValueChange={(value) => value && setViewMode(value as ViewMode)}
      type="single"
      value={viewMode}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem aria-label="Group by networks" value="networks">
            <Layers className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Group by networks</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem aria-label="Single table" value="flat">
            <Table2 className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Single table</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  </TooltipProvider>
);

// Keep the old export for backward compatibility
export const DensityToggle: React.FC<{
  density: string;
  setDensity: () => void;
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
}> = ({ viewMode, setViewMode }) => (
  <ViewModeToggle setViewMode={setViewMode} viewMode={viewMode} />
);
