import { Suspense } from 'react';
import { CalendarDays, Film, Tv } from 'lucide-react';
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
import { SourcesDropdown } from '@/components/sidebar/SourcesDropdown';
import { TimezoneDropdown } from '@/components/TimezoneDropdown';
import TVGuideTicker from '@/components/TvGuideTicker';
import { Badge } from '@/components/ui/badge';
import { siteConfig } from '@/config/site';
import { ErrorBoundary } from '@/lib/error-handling';

export default async function Home() {
  const cookieStore = await cookies();
  const timezone = cookieStore.get('userTimezone')?.value || 'UTC';
  const xmltvdatasource =
    cookieStore.get('xmltvdatasource')?.value || 'xmlepg_FTASYD';

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
    <main className="bg-gradient-to-b from-background to-secondary/20 min-h-screen">
      <div className="mx-auto px-4 md:px-6 py-16 lg:max-w-7xl container">
        <section className="mb-8 text-center">
          <div className="flex justify-center items-center mb-6">
            <Link href="/" className="inline-flex relative items-center">
              <span className="font-extrabold text-primary text-5xl sm:text-5xl md:text-5xl tracking-tight">
                {siteConfig.name}
              </span>
              <Badge
                variant="secondary"
                className="ml-2 px-2 py-1 font-semibold text-lg"
              >
                Beta
              </Badge>
            </Link>
          </div>
          <h1 className="mb-5 font-extrabold text-primary text-4xl sm:text-4xl md:text-4xl tracking-tight">
            Your Ultimate EPG Experience
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-muted-foreground text-xl">
            Discover a new way to explore TV schedules with our innovative
            Electronic Program Guide. Stay up-to-date with your favorite shows
            and never miss a moment of entertainment.
          </p>
          <div className="flex sm:flex-row flex-col justify-center items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <SourcesDropdown />
            <TimezoneDropdown />
          </div>
        </section>

        <section className="mb-12">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 animate-pulse" />
              }
            >
              <TVGuideTicker />
            </Suspense>
          </ErrorBoundary>
        </section>

        <section className="mb-12">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => (
              <Link
                key={index}
                href={card.link}
                className="block focus:outline-none"
              >
                <div className="shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-shadow">
                  <div className="bg-gray-200 dark:bg-gray-800 p-2 text-center">
                    <card.icon className="mx-auto mb-2 size-8 text-gray-800 dark:text-gray-200" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xl">
                      {card.title}
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 text-center">
                    <p className="mb-4 dark:text-gray-300 text-sm gray-600">
                      {card.description}
                    </p>
                    <div className="flex justify-center items-center">
                      <span className="flex items-center font-medium text-gray-900 dark:text-gray-100 text-sm">
                        Explore
                        <ArrowRightIcon className="ml-2 size-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <EPGStats />
        </section>
      </div>
    </main>
  );
}
