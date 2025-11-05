"use client";

import { motion } from "framer-motion";
import { CalendarDays, Film, Globe, Loader2, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import type { Channel } from "@/components/channel/types";
import { Card } from "@/components/ui/card";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { getCookie } from "@/lib/cookies";
import { ErrorAlert } from "@/lib/error-handling";

// Constants for better maintainability
const DEFAULT_DATA_SOURCE = "xmlepg_FTASYD";
const DEFAULT_TIMEZONE = "UTC";
const STAT_CARDS_CONFIG = [
  {
    delay: 0,
    icon: Globe,
    title: "Total Sources Available",
  },
  {
    delay: 0.1,
    icon: CalendarDays,
    title: "Selected Source: Days",
  },
  {
    delay: 0.2,
    icon: Tv,
    title: "Selected Source: Channels",
  },
  {
    delay: 0.3,
    icon: Film,
    title: "Selected Source: Programs",
  },
] as const;

type EPGStats = {
  days: number;
  channels: number;
  programs: number;
  sources: number;
};

type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
};

type DatesResponse = {
  date: string;
  query: string;
  source: string;
  data: string[];
};

type Source = {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo?: {
    light: string;
    dark: string;
  };
};

// Helper function to validate API response
function validateApiResponse(
  channelsData: unknown,
  datesData: unknown,
  sourcesData: unknown
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

  // Check sources data structure: Source[]
  const isValidSourcesData = Boolean(sourcesData && Array.isArray(sourcesData));

  return isValidChannelsData && isValidDatesData && isValidSourcesData;
}

// Helper function to fetch and validate API responses
async function fetchApiData(xmltvdatasource: string, timezone: string) {
  const [channelsResponse, datesResponse, sourcesResponse] = await Promise.all([
    fetch(`/api/py/channels/${xmltvdatasource}`),
    fetch(
      `/api/py/dates/${xmltvdatasource}?timezone=${encodeURIComponent(timezone)}`
    ),
    fetch("/api/py/sources"),
  ]);

  if (!channelsResponse.ok) {
    throw new Error(`Failed to fetch channels: ${channelsResponse.status}`);
  }

  if (!datesResponse.ok) {
    throw new Error(`Failed to fetch dates: ${datesResponse.status}`);
  }

  if (!sourcesResponse.ok) {
    throw new Error(`Failed to fetch sources: ${sourcesResponse.status}`);
  }

  const [channelsData, datesData, sourcesData] = await Promise.all([
    channelsResponse.json(),
    datesResponse.json(),
    sourcesResponse.json(),
  ]);

  if (!validateApiResponse(channelsData, datesData, sourcesData)) {
    throw new Error("Invalid data structure received from API");
  }

  return { channelsData, datesData, sourcesData };
}

// Helper function to calculate stats from API data
function calculateStats(
  channelsData: ApiResponse,
  datesData: DatesResponse,
  sourcesData: Source[]
): EPGStats {
  const days = datesData.data.length;
  const channels = channelsData.data.channels.length;
  const programs = channelsData.data.channels.reduce(
    (total: number, channel: Channel) => total + channel.program_count,
    0
  );
  const sources = sourcesData.length;

  return { channels, days, programs, sources };
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

        const { channelsData, datesData, sourcesData } = await fetchApiData(
          xmltvdatasource,
          timezone
        );
        const calculatedStats = calculateStats(
          channelsData as ApiResponse,
          datesData as DatesResponse,
          sourcesData as Source[]
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
    value: [stats.sources, stats.days, stats.channels, stats.programs][index],
  }));

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label="EPG Statistics Overview"
      className="fade-in-up"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <motion.article
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            key={stat.title}
            transition={{ delay: stat.delay, duration: 0.5 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-muted-foreground">{stat.title}</p>
                  <p className="font-bold text-2xl">
                    <SlidingNumber
                      inView
                      number={stat.value}
                      padStart
                      transition={{
                        damping: 20,
                        mass: 0.8,
                        stiffness: 200,
                      }}
                    />
                  </p>
                </div>
                <div className="w-fit rounded-full bg-primary/10 p-3">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
              </div>
            </Card>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
