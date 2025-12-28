"use client";

import { ArrowRight, Calendar, History } from "lucide-react";
import Link from "next/link";
import { memo, Suspense, useCallback, useMemo, useState } from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import LoadingSpinner from "@/components/loading-spinner";
import { FilterSection, ProgramPageErrorBoundary } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timelineProviders } from "@/lib/timeline-data";
import { cn } from "@/lib/utils";

interface TimelineRoute {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  features?: string[];
  period?: string;
}

// Helper function to generate features from provider data
function generateFeatures(
  provider: (typeof timelineProviders)[string]
): string[] {
  const features: string[] = [];

  // Add period
  const period = `${provider.data.axis.start}-${provider.data.axis.end}`;
  features.push(period);

  // Add category-specific feature
  features.push(provider.category);

  // Add channel count
  const channelCount = Object.keys(provider.data.channels).length;
  features.push(`${channelCount} channels`);

  return features;
}

// Helper function to determine icon based on end year
function getIcon(endYear: number): React.ReactNode {
  const currentYear = new Date().getFullYear();
  // If timeline extends to current year or beyond, use Calendar icon
  return endYear >= currentYear ? (
    <Calendar className="h-6 w-6" />
  ) : (
    <History className="h-6 w-6" />
  );
}

// Convert timeline providers to route data
function getTimelineRoutes(): TimelineRoute[] {
  return Object.values(timelineProviders).map((provider) => ({
    badge: `${provider.country} - ${provider.category}`,
    description: provider.description,
    features: generateFeatures(provider),
    href: `/channellist/history/${provider.id}`,
    icon: getIcon(provider.data.axis.end),
    period: `${provider.data.axis.start}-${provider.data.axis.end}`,
    title: provider.name,
  }));
}

