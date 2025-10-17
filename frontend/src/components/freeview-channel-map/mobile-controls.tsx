import type React from "react";
import type { Density } from "@/types/channel-map";
import { DensityToggle, type ViewMode } from "./density-toggle";
import { LocationSelector } from "./location-selector";

type MobileControlsProps = {
  isMobile: boolean;
  locations: string[];
  visibleLocations: string[];
  setVisibleLocations: (locations: string[]) => void;
  density: Density;
  setDensity: (density: Density) => void;
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
};

export const MobileControls: React.FC<MobileControlsProps> = ({
  isMobile,
  locations,
  visibleLocations,
  setVisibleLocations,
  density,
  setDensity,
  viewMode,
  setViewMode,
}) => {
  if (!isMobile) {
    return null;
  }
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <LocationSelector
        locations={locations}
        setVisibleLocations={setVisibleLocations}
        visibleLocations={visibleLocations}
      />
      <DensityToggle
        density={density}
        setDensity={() =>
          setDensity(density === "comfortable" ? "compact" : "comfortable")
        }
        setViewMode={setViewMode}
        viewMode={viewMode}
      />
    </div>
  );
};
