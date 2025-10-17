/**
 * Timeline Component
 * A responsive, accessible timeline component for visualizing channel history
 */

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_BADGES } from "./constants";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineRow } from "./TimelineRow";
import type { TimelineProps, TimelineStyle } from "./types";
import {
  generateTicks,
  getResponsiveStyle,
  validateTimelineDoc,
} from "./utils";

/**
 * Timeline Error Boundary Component
 */
export const TimelineErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8 text-center">
          <div>
            <h3 className="font-semibold text-destructive text-lg">
              Timeline Error
            </h3>
            <p className="text-muted-foreground text-sm">
              Something went wrong while rendering the timeline.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

/**
 * Loading State Component
 */
const TimelineLoading: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-muted-foreground text-sm">Loading timeline...</span>
    </div>
  </div>
);

/**
 * Error State Component
 */
const TimelineError: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex items-center justify-center p-8 text-center">
    <div>
      <h3 className="font-semibold text-destructive text-lg">Timeline Error</h3>
      <p className="text-muted-foreground text-sm">{error}</p>
    </div>
  </div>
);

/**
 * Main Timeline Component
 */
export const Timeline: React.FC<TimelineProps> = React.memo(
  ({
    doc,
    className,
    isLoading = false,
    error = null,
    onEventClick,
    onSpanClick,
  }) => {
    const isMobile = useIsMobile();

    // Validate document structure
    const isValid = React.useMemo(() => validateTimelineDoc(doc), [doc]);

    // Get responsive styles
    const responsiveStyle = React.useMemo(
      () => getResponsiveStyle(isMobile),
      [isMobile]
    );

    // Merge with document styles
    const style = React.useMemo(
      () => ({
        ...responsiveStyle,
        ...doc.style,
      }) as Required<TimelineStyle>,
      [responsiveStyle, doc.style]
    );

    // Calculate dimensions
    const totalYears = Number(doc.axis.end) - Number(doc.axis.start);
    const trackWidth = totalYears * style.pxPerYear;

    // Generate ticks
    const ticks = React.useMemo(
      () => generateTicks(doc.axis.start, doc.axis.end, doc.axis.tickEvery),
      [doc.axis.start, doc.axis.end, doc.axis.tickEvery]
    );

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        // Implement horizontal scrolling
        const container = event.currentTarget.querySelector(
          "[data-timeline-track]"
        );
        if (container) {
          const scrollAmount = event.key === "ArrowLeft" ? -100 : 100;
          container.scrollLeft += scrollAmount;
        }
      }
    }, []);

    // Show loading state
    if (isLoading) {
      return <TimelineLoading />;
    }

    // Show error state
    if (error) {
      return <TimelineError error={error} />;
    }

    // Show validation error
    if (!isValid) {
      return <TimelineError error="Invalid timeline data structure" />;
    }

    return (
      <TimelineErrorBoundary>
        <div
          aria-describedby="timeline-description"
          aria-label="Timeline visualization"
          className={cn("h-full w-full overflow-auto bg-background", className)}
          onKeyDown={handleKeyDown}
          role="application"
        >
          <TimelineHeader
            axis={doc.axis}
            labelWidth={style.labelWidth}
            style={style}
          />

          <div className="relative">
            {doc.rows.map((row) => (
              <TimelineRow
                axis={doc.axis}
                eventTypeBadge={EVENT_TYPE_BADGES}
                key={row.id}
                labelWidth={style.labelWidth}
                onEventClick={onEventClick}
                onSpanClick={onSpanClick}
                row={row}
                style={style}
                ticks={ticks}
                trackWidth={trackWidth}
              />
            ))}
          </div>
        </div>
      </TimelineErrorBoundary>
    );
  }
);

Timeline.displayName = "Timeline";
