'use client';

import { useState } from 'react';
import { CalendarIcon, ClockIcon, TvIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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
  ];

  return (
    <div className="from-background to-secondary/20 min-h-[calc(100vh-155px)] bg-gradient-to-b">
      <main className="container mx-auto px-4 py-16 md:px-6">
        <section className="mb-16 text-center">
          <h1 className="text-primary mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
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
