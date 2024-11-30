import { cookies } from 'next/headers';
import Link from 'next/link';
import { CalendarIcon, ClapperboardIcon, ClockIcon, TrophyIcon, TvIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { siteConfig } from '@/config/site';

export default async function Home() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get('timezone')?.value;
  const xmltvdatasource = cookieStore.get('xmltvdatasource')?.value;

  const cards = [
    {
      title: 'Daily EPG',
      description:
        'Explore a comprehensive day-by-day guide for all channels. Perfect for planning your viewing schedule.',
      icon: TvIcon,
      link: '/epg',
    },
    {
      title: `Today's EPG`,
      description:
        "Get instant access to today's programming across all channels. Never miss out on current shows.",
      icon: TvIcon,
      link: '/epg/today',
    },
    {
      title: `Tomorrow's EPG`,
      description:
        "Plan ahead with tomorrow's full lineup. Set reminders for upcoming must-watch content.",
      icon: TvIcon,
      link: '/epg/tomorrow',
    },
    {
      title: 'Weekly EPG',
      description:
        'View a week-long schedule for any channel. Ideal for tracking series and planning your entire week.',
      icon: CalendarIcon,
      link: '/channel',
    },
    {
      title: 'Now and Next',
      description:
        "See what's currently airing and what's coming up next across all channels. Perfect for spontaneous viewing.",
      icon: ClockIcon,
      link: '/nownext',
    },
    {
      title: 'Upcoming Sports EPG',
      description:
        'Never miss a game! Get a dedicated view of all upcoming sports events across channels.',
      icon: TrophyIcon,
      link: '/sports',
    },
    {
      title: 'Upcoming Movies EPG',
      description:
        'Never miss a movie! Get a dedicated view of all upcoming movies across channels.',
      icon: ClapperboardIcon,
      link: '/sports',
    },
  ];

  return (
    <main className="container mx-auto px-4 py-16 md:px-6">
      <section className="fade-in-up mb-16 text-center">
        <div className="mb-6 flex items-center justify-center">
          <Link href="/" className="relative inline-flex items-center">
            <span className="text-primary scale-in text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              {siteConfig.name}
            </span>
            <Badge variant="secondary" className="ml-2 px-2 py-0.5 align-top text-lg font-semibold">
              Beta
            </Badge>
          </Link>
        </div>
        <h1 className="text-primary mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Your Ultimate EPG Experience
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
          Discover a new way to explore TV schedules with our innovative Electronic Program Guide.
        </p>
      </section>
      <div className="staggered-fade-in mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Link key={index} href={card.link} className="group focus:outline-none" tabIndex={0}>
            <Card className="group-focus:ring-primary h-full bg-white/80 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-focus:ring-2 dark:bg-gray-800/80">
              <CardHeader>
                <div className="mb-2 flex justify-center">
                  <card.icon
                    className={`size-12 transition-colors duration-300`}
                    aria-hidden="true"
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
      {/* <section className="fade-in-up">
        <h2 className="mb-8 text-center text-xl font-bold">
          Selected EPG at a Glance - {xmltvdatasource}
        </h2>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold">
                <CountUpAnimation end={epgStats.days} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">Days Covered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold">
                <CountUpAnimation end={epgStats.channels} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">Channels</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold">
                <CountUpAnimation end={epgStats.programs} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">Programs</p>
            </CardContent>
          </Card>
        </div>
      </section> */}
    </main>
  );
}