const TimelineCard = memo(({ route }: { route: TimelineRoute }) => (
  <Link href={route.href} passHref>
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
          "bg-linear-to-r from-primary/10 to-transparent"
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              {route.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{route.title}</CardTitle>
              {route.badge && (
                <Badge className="mt-1" variant="secondary">
                  {route.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">
          {route.description}
        </CardDescription>

        {route.features && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {route.features.map((feature) => (
                <Badge
                  className="text-xs"
                  key={`${route.title}-${feature}`}
                  variant="outline"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            asChild
            className="w-full transition-colors group-hover:bg-primary/90"
          >
            <div>
              View Timeline
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
));

TimelineCard.displayName = "TimelineCard";

function TimelineContent() {
  const [filterText, setFilterText] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Get all timeline routes
  const allTimelineRoutes = useMemo(() => {
    const routes = getTimelineRoutes();
    // Sort by badge first, then by title
    return routes.sort((a, b) => {
      const badgeA = a.badge || "";
      const badgeB = b.badge || "";
      const badgeComparison = badgeA.localeCompare(badgeB);
      if (badgeComparison !== 0) {
        return badgeComparison;
      }
      return a.title.localeCompare(b.title);
    });
  }, []);

  // Get unique countries and categories
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    for (const provider of Object.values(timelineProviders)) {
      countries.add(provider.country);
    }
    return Array.from(countries).sort();
  }, []);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const provider of Object.values(timelineProviders)) {
      categories.add(provider.category);
    }
    return Array.from(categories).sort();
  }, []);

  // Calculate counts for filter options
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const country of uniqueCountries) {
      counts[country] = allTimelineRoutes.filter((route) => {
        // Text filter
        const matchesText =
          route.title.toLowerCase().includes(filterText.toLowerCase()) ||
          route.description.toLowerCase().includes(filterText.toLowerCase());

        // Get the provider for this route
        const provider = Object.values(timelineProviders).find(
          (p) => p.id === route.href.split("/").pop()
        );

        // Country filter
        const matchesCountry = provider && provider.country === country;

        // Category filter (if selected)
        const matchesCategory =
          selectedCategories.length === 0 ||
          (provider && selectedCategories.includes(provider.category));

        return matchesText && matchesCountry && matchesCategory;
      }).length;
    }
    return counts;
  }, [allTimelineRoutes, uniqueCountries, filterText, selectedCategories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of uniqueCategories) {
      counts[category] = allTimelineRoutes.filter((route) => {
        // Text filter
        const matchesText =
          route.title.toLowerCase().includes(filterText.toLowerCase()) ||
          route.description.toLowerCase().includes(filterText.toLowerCase());

        // Get the provider for this route
        const provider = Object.values(timelineProviders).find(
          (p) => p.id === route.href.split("/").pop()
        );

        // Category filter
        const matchesCategory = provider && provider.category === category;

        // Country filter (if selected)
        const matchesCountry =
          selectedCountries.length === 0 ||
          (provider && selectedCountries.includes(provider.country));

        return matchesText && matchesCategory && matchesCountry;
      }).length;
    }
    return counts;
  }, [allTimelineRoutes, uniqueCategories, filterText, selectedCountries]);

  // Filter and sort routes
  const filteredTimelineRoutes = useMemo(() => {
    return allTimelineRoutes.filter((route) => {
      // Text filter
      const matchesText =
        route.title.toLowerCase().includes(filterText.toLowerCase()) ||
        route.description.toLowerCase().includes(filterText.toLowerCase());

      // Country filter
      const provider = Object.values(timelineProviders).find(
        (p) => p.id === route.href.split("/").pop()
      );
      const matchesCountry =
        selectedCountries.length === 0 ||
        (provider && selectedCountries.includes(provider.country));

      // Category filter
      const matchesCategory =
        selectedCategories.length === 0 ||
        (provider && selectedCategories.includes(provider.category));

      return matchesText && matchesCountry && matchesCategory;
    });
  }, [allTimelineRoutes, filterText, selectedCountries, selectedCategories]);

  const handleCountryFilter = useCallback((country: string) => {
    setSelectedCountries((previous) =>
      previous.includes(country)
        ? previous.filter((c) => c !== country)
        : [...previous, country]
    );
  }, []);

  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategories((previous) =>
      previous.includes(category)
        ? previous.filter((c) => c !== category)
        : [...previous, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilterText("");
    setSelectedCountries([]);
    setSelectedCategories([]);
  }, []);

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setFilterText}
          placeholder="Search timelines..."
          searchValue={filterText}
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          counts={countryCounts}
          filters={selectedCountries}
          onFilterChange={handleCountryFilter}
          options={uniqueCountries}
          title="Countries"
        />
        <FilterSection
          counts={categoryCounts}
          filters={selectedCategories}
          onFilterChange={handleCategoryFilter}
          options={uniqueCategories}
          title="Categories"
        />
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="w-full text-xs"
          onClick={clearFilters}
          size="sm"
          variant="outline"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {filteredTimelineRoutes.length} of {allTimelineRoutes.length}{" "}
          timelines
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (filteredTimelineRoutes.length === 0) {
    return (
      <SidebarLayout
        contentClassName="overflow-auto"
        sidebar={sidebar}
        title="Channel History Timelines"
      >
        <div className="flex h-full flex-col items-center justify-center">
          <div className="mb-4 max-w-md">
            <div className="flex items-center">
              <Calendar className="mr-2 h-6 w-6" />
              <span className="font-bold">No Results</span>
            </div>
            <div className="mt-2 text-sm">
              No timelines match your current filter. <br />
              Try adjusting your search or clear the filter.
            </div>
          </div>
          <Button aria-label="Clear All Filters" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout
      contentClassName="overflow-auto"
      sidebar={sidebar}
      title="Channel History Timelines"
    >
      <div className="p-4 pb-4">
        {/* Description */}
        <div className="mb-6">
          <p className="text-muted-foreground text-sm">
            Explore historical channel lineup timelines showing how television
            services evolved over time. Track channel changes, launches, and
            transitions across different providers.
          </p>
        </div>
        {/* Timeline Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTimelineRoutes.map((route) => (
            <TimelineCard key={route.href} route={route} />
          ))}
        </div>
        <div aria-hidden="true" className="h-24" /> {/* Spacer element */}
      </div>
    </SidebarLayout>
  );
}

export default function TimelineIndexPageClient() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ProgramPageErrorBoundary pageName="timeline">
        <Suspense fallback={<LoadingSpinner />}>
          <TimelineContent />
        </Suspense>
      </ProgramPageErrorBoundary>
    </div>
  );
}
