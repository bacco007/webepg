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
import TvGuideTicker from '@/components/TvGuideTicker';
import { Badge } from '@/components/ui/badge';
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
    <main className="from-background to-secondary/20 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-16 md:px-6 lg:max-w-7xl">
        <section className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center">
            <Link href="/" className="relative inline-flex items-center">
              <span className="text-primary text-5xl font-extrabold tracking-tight sm:text-5xl md:text-5xl">
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
          <h1 className="text-primary mb-5 text-4xl font-extrabold tracking-tight sm:text-4xl md:text-4xl">
            Your Ultimate EPG Experience
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-3xl text-xl">
            Discover a new way to explore TV schedules with our innovative
            Electronic Program Guide. Stay up-to-date with your favorite shows
            and never miss a moment of entertainment.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <SourcesDropdown />
            <TimezoneDropdown />
          </div>
        </section>

        <section className="mb-8">
          <TvGuideTicker />
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => (
              <Link
                key={index}
                href={card.link}
                className="block focus:outline-none"
              >
                <div className="overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md">
                  <div className="bg-gray-200 p-2 text-center dark:bg-gray-800">
                    <card.icon className="mx-auto mb-2 size-8 text-gray-800 dark:text-gray-200" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {card.title}
                    </h3>
                  </div>
                  <div className="bg-white p-4 text-center dark:bg-gray-700">
                    <p className="gray-600 mb-4 text-sm dark:text-gray-300">
                      {card.description}
                    </p>
                    <div className="flex items-center justify-center">
                      <span className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
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
