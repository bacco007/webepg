'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon, ClockIcon, TrophyIcon, TvIcon, XIcon } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { siteConfig } from '@/config/site';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showTimezoneBanner, setShowTimezoneBanner] = useState(false);

  useEffect(() => {
    const userTimezone = localStorage.getItem('userTimezone');
    if (!userTimezone) {
      setShowTimezoneBanner(true);
    }
  }, []);

  const cards = [
    {
      title: 'Daily EPG',
      description: 'View all channels',
      icon: TvIcon,
      link: '/epg',
    },
    {
      title: `Today's EPG`,
      description: 'Current schedule',
      icon: TvIcon,
      link: '/epg/today',
    },
    {
      title: `Tomorrow's EPG`,
      description: 'Plan ahead',
      icon: TvIcon,
      link: '/epg/tomorrow',
    },
    {
      title: 'Weekly EPG',
      description: 'Single channel view',
      icon: CalendarIcon,
      link: '/channel',
    },
    {
      title: 'Now and Next',
      description: "What's on now",
      icon: ClockIcon,
      link: '/nownext',
    },
    {
      title: 'Sports EPG',
      description: 'Sports schedules',
      icon: TrophyIcon,
      link: '/sports',
    },
  ];

  return (
    <div className="from-background to-secondary/20 min-h-[calc(100vh-155px)] bg-gradient-to-b">
      {showTimezoneBanner && (
        <Alert className="mb-4 border-yellow-400 bg-yellow-100 text-yellow-800">
          <AlertTitle className="flex items-center justify-between">
            <span className="font-semibold">Set Your Timezone</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimezoneBanner(false)}
              className="h-auto p-0 text-yellow-800 hover:bg-yellow-200"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </AlertTitle>
          <AlertDescription>
            Please set your timezone for accurate program schedules.{' '}
            <Link
              href="/settings"
              className="font-medium text-yellow-900 underline underline-offset-4 hover:text-yellow-700"
            >
              Go to Settings
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <main className="container mx-auto px-4 py-16 md:px-6">
        <section className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center">
            <Link href="/" className="relative inline-flex items-center">
              <span className="text-primary text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                {siteConfig.name}
              </span>
              <Badge
                variant="secondary"
                className="ml-2 px-2 py-0.5 align-top text-lg font-semibold"
              >
                Beta
              </Badge>
            </Link>
          </div>
          <h1 className="text-primary mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Your Ultimate EPG Experience
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Discover a new way to explore TV schedules with our innovative Electronic Program Guide.
          </p>
        </section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Link key={index} href={card.link} className="group">
              <Card
                className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardHeader>
                  <div className="mb-2 flex justify-center">
                    <card.icon
                      className={`size-12 ${
                        hoveredCard === index ? 'text-primary' : 'text-muted-foreground'
                      } transition-colors duration-300`}
                    />
                  </div>
                  <CardTitle className="text-center text-2xl">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm">{card.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="group-hover:bg-primary group-hover:text-primary-foreground w-full transition-all duration-300"
                  >
                    Explore
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
