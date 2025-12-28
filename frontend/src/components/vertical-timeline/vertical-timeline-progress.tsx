"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { FormattedTimelineEvent } from "@/lib/vertical-timeline-utils";

interface VerticalTimelineProgressProps {
  events: FormattedTimelineEvent[];
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function VerticalTimelineProgress({
  events,
  scrollContainerRef,
  className,
}: VerticalTimelineProgressProps) {
  const [yearBasedProgress, setYearBasedProgress] = useState(0);
  const [currentYearRange, setCurrentYearRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // Callback ref to measure width as soon as element is mounted
  const setProgressContainerRef = (element: HTMLDivElement | null) => {
    progressContainerRef.current = element;
    if (element) {
      // Measure width immediately when ref is set
      setContainerWidth(element.clientWidth);
    }
  };

  // Calculate year range from events
  const yearRange = useMemo(() => {
    if (events.length === 0) {
      return null;
    }

    const sortKeys = events.map((e) => e.sortKey).sort((a, b) => a - b);
    const earliestYear = Math.floor(sortKeys[0] ?? 0);
    const latestYear = Math.ceil(sortKeys.at(-1) ?? 0);

    return {
      earliest: earliestYear,
      latest: latestYear,
      totalYears: latestYear - earliestYear,
    };
  }, [events]);

  // Generate all years in range for markers
  const yearMarkers = useMemo(() => {
    if (!yearRange) {
      return [];
    }

    const years: number[] = [];
    let year = yearRange.earliest;
    while (year <= yearRange.latest) {
      years.push(year);
      year += 1;
    }
    return years;
  }, [yearRange]);

  // Calculate position percentage for a given year
  const getYearPosition = useCallback(
    (year: number): number => {
      if (!yearRange || yearRange.totalYears === 0) {
        return 0;
      }
      const relativePosition =
        (year - yearRange.earliest) / yearRange.totalYears;
      return Math.max(0, Math.min(1, relativePosition));
    },
    [yearRange]
  );

  // Scroll to a specific year
  const scrollToYear = (targetYear: number) => {
    const container = scrollContainerRef.current;
    if (!(container && yearRange)) {
      return;
    }

    // Find the first timeline item for this year or closest
    const timelineItems = container.querySelectorAll<HTMLElement>(
      "[data-timeline-item]"
    );

    // Find the item closest to or at the target year
    let targetItem: HTMLElement | null = null;
    let minDiff = Number.POSITIVE_INFINITY;

    for (const item of timelineItems) {
      const index = Number.parseInt(item.dataset.itemIndex ?? "0", 10);
      if (events[index]) {
        const itemYear = Math.floor(events[index].sortKey);
        const diff = Math.abs(itemYear - targetYear);
        if (diff < minDiff) {
          minDiff = diff;
          targetItem = item;
        }
      }
    }

    if (targetItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = targetItem.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const itemTop = itemRect.top - containerRect.top + scrollTop;

      // Scroll to center the item in viewport (with some offset from top)
      const targetScrollTop = itemTop - container.clientHeight * 0.2;

      container.scrollTo({
        behavior: "smooth",
        top: Math.max(0, targetScrollTop),
      });
    } else {
      // Fallback: estimate scroll position based on year
      const position = getYearPosition(targetYear);
      const maxScroll = container.scrollHeight - container.clientHeight;
      const targetScrollTop = position * maxScroll;

      container.scrollTo({
        behavior: "smooth",
        top: targetScrollTop,
      });
    }
  };

  // Calculate visible events from viewport
  const getVisibleSortKeys = useCallback(
    (container: HTMLElement, scrollTop: number, clientHeight: number) => {
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + clientHeight;
      const timelineItems = container.querySelectorAll<HTMLElement>(
        "[data-timeline-item]"
      );
      const visibleSortKeys: number[] = [];

      for (const item of timelineItems) {
        const rect = item.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const itemTop = rect.top - containerRect.top + scrollTop;
        const itemBottom = itemTop + rect.height;

        // Check if item intersects with viewport (with some padding)
        if (itemBottom >= viewportTop - 50 && itemTop <= viewportBottom + 50) {
          const index = Number.parseInt(item.dataset.itemIndex ?? "0", 10);
          if (events[index]) {
            visibleSortKeys.push(events[index].sortKey);
          }
        }
      }

      return visibleSortKeys;
    },
    [events]
  );

  // Calculate year progress from visible sort keys
  const calculateYearProgress = useCallback(
    (visibleSortKeys: number[], fallbackProgress: number) => {
      if (!yearRange) {
        return;
      }

      if (visibleSortKeys.length > 0) {
        const visibleStartYear = Math.floor(Math.min(...visibleSortKeys));
        const visibleEndYear = Math.ceil(Math.max(...visibleSortKeys));
        setCurrentYearRange({ end: visibleEndYear, start: visibleStartYear });

        // Calculate year-based progress from the median of visible events
        const sortedKeys = [...visibleSortKeys].sort((a, b) => a - b);
        const medianSortKey =
          sortedKeys.length % 2 === 0
            ? ((sortedKeys[sortedKeys.length / 2 - 1] ?? 0) +
                (sortedKeys[sortedKeys.length / 2] ?? 0)) /
              2
            : (sortedKeys[Math.floor(sortedKeys.length / 2)] ?? 0);

        const yearProgress = getYearPosition(medianSortKey);
        setYearBasedProgress(yearProgress);
      } else {
        // Fallback: estimate based on scroll progress
        const estimatedYearPosition =
          yearRange.earliest + fallbackProgress * yearRange.totalYears;
        const estimatedYear = Math.round(estimatedYearPosition);
        setCurrentYearRange({ end: estimatedYear, start: estimatedYear });
        setYearBasedProgress(fallbackProgress);
      }
    },
    [getYearPosition, yearRange]
  );

  // Initialize progress bar position immediately using useLayoutEffect
  useLayoutEffect(() => {
    if (!yearRange || events.length === 0) {
      return;
    }

    // Set initial position based on first event immediately
    const firstEventSortKey = events[0]?.sortKey ?? 0;
    const yearProgress = getYearPosition(firstEventSortKey);
    setYearBasedProgress(yearProgress);
    const firstYear = Math.floor(firstEventSortKey);
    setCurrentYearRange({ end: firstYear, start: firstYear });
  }, [events, yearRange, getYearPosition]);

  // Find and watch the scroll container using ResizeObserver
  // This is simpler and more reliable than MutationObserver
  useEffect(() => {
    if (!yearRange || events.length === 0) {
      return;
    }

    // Function to find the container
    const findContainer = (): HTMLElement | null =>
      scrollContainerRef.current ||
      document.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");

    // Function to update progress
    const updateProgress = () => {
      const container = findContainer();
      if (!container) {
        return;
      }

      // Set the ref if we found it
      if (!scrollContainerRef.current && container) {
        scrollContainerRef.current = container;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll <= 0) {
        return; // Not ready yet
      }

      const progress = scrollTop / maxScroll;
      const visibleSortKeys = getVisibleSortKeys(
        container,
        scrollTop,
        clientHeight
      );

      if (visibleSortKeys.length > 0) {
        calculateYearProgress(visibleSortKeys, progress);
      } else {
        calculateYearProgress([], progress);
      }
    };

    // Try to find container immediately
    const container = findContainer();
    if (!container) {
      // Container not found, set up ResizeObserver on document to watch for it
      const resizeObserver = new ResizeObserver(() => {
        const foundContainer = findContainer();
        if (foundContainer) {
          updateProgress();
          // Once found, observe the container itself
          resizeObserver.observe(foundContainer);
        }
      });

      // Observe document body to catch when container is added
      resizeObserver.observe(document.body);

      // Clean up after 5 seconds if still not found
      const timeout = setTimeout(() => {
        resizeObserver.disconnect();
      }, 5000);

      return () => {
        resizeObserver.disconnect();
        clearTimeout(timeout);
      };
    }

    // Container found, set up ResizeObserver on it
    const resizeObserver = new ResizeObserver(() => {
      updateProgress();
    });

    resizeObserver.observe(container);

    // Also update immediately
    requestAnimationFrame(() => {
      updateProgress();
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    events,
    yearRange,
    getVisibleSortKeys,
    calculateYearProgress,
    scrollContainerRef,
  ]);

  // Track scroll position and update container width
  useEffect(() => {
    // Try to find container if ref isn't set yet
    let container = scrollContainerRef.current;
    if (!container) {
      const viewport = document.querySelector<HTMLElement>(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        scrollContainerRef.current = viewport;
        container = viewport;
      }
    }

    if (!(container && yearRange)) {
      return;
    }

    const updateContainerWidth = () => {
      // Use the progress bar container's width
      if (progressContainerRef.current) {
        setContainerWidth(progressContainerRef.current.clientWidth);
      }
    };

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll <= 0) {
        // If there's no scroll, calculate based on first event
        if (events.length > 0 && yearRange) {
          const firstEventSortKey = events[0]?.sortKey ?? 0;
          const yearProgress = getYearPosition(firstEventSortKey);
          setYearBasedProgress(yearProgress);
          const firstYear = Math.floor(firstEventSortKey);
          setCurrentYearRange({ end: firstYear, start: firstYear });
        } else {
          setYearBasedProgress(0);
        }
        return;
      }

      const progress = scrollTop / maxScroll;
      const visibleSortKeys = getVisibleSortKeys(
        container,
        scrollTop,
        clientHeight
      );
      calculateYearProgress(visibleSortKeys, progress);
    };

    // Initial calculations - use multiple delays to ensure DOM is ready
    const initialize = () => {
      updateContainerWidth();
      // Use multiple requestAnimationFrame calls to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          handleScroll();
          // Also call after delays to catch any late-rendering items
          setTimeout(() => {
            handleScroll();
          }, 50);
          setTimeout(() => {
            handleScroll();
          }, 200);
        });
      });
    };

