"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChannelCard from "@/components/ui/channel-card";
import styles from "@/components/ui/ticker-animations.module.css";
import TickerSkeleton from "@/components/ui/ticker-skeleton";
import { useTouchSwipe } from "@/hooks/use-touch-swipe";
import { getCookie } from "@/lib/cookies";
import { ErrorAlert } from "@/lib/error-handling";
import { decodeHtml } from "@/lib/html-utils";
import { DEFAULT_DATA_SOURCE, TICKER_CONSTANTS } from "@/lib/ticker-constants";
import type { ChannelData, XmlTvDataSource } from "@/types/channel";

// Memoized progress calculation function
const calculateProgress = (start: string, stop: string): number => {
  const now = new Date();
  const startTime = new Date(start);
  const stopTime = new Date(stop);
  const totalDuration = stopTime.getTime() - startTime.getTime();
  const elapsed = now.getTime() - startTime.getTime();
  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
};

// Memoized progress calculation hook
const useProgressCalculation = () => useCallback(calculateProgress, []);

export default function TVGuideTicker() {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<XmlTvDataSource>(DEFAULT_DATA_SOURCE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateProgressMemo = useProgressCalculation();

  // Touch swipe handler
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchSwipe({
    onSwipe: () => setIsHovered(!isHovered),
    threshold: TICKER_CONSTANTS.SWIPE_THRESHOLD,
  });

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) {
      return;
    }

    setIsDragging(true);
    setIsHovered(true); // Pause animation while dragging
    setDragStartX(e.clientX);
    setDragStartScrollLeft(containerRef.current.scrollLeft);

    // Prevent text selection during drag
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!(isDragging && containerRef.current)) {
        return;
      }

      const deltaX = e.clientX - dragStartX;
      containerRef.current.scrollLeft = dragStartScrollLeft - deltaX;
    },
    [isDragging, dragStartX, dragStartScrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Don't automatically resume animation - let user control with hover
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
    setIsHovered(false); // Resume animation when mouse leaves
  }, [isDragging]);

  // Fetch channels with proper error handling and request cancellation
  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const storedDataSource =
        (await getCookie("xmltvdatasource")) || DEFAULT_DATA_SOURCE;
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch channel data: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();

      // Memoized sorting and filtering
      const sortedChannels = responseData.data
        .sort((a: ChannelData, b: ChannelData) => {
          const aLcn =
            Number.parseInt(a.channel.lcn, 10) || Number.POSITIVE_INFINITY;
          const bLcn =
            Number.parseInt(b.channel.lcn, 10) || Number.POSITIVE_INFINITY;

          if (aLcn === bLcn) {
            return a.channel.name.real.localeCompare(b.channel.name.real);
          }
          return aLcn - bLcn;
        })
        .filter(
          (channel: ChannelData) =>
            channel.currentProgram?.stop && channel.currentProgram?.start
        )
        .map((channel: ChannelData) => ({
          ...channel,
          currentProgram: channel.currentProgram
            ? {
                ...channel.currentProgram,
                desc: decodeHtml(channel.currentProgram.desc || ""),
                subtitle: decodeHtml(channel.currentProgram.subtitle || ""),
                title: decodeHtml(channel.currentProgram.title || ""),
              }
            : channel.currentProgram,
        }));

      setChannels(sortedChannels);
    } catch (fetchError) {
      // Only set error if it's not an abort error
      if (fetchError instanceof Error && fetchError.name !== "AbortError") {
        setError("Error fetching channel data. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    fetchChannels();

    const interval = setInterval(() => {
      fetchChannels();
    }, TICKER_CONSTANTS.AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchChannels]);

  // Memoized items calculation
  const items = useMemo(() => {
    if (channels.length > 0) {
      return [...channels, ...channels];
    }

    return [
      {
        channel: {
          group: "",
          icon: { dark: "/placeholder.svg", light: "/placeholder.svg" },
          id: "no-data",
          lcn: "",
          name: { clean: "", location: "", real: "No Data" },
          slug: "no-data",
        },
        currentProgram: {
          category: [],
          desc: "",
          episode: null,
          lengthstring: "N/A",
          rating: "",
          start: new Date().toISOString(),
          stop: new Date().toISOString(),
          subtitle: "",
          title: "No Program Data Available",
        },
      },
    ];
  }, [channels]);

  // Memoized animation calculations
  const { totalWidth, scrollDuration } = useMemo(() => {
    const calculatedTotalWidth =
      items.length *
      (TICKER_CONSTANTS.CARD_WIDTH + TICKER_CONSTANTS.CARD_SPACING);
    const calculatedScrollDuration =
      calculatedTotalWidth / TICKER_CONSTANTS.PIXELS_PER_SECOND;
    return {
      scrollDuration: calculatedScrollDuration,
      totalWidth: calculatedTotalWidth,
    };
  }, [items.length]);

  if (isLoading) {
    return <TickerSkeleton />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="relative w-full overflow-hidden">
          {/* Gradient overlays for smooth edges */}
          <div className="absolute top-0 bottom-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent" />
          <div className="absolute top-0 right-0 bottom-0 z-10 w-16 bg-linear-to-l from-background to-transparent" />

          <div className="overflow-hidden">
            <div
              aria-live="polite"
              className={`${styles.ticker} flex cursor-grab active:cursor-grabbing`}
              onMouseDown={handleMouseDown}
              onMouseEnter={() => !isDragging && setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onTouchStart={handleTouchStart}
              ref={containerRef}
              style={
                {
                  "--scroll-distance": `-${totalWidth}px`,
                  "--scroll-duration": `${scrollDuration}s`,
                  animationPlayState: isHovered ? "paused" : "running",
                  userSelect: isDragging ? "none" : "auto",
                  width: `${totalWidth * 2}px`,
                } as React.CSSProperties
              }
            >
              {items.map((item, index) => (
                <ChannelCard
                  calculateProgress={calculateProgressMemo}
                  item={item}
                  key={`${item.channel.id}-${index}`}
                  xmltvDataSource={xmltvDataSource}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
