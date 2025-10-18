import {
  ArrowRightIcon,
  CalendarIcon,
  ClapperboardIcon,
  ClockIcon,
  History,
  ListIcon,
  MapIcon,
  TrophyIcon,
  TvIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EPGStats } from "@/components/epg-stats";
import { SourcesDropdown } from "@/components/sources-dropdown";
import { TimezoneDropdown } from "@/components/timezone-dropdown";
import TVGuideTicker from "@/components/tv-guide-ticker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ErrorBoundary } from "@/lib/error-handling";

export const metadata: Metadata = {
  description:
    "Your Ultimate EPG Experience - Discover a new way to explore TV schedules with our innovative Electronic Program Guide.",
  title: "Home",
};

export default function Home() {
  const cards = [
    {
      description: "Daily guide view.",
      icon: TvIcon,
      link: "/epg",
      title: "Daily EPG",
    },
    {
      description: "See what's on today.",
      icon: TvIcon,
      link: "/epg/today",
      title: `Today's EPG`,
    },
    {
      description: "Plan ahead for tomorrow.",
      icon: TvIcon,
      link: "/epg/tomorrow",
      title: `Tomorrow's EPG`,
    },
    {
      description: "See what's on for the week",
      icon: CalendarIcon,
      link: "/channel",
      title: "Weekly EPG",
    },
    {
      description: "See what's on now and up next",
      icon: ClockIcon,
      link: "/nownext",
      title: "Now and Next",
    },
    {
      description: "What sport is coming up?.",
      icon: TrophyIcon,
      link: "/sports",
      title: "Upcoming Sports",
    },
    {
      description: "See upcoming movies",
      icon: ClapperboardIcon,
      link: "/movies",
      title: "Upcoming Movies",
    },
    {
      description: "View channel lists",
      icon: ListIcon,
      link: "/channellist",
      title: "Channel Lists",
    },
    {
      description: "View historical channel lineup timelines",
      icon: History,
      link: "/channellist/history",
      title: "Channel Timeline History",
    },
    {
      description: "View transmitter maps",
      icon: MapIcon,
      link: "/transmitters",
      title: "Transmitter Maps",
    },
  ];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="relative mx-auto w-full px-2 py-8 md:px-4">
        <section className="w-full">
          <div className="px-2 md:px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left Content */}
              <div>
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
                    Discover a new way to explore TV schedules with our
                    innovative Electronic Program Guide. <br />
                    Stay up-to-date with your favorite shows and never miss a
                    moment of entertainment.
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

                {/* Stats Section */}
                <section className="mb-12">
                  <EPGStats />
                </section>
              </div>

              {/* Right Content - Cards Grid Section */}
              <div>
                <section className="mb-12">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {cards.map((card) => (
                      <Link
                        className="group block focus:outline-none"
                        href={card.link}
                        key={card.link}
                      >
                        <Card className="p-4" key={card.link}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-primary text-xl">
                                {card.title}
                              </p>
                              <p className="font-muted-foreground">
                                {card.description}
                              </p>
                            </div>
                            <div className="w-fit rounded-full bg-primary/10 p-3 group-hover:bg-primary/20">
                              <card.icon className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                          <CardFooter className="px-1">
                            <p>
                              <Button
                                className="w-full group-hover:bg-primary/10"
                                size="sm"
                                variant="ghost"
                              >
                                Explore
                                <ArrowRightIcon className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                              </Button>
                            </p>
                          </CardFooter>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
