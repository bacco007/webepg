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
 * Improved error boundary with better error tracking and reset functionality
 */
export class TimelineErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    // Store error for display but avoid console in production
    if (process.env.NODE_ENV === "development") {
      // Development-only error logging
      // biome-ignore lint/suspicious/noConsole: Development debugging
      console.error("Timeline Error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div>
              <h3 className="font-semibold text-destructive text-lg">
                Timeline Error
              </h3>
              <p className="text-muted-foreground text-sm">
                Something went wrong while rendering the timeline.
              </p>
              {this.state.error && (
                <p className="mt-2 font-mono text-destructive/70 text-xs">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              className="rounded-md border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted"
              onClick={this.handleReset}
              type="button"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

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
      () =>
        ({
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
          style={{
            contain: "paint",
            willChange: "scroll-position",
          }}
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
                colorMap={doc.colorMap}
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
