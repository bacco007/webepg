'use client';

import { CalendarIcon, ClockIcon, TvIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const cards = [
    {
      title: 'Daily EPG (All Channels)',
      description: 'Explore a comprehensive daily guide for all channels.',
      icon: TvIcon,
      link: '/epg',
    },
    {
      title: 'Weekly EPG (Single Channel)',
      description: 'Dive deep into a week-long schedule for your favorite channel.',
      icon: CalendarIcon,
      link: '/channel',
    },
    {
      title: 'Now and Next',
      description: "Stay up-to-date with what's on now and coming up next.",
      icon: ClockIcon,
      link: '/nownext',
    },
  ];

  return (
    <div className="h-[calc(100vh-155px)] overflow-auto">
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:px-0">
          <div className="animate-fade-in mb-12 space-y-6 text-center">
            <h1 className="text-primary text-4xl font-extrabold md:text-5xl">
              Your Ultimate EPG Experience
            </h1>
            <p className="text-muted-foreground mx-auto max-w-[700px] text-xl">
              Discover a new way to explore TV schedules with our innovative Electronic Program
              Guide.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {cards.map((card, index) => (
              <div
                key={index}
                className={'animate-fade-in-up'}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link href={card.link}>
                  <Card
                    className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-center">
                        <card.icon
                          className={`size-12 ${
                            hoveredCard === index ? 'text-primary' : 'text-muted-foreground'
                          } transition-colors duration-300`}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <h3 className="mb-2 text-2xl font-bold">{card.title}</h3>
                      <p className="text-muted-foreground">{card.description}</p>
                      <Button
                        variant="outline"
                        className="hover:bg-primary hover:text-primary-foreground mt-4 w-full transition-all duration-300"
                      >
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
