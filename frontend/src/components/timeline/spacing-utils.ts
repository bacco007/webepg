/**
 * Timeline Spacing Utilities
 * Calculate spacing values based on different modes
 */

import { TIMELINE_CONSTANTS } from "./constants";
import type { TimelineSpacingMode } from "./TimelineSpacingSelector";

type SpacingCalculationParams = {
  mode: TimelineSpacingMode;
  isMobile: boolean;
  viewportWidth?: number;
  timelineStart: number;
  timelineEnd: number;
};

/**
 * Calculate pixels per year based on spacing mode
 */
export function calculatePxPerYear({
  mode,
  isMobile,
  viewportWidth,
  timelineStart,
  timelineEnd,
}: SpacingCalculationParams): number {
  // Get standard values
  const standardPxPerYear = isMobile
    ? TIMELINE_CONSTANTS.MOBILE_PX_PER_YEAR
    : TIMELINE_CONSTANTS.DEFAULT_PX_PER_YEAR;

  switch (mode) {
    case "standard":
      return standardPxPerYear;

    case "half":
      return standardPxPerYear / 2;

    case "fill": {
      if (!viewportWidth || viewportWidth === 0) {
        // Fallback to half if viewport width not available
        return standardPxPerYear / 2;
      }

      // Calculate available width for timeline
      // Account for label width and minimal padding/scrollbar
      const padding = 120; // Account for label width, margins, scrollbar
      const availableWidth = viewportWidth - padding;

      // Calculate total years in timeline
      const totalYears = timelineEnd - timelineStart;

      if (totalYears <= 0) {
        return standardPxPerYear;
      }

      // Calculate pixels per year to fill the space
      // Ensure it's divisible by 12 for clean month calculations
      const rawPxPerYear = availableWidth / totalYears;
      const pxPerYear = Math.floor(rawPxPerYear / 12) * 12;

      // Ensure minimum of 24px per year (2px per month) for readability
      const minPxPerYear = 24;

      return Math.max(minPxPerYear, pxPerYear);
    }

    default:
      return standardPxPerYear;
  }
}

/**
 * Get spacing mode description
 */
export function getSpacingModeDescription(mode: TimelineSpacingMode): string {
  switch (mode) {
    case "standard":
      return "Standard spacing - shows timeline at default scale";
    case "half":
      return "Compact spacing - shows approximately 2x more years";
    case "fill":
      return "Fill space - automatically fits timeline to screen width";
    default:
      return "";
  }
}
