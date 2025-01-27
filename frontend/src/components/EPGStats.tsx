'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Film, Loader2, Tv } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Loader2 className="size-8 animate-spin text-primary" />
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
    },
    {
      title: 'Channels',
      value: stats.channels,
      icon: Tv,
      color: 'bg-green-500',
    },
    {
      title: 'Programs',
      value: stats.programs,
      icon: Film,
      color: 'bg-purple-500',
    },
  ];

  return (
    <section className="fade-in-up">
      <h3 className="mb-4 text-center text-2xl font-bold">
        Selected EPG at a Glance
      </h3>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className={`${stat.color} p-4`}>
              <CardTitle className="flex items-center justify-between text-white">
                <span>{stat.title}</span>
                <stat.icon className="size-6" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-center text-3xl font-bold text-primary">
                <CountUpAnimation end={stat.value} />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
