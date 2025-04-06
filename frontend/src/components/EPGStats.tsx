'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Film, Loader2, Tv } from 'lucide-react';

import { getCookie } from '@/lib/cookies';

interface EPGStats {
  days: number;
  channels: number;
  programs: number;
}

function CountUpAnimation({
  end,
  duration = 2000,
}: {
  end: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(end * percentage));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export function EPGStats() {
  const [stats, setStats] = useState<EPGStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const xmltvdatasource =
          (await getCookie('xmltvdatasource')) || 'xmlepg_FTATAM';
        const timezone = (await getCookie('userTimezone')) || 'UTC';

        const [channelsResponse, datesResponse] = await Promise.all([
          fetch(`/api/py/channels/${xmltvdatasource}`),
          fetch(
            `/api/py/dates/${xmltvdatasource}?timezone=${encodeURIComponent(timezone)}`,
          ),
        ]);

        if (!channelsResponse.ok || !datesResponse.ok) {
          throw new Error('Failed to fetch EPG stats');
        }

        const channelsData = await channelsResponse.json();
        const datesData = await datesResponse.json();

        const days = datesData.data.length;
        const channels = channelsData.data.channels.length;
        const programs = channelsData.data.channels.reduce(
          (total: number, channel: any) => total + channel.program_count,
          0,
        );

        setStats({ days, channels, programs });
      } catch (error) {
        console.error('Error fetching EPG stats:', error);
        setError('Failed to load EPG stats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Days Covered',
      value: stats.days,
      icon: CalendarDays,
      color: 'bg-blue-500',
      textColor: 'text-white',
    },
    {
      title: 'Channels',
      value: stats.channels,
      icon: Tv,
      color: 'bg-green-500',
      textColor: 'text-white',
    },
    {
      title: 'Programs',
      value: stats.programs,
      icon: Film,
      color: 'bg-purple-500',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="fade-in-up">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {statCards.map((stat, index) => (
          <div key={index} className="overflow-hidden rounded-lg shadow-sm">
            <div
              className={`flex items-center justify-between p-4 ${stat.color}`}
            >
              <h3 className={`font-bold ${stat.textColor}`}>{stat.title}</h3>
              <stat.icon className={`size-6 ${stat.textColor}`} />
            </div>
            <div className="bg-white p-6 text-center dark:bg-gray-700">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                <CountUpAnimation end={stat.value} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
