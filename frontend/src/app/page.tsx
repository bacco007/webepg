import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  TrophyIcon,
  TvIcon,
} from 'lucide-react';

import { EPGStats } from '@/components/EPGStats';
import { SourcesDropdown } from '@/components/SourcesDropdown';
import { TimezoneDropdown } from '@/components/TimezoneDropdown';
import TvGuideTicker from '@/components/TvGuideTicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { siteConfig } from '@/config/site';

export default async function Home() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get('timezone')?.value;
  const xmltvdatasource = cookieStore.get('xmltvdatasource')?.value;

  const cards = [
    {
      title: 'Daily EPG',
      description: 'Daily guide view.',
      icon: TvIcon,
      link: '/epg',
    },
    {
      title: `Today's EPG`,
      description: "See what's on today.",
      icon: TvIcon,
      link: '/epg/today',
    },
    {
      title: `Tomorrow's EPG`,
      description: "Plan ahead with tomorrow's full lineup.",
      icon: TvIcon,
      link: '/epg/tomorrow',
    },
    {
      title: 'Weekly EPG',
      description: "See what's on for the week",
      icon: CalendarIcon,
      link: '/channel',
    },
    {
      title: 'Now and Next',
      description: "See what's on now and up next",
      icon: ClockIcon,
      link: '/nownext',
    },
    {
      title: 'Upcoming Sports',
      description: 'What sport is coming up?.',
      icon: TrophyIcon,
      link: '/sports',
    },
    {
      title: 'Upcoming Movies',
      description: 'See upcoming movies',
      icon: ClapperboardIcon,
      link: '/movies',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="lg:max-w-9xl container mx-auto px-2 py-16 md:px-6">
        <section className="mb-2 text-center">
          <div className="mb-6 flex items-center justify-center">
            <Link href="/" className="relative inline-flex items-center">
              <span className="text-5xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-5xl">
                {siteConfig.name}
              </span>
              <Badge
                variant="secondary"
                className="ml-2 px-2 py-1 text-lg font-semibold"
              >
                Beta
              </Badge>
            </Link>
          </div>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-primary sm:text-4xl md:text-4xl">
            Your Ultimate EPG Experience
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-muted-foreground">
            Discover a new way to explore TV schedules with our innovative
            Electronic Program Guide. Stay up-to-date with your favorite shows
            and never miss a moment of entertainment.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <SourcesDropdown />
            <TimezoneDropdown />
          </div>
        </section>
        <section className="mb-2">
          <TvGuideTicker />
        </section>
        <section className="mb-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => (
              <Link
                key={index}
                href={card.link}
                className="group focus:outline-none"
                tabIndex={0}
              >
                <Card className="h-[200px] overflow-hidden bg-white/90 transition-all duration-300 hover:shadow-xl dark:bg-gray-800/90">
                  <CardHeader className="bg-primary/10 pb-2">
                    <div className="mb-2 flex justify-center">
                      <card.icon
                        className="size-10 text-primary transition-transform duration-300 group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </div>
                    <CardTitle className="text-center text-xl text-primary">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-center text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      className="w-full transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                    >
                      Explore
                      <ArrowRightIcon className="ml-2 size-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        <section className="mb-2">
          <EPGStats />
        </section>
      </div>
    </main>
  );
}
