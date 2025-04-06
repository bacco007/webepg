'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCookie } from '@/lib/cookies';

interface ChannelData {
  channel: {
    id: string;
    name: {
      clean: string;
      location: string;
      real: string;
    };
    icon: {
      light: string;
      dark: string;
    };
    slug: string;
    lcn: string;
    group: string;
  };
  currentProgram: {
    title: string;
    subtitle: string;
    episode: string | null;
    start: string;
    stop: string;
    desc: string;
    category: string[];
    rating: string;
    lengthstring: string;
  };
}

export default function TVGuideTicker() {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [xmltvDataSource, setXmltvDataSource] =
    useState<string>('xmlepg_FTASYD');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDataSource =
        (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel data');
      }
      const data = await response.json();
      const sortedChannels = data.data.sort(
        (a: ChannelData, b: ChannelData) => {
          const aLcn = Number.parseInt(a.channel.lcn) || Infinity;
          const bLcn = Number.parseInt(b.channel.lcn) || Infinity;
          if (aLcn === bLcn) {
            return a.channel.name.real.localeCompare(b.channel.name.real);
          }
          return aLcn - bLcn;
        },
      );
      const validChannels = sortedChannels.filter(
        (channel: ChannelData) =>
          channel.currentProgram &&
          channel.currentProgram.stop &&
          channel.currentProgram.start,
      );
      setChannels(validChannels);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching channel data:', error);
      setError('Error fetching channel data. Please try again later.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const calculateProgress = (start: string, stop: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const stopTime = new Date(stop);
    const totalDuration = stopTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  if (isLoading) {
    return <div className="bg-background w-full p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-background w-full p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  const items =
    channels.length > 0
      ? [...channels, ...channels]
      : [
          {
            channel: {
              id: 'no-data',
              name: { real: 'No Data' },
              icon: { light: '/placeholder.svg' },
              slug: 'no-data',
            },
            currentProgram: {
              title: 'No Program Data Available',
              start: new Date().toISOString(),
              stop: new Date().toISOString(),
              lengthstring: 'N/A',
            },
          },
        ];

  const cardWidth = 300; // Width of each card in pixels
  const cardSpacing = 12; // Right margin of each card
  const pixelsPerSecond = 50; // Desired scroll speed
  const totalWidth = items.length * (cardWidth + cardSpacing);
  const scrollDuration = totalWidth / pixelsPerSecond;

  return (
    <div className="bg-background w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="relative w-full overflow-hidden">
          <div className="from-background absolute top-0 bottom-0 left-0 z-10 w-16 bg-linear-to-r to-transparent"></div>
          <div className="from-background absolute top-0 right-0 bottom-0 z-10 w-16 bg-linear-to-l to-transparent"></div>
          <div className="overflow-hidden">
            <div
              ref={containerRef}
              className="ticker flex"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: `${totalWidth * 2}px`,
                animationPlayState: isHovered ? 'paused' : 'running',
                animationDuration: `${scrollDuration}s`,
              }}
            >
              {items.map((item, index) => (
                <Link
                  key={`${item.channel.id}-${index}`}
                  href={`/channel/${item.channel.slug}?source=${xmltvDataSource}`}
                  className="focus:ring-primary focus:ring-2 focus:outline-hidden"
                >
                  <Card className="mr-3 flex h-20 w-[300px] shrink-0 flex-row items-center gap-3 p-3 shadow-md transition-shadow hover:shadow-lg">
                    <div className="shrink-0">
                      <img
                        src={item.channel.icon.light || '/placeholder.svg'}
                        alt={item.channel.name.real}
                        className="size-10 object-contain"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="grow overflow-hidden">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="truncate text-xs font-semibold">
                          {item.channel.name.real}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {item.currentProgram && item.currentProgram.stop
                            ? `Ends ${new Date(item.currentProgram.stop).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : ''}
                        </span>
                      </div>
                      <h3 className="truncate text-sm font-bold">
                        {item.currentProgram.title}
                      </h3>
                      {item.currentProgram &&
                        item.currentProgram.stop &&
                        item.currentProgram.start && (
                          <Progress
                            value={calculateProgress(
                              item.currentProgram.start,
                              item.currentProgram.stop,
                            )}
                            className="mt-1 h-1"
                          />
                        )}
                      <div className="mt-1 flex items-center text-xs">
                        <Clock className="mr-1 size-3" />
                        <span>
                          {item.currentProgram
                            ? item.currentProgram.lengthstring
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .ticker {
          animation: scroll ${scrollDuration}s linear infinite;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${totalWidth}px);
          }
        }
      `}</style>
    </div>
  );
}
