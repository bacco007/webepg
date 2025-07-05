import {
  ArrowRightIcon,
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  TrophyIcon,
  TvIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EPGStats } from "@/components/epg-stats";
import { SourcesDropdown } from "@/components/sources-dropdown";
import { TimezoneDropdown } from "@/components/timezone-dropdown";
import TVGuideTicker from "@/components/tv-guide-ticker";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { ErrorBoundary } from "@/lib/error-handling";

export default function Home() {
  const cards = [
    {
      title: "Daily EPG",
      description: "Daily guide view.",
      icon: TvIcon,
      link: "/epg",
    },
    {
      title: `Today's EPG`,
      description: "See what's on today.",
      icon: TvIcon,
      link: "/epg/today",
    },
    {
      title: `Tomorrow's EPG`,
      description: "Plan ahead with tomorrow's full lineup.",
      icon: TvIcon,
      link: "/epg/tomorrow",
    },
    {
      title: "Weekly EPG",
      description: "See what's on for the week",
      icon: CalendarIcon,
      link: "/channel",
    },
    {
      title: "Now and Next",
      description: "See what's on now and up next",
      icon: ClockIcon,
      link: "/nownext",
    },
    {
      title: "Upcoming Sports",
      description: "What sport is coming up?.",
      icon: TrophyIcon,
      link: "/sports",
    },
    {
      title: "Upcoming Movies",
      description: "See upcoming movies",
      icon: ClapperboardIcon,
      link: "/movies",
    },
  ];

  return (
    <main className="relative min-h-screen">
      {/* Background Pattern */}
      <div className="-z-10 absolute inset-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-background [background-size:16px_16px]" />

      <div className="container relative mx-auto px-4 py-16 md:px-6 lg:max-w-[1920px]">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="mb-8 flex items-center justify-center">
            <Link
              className="group relative inline-flex items-center transition-transform hover:scale-105"
              href="/"
            >
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text font-extrabold text-5xl text-primary tracking-tight sm:text-6xl md:text-7xl">
                {siteConfig.name}
              </span>
              <Badge
                className="ml-3 bg-primary/10 px-3 py-1.5 font-semibold text-lg text-primary transition-colors hover:bg-primary/20"
                variant="secondary"
              >
                Beta
              </Badge>
            </Link>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-extrabold text-4xl text-transparent tracking-tight sm:text-5xl md:text-6xl">
            Your Ultimate EPG Experience
          </h1>
          <p className="mx-auto mb-10 max-w-4xl text-muted-foreground text-xl leading-relaxed">
            Discover a new way to explore TV schedules with our innovative
            Electronic Program Guide. Stay up-to-date with your favorite shows
            and never miss a moment of entertainment.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <SourcesDropdown />
            <TimezoneDropdown />
          </div>
        </section>

        {/* TV Guide Ticker Section */}
        <section className="mb-12">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="space-y-4">
                  <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
                  <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
                </div>
              }
            >
              <TVGuideTicker />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Cards Grid Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {cards.map((card) => (
              <Link
                className="group block focus:outline-none"
                href={card.link}
                key={card.link}
              >
                <div className="hover:-translate-y-2 relative h-full overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-primary/10 hover:shadow-xl">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Content Container */}
                  <div className="relative flex h-full flex-col p-6">
                    {/* Icon Container */}
                    <div className="mb-6 flex justify-center">
                      <div className="rounded-2xl bg-primary/10 p-4 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                        <card.icon className="size-8" />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-grow">
                      <h3 className="mb-3 text-center font-semibold text-foreground text-xl transition-colors group-hover:text-primary">
                        {card.title}
                      </h3>
                      <p className="mb-6 text-center text-muted-foreground text-sm leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto flex items-center justify-center">
                      <span className="inline-flex items-center font-medium text-primary text-sm transition-transform duration-300 group-hover:translate-x-1">
                        Explore
                        <ArrowRightIcon className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary/0 transition-colors duration-300 group-hover:border-primary/20" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-12">
          <EPGStats />
        </section>
      </div>
    </main>
  );
}
