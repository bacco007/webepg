"use client";

import { motion } from "framer-motion";
import { CalendarDays, Film, Loader2, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import type { Channel } from "@/components/channel/types";
import { getCookie } from "@/lib/cookies";
import { ErrorAlert } from "@/lib/error-handling";
import { cn } from "@/lib/utils";

// Constants for better maintainability
const ANIMATION_DURATION = 2000;
const DEFAULT_DATA_SOURCE = "xmlepg_FTATAM";
const DEFAULT_TIMEZONE = "UTC";
const STAT_CARDS_CONFIG = [
  {
    delay: 0,
    gradient: "from-blue-300 to-blue-600",
    icon: CalendarDays,
    title: "Days Covered",
  },
  {
    delay: 0.1,
    gradient: "from-green-300 to-green-600",
    icon: Tv,
    title: "Channels",
  },
  {
    delay: 0.2,
    gradient: "from-purple-300 to-purple-600",
    icon: Film,
    title: "Programs",
  },
] as const;

interface EPGStats {
  days: number;
  channels: number;
  programs: number;
}

interface CountUpAnimationProps {
  end: number;
  duration?: number;
  className?: string;
}

interface ApiResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
}

interface DatesResponse {
  date: string;
  query: string;
  source: string;
  data: string[];
}

function CountUpAnimation({
  end,
  duration = ANIMATION_DURATION,
  className,
}: CountUpAnimationProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    let isActive = true;

    const animate = (timestamp: number) => {
      if (!isActive) {
        return;
      }

      if (!startTime) {
        startTime = timestamp;
      }

      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(end * percentage));

      if (percentage < 1 && isActive) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return (
    <motion.span
      animate={{ opacity: 1, y: 0 }}
      aria-live="polite"
      className={className}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      {count.toLocaleString()}
    </motion.span>
  );
}

// Helper function to validate API response
function validateApiResponse(
  channelsData: unknown,
  datesData: unknown
): boolean {
  // Check channels data structure: { date_pulled, query, source, data: { channels: Channel[] } }
  const isValidChannelsData = Boolean(
    channelsData &&
      typeof channelsData === "object" &&
      "data" in channelsData &&
      channelsData.data &&
      typeof channelsData.data === "object" &&
      "channels" in channelsData.data &&
      Array.isArray(channelsData.data.channels)
  );

  // Check dates data structure: { date, query, source, data: string[] }
  const isValidDatesData = Boolean(
    datesData &&
      typeof datesData === "object" &&
      "data" in datesData &&
      Array.isArray(datesData.data)
  );

  return isValidChannelsData && isValidDatesData;
}

// Helper function to fetch and validate API responses
async function fetchApiData(xmltvdatasource: string, timezone: string) {
  const [channelsResponse, datesResponse] = await Promise.all([
    fetch(`/api/py/channels/${xmltvdatasource}`),
    fetch(
      `/api/py/dates/${xmltvdatasource}?timezone=${encodeURIComponent(timezone)}`
    ),
  ]);

  if (!channelsResponse.ok) {
    throw new Error(`Failed to fetch channels: ${channelsResponse.status}`);
  }

  if (!datesResponse.ok) {
    throw new Error(`Failed to fetch dates: ${datesResponse.status}`);
  }

  const [channelsData, datesData] = await Promise.all([
    channelsResponse.json(),
    datesResponse.json(),
  ]);

  if (!validateApiResponse(channelsData, datesData)) {
    throw new Error("Invalid data structure received from API");
  }

  return { channelsData, datesData };
}

// Helper function to calculate stats from API data
function calculateStats(
  channelsData: ApiResponse,
  datesData: DatesResponse
): EPGStats {
  const days = datesData.data.length;
  const channels = channelsData.data.channels.length;
  const programs = channelsData.data.channels.reduce(
    (total: number, channel: Channel) => total + channel.program_count,
    0
  );

  return { channels, days, programs };
}

export function EPGStats() {
  const [stats, setStats] = useState<EPGStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const xmltvdatasource =
          (await getCookie("xmltvdatasource")) || DEFAULT_DATA_SOURCE;
        const timezone = (await getCookie("userTimezone")) || DEFAULT_TIMEZONE;

        const { channelsData, datesData } = await fetchApiData(
          xmltvdatasource,
          timezone
        );
        const calculatedStats = calculateStats(
          channelsData as ApiResponse,
          datesData as DatesResponse
        );
        setStats(calculatedStats);
      } catch (fetchError) {
        const errorMessage =
          fetchError instanceof Error
            ? `Failed to load EPG stats: ${fetchError.message}`
            : "Failed to load EPG stats. Please try again later.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!stats) {
    return null;
  }

  const statCards = STAT_CARDS_CONFIG.map((config, index) => ({
    ...config,
    value: [stats.days, stats.channels, stats.programs][index],
  }));

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label="EPG Statistics Overview"
      className="fade-in-up"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {statCards.map((stat) => (
          <motion.article
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            key={stat.title}
            transition={{ delay: stat.delay, duration: 0.5 }}
          >
            <div className="hover:-translate-y-1 relative h-full overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              {/* Gradient Background */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-90",
                  stat.gradient
                )}
              />

              {/* Content */}
              <div className="relative p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white">
                    {stat.title}
                  </h3>
                  <stat.icon
                    aria-hidden="true"
                    className="size-6 text-white/90"
                  />
                </div>

                <div className="text-center">
                  <p className="font-bold text-4xl text-white">
                    <CountUpAnimation
                      className="inline-block"
                      end={stat.value}
                    />
                  </p>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