    // Call immediately and also after a short delay
    initialize();
    const initTimeout = setTimeout(initialize, 100);

    container.addEventListener("scroll", handleScroll, { passive: true });
    const resizeHandler = () => {
      updateContainerWidth();
      requestAnimationFrame(() => {
        handleScroll();
      });
    };
    window.addEventListener("resize", resizeHandler, { passive: true });

    // Watch for container size changes (both scroll container and progress container)
    const resizeObserver = new ResizeObserver(() => {
      updateContainerWidth();
      // Use requestAnimationFrame to ensure layout is complete before calculating
      requestAnimationFrame(() => {
        handleScroll();
      });
    });
    resizeObserver.observe(container);

    // Observe progress container after a brief delay to ensure ref is set
    const progressObserverTimeout = setTimeout(() => {
      if (progressContainerRef.current) {
        resizeObserver.observe(progressContainerRef.current);
      }
    }, 0);

    return () => {
      clearTimeout(initTimeout);
      clearTimeout(progressObserverTimeout);
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resizeHandler);
      resizeObserver.disconnect();
    };
  }, [
    scrollContainerRef,
    yearRange,
    getVisibleSortKeys,
    calculateYearProgress,
    events,
    getYearPosition,
  ]);

  if (!yearRange) {
    return null;
  }

  // Show a minimal placeholder while width is being calculated
  const showPlaceholder = containerWidth === 0;

  // Determine which years should show labels
  const shouldShowYearLabel = (year: number, index: number): boolean => {
    if (yearMarkers.length <= 15) {
      return true; // Show all labels if 15 or fewer years
    }
    // Show every 2nd, 3rd, or 4th year depending on total count
    let step = 2;
    if (yearMarkers.length > 30) {
      step = 4;
    } else if (yearMarkers.length > 20) {
      step = 3;
    }
    return (
      index % step === 0 ||
      year === yearRange.earliest ||
      year === yearRange.latest
    );
  };

  return (
    <div
      className={cn("flex w-full flex-col gap-2 px-4 py-3", className)}
      ref={setProgressContainerRef}
    >
      {/* Year range display */}
      {!showPlaceholder && currentYearRange && (
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          {/* <span className="font-medium">{yearRange.earliest}</span> */}
          <span className="font-medium">&nbsp;</span>
          <div className="rounded-md bg-background/80 px-2 py-1 text-center backdrop-blur">
            <span className="font-medium">{currentYearRange.start}</span> -
            &nbsp;
            {currentYearRange.end !== currentYearRange.start && (
              <span className="font-medium">{currentYearRange.end}</span>
            )}
          </div>
          {/* <span className="font-medium">{yearRange.latest}</span> */}
          <span className="font-medium">&nbsp;</span>
        </div>
      )}

      {/* Progress bar track with year markers */}
      <div className="relative h-2 w-full bg-border">
        {/* Progress fill */}
        {!showPlaceholder && (
          <div
            className="absolute top-0 left-0 h-full bg-primary/30 transition-all duration-150"
            style={{
              width: `${yearBasedProgress * 100}%`,
            }}
          />
        )}

        {/* Year markers */}
        {!showPlaceholder &&
          yearMarkers.map((year, index) => {
            const position = getYearPosition(year);
            const showLabel = shouldShowYearLabel(year, index);

            return (
              <button
                className="group absolute top-1/2 cursor-pointer transition-all hover:scale-125 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                key={year}
                onClick={() => scrollToYear(year)}
                style={{
                  left: `${position * 100}%`,
                  transform: "translateX(-50%) translateY(-50%)",
                }}
                title={`Jump to ${year}`}
                type="button"
              >
                {/* Marker dot */}
                <div
                  className={cn(
                    "rounded-full border-2 bg-background transition-colors",
                    currentYearRange &&
                      year >= currentYearRange.start &&
                      year <= currentYearRange.end
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40 hover:border-primary"
                  )}
                  style={{
                    height: showLabel ? "10px" : "6px",
                    width: showLabel ? "10px" : "6px",
                  }}
                />
              </button>
            );
          })}

        {/* Progress indicator (thumb) */}
        {!showPlaceholder && (
          <div
            className="absolute top-1/2 z-10 h-4 w-4 rounded-full bg-primary ring-2 ring-background transition-all duration-150"
            style={{
              left: `${yearBasedProgress * 100}%`,
              transform: "translateX(-50%) translateY(-50%)",
            }}
          />
        )}
      </div>

      {/* Year labels below the bar */}
      {!showPlaceholder && (
        <div className="relative flex h-6 w-full">
          {yearMarkers.map((year, index) => {
            const position = getYearPosition(year);
            const showLabel = shouldShowYearLabel(year, index);

            if (!showLabel) {
              return null;
            }

            return (
              <div
                className="absolute top-0 -translate-x-1/2"
                key={`label-${year}`}
                style={{
                  left: `${position * 100}%`,
                }}
              >
                <div
                  className={cn(
                    "whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-xs transition-colors",
                    currentYearRange &&
                      year >= currentYearRange.start &&
                      year <= currentYearRange.end
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {year}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
