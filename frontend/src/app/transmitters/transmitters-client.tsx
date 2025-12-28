"use client";

import { ArrowRight, Radio, Tv } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface TransmitterRoute {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  features?: string[];
}

const transmitterRoutes: TransmitterRoute[] = [
  {
    badge: "Radio",
    description: "View radio transmitter information and coverage maps",
    features: ["Transmitter locations"],
    href: "/transmitters/radio",
    icon: <Radio className="h-6 w-6" />,
    title: "Radio Transmitters",
  },
  {
    badge: "Television",
    description: "View television transmitter information and coverage maps",
    features: ["Transmitter locations"],
    href: "/transmitters/television",
    icon: <Tv className="h-6 w-6" />,
    title: "Television Transmitters",
  },
];

// Get unique transmitter types
function getUniqueTypes(): string[] {
  const types = transmitterRoutes.map((route) => route.badge || "");
  return Array.from(new Set(types)).sort();
}

const TransmitterCard = memo(({ route }: { route: TransmitterRoute }) => (
  <Link href={route.href} passHref>
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
          "bg-gradient-to-r from-primary/10 to-transparent"
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
              View Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </Link>
));

TransmitterCard.displayName = "TransmitterCard";

function TransmittersContent() {
  const [filterText, setFilterText] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const uniqueTypes = useMemo(() => getUniqueTypes(), []);

  // Calculate counts for filter options
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of uniqueTypes) {
      counts[type] = transmitterRoutes.filter((route) => {
        const matchesText =
          route.title.toLowerCase().includes(filterText.toLowerCase()) ||
          route.description.toLowerCase().includes(filterText.toLowerCase());
        const matchesType = route.badge === type;
        return matchesText && matchesType;
      }).length;
    }
    return counts;
  }, [uniqueTypes, filterText]);

  // Filter routes
  const filteredTransmitterRoutes = useMemo(
    () =>
      transmitterRoutes.filter((route) => {
        const matchesText =
          route.title.toLowerCase().includes(filterText.toLowerCase()) ||
          route.description.toLowerCase().includes(filterText.toLowerCase());

        const matchesType =
          selectedTypes.length === 0 ||
          (route.badge && selectedTypes.includes(route.badge));

        return matchesText && matchesType;
      }),
    [filterText, selectedTypes]
  );

  const handleTypeFilter = useCallback((type: string) => {
    setSelectedTypes((previous) =>
      previous.includes(type)
        ? previous.filter((t) => t !== type)
        : [...previous, type]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilterText("");
    setSelectedTypes([]);
  }, []);

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setFilterText}
          placeholder="Search transmitters..."
          searchValue={filterText}
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          counts={typeCounts}
          filters={selectedTypes}
          onFilterChange={handleTypeFilter}
          options={uniqueTypes}
          title="Transmitter Type"
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
          Showing {filteredTransmitterRoutes.length} of{" "}
          {transmitterRoutes.length} transmitters
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (filteredTransmitterRoutes.length === 0) {
    return (
      <SidebarLayout
        contentClassName="overflow-auto"
        sidebar={sidebar}
        title="Transmitter Maps (Australia)"
      >
        <div className="flex h-full flex-col items-center justify-center">
          <div className="mb-4 max-w-md">
            <div className="flex items-center">
              <Tv className="mr-2 h-6 w-6" />
              <span className="font-bold">No Results</span>
            </div>
            <div className="mt-2 text-sm">
              No transmitters match your current filter. <br />
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
      title="Transmitter Maps (Australia)"
    >
      <div className="p-4 pb-4">
        {/* Description */}
        <div className="mb-6">
          <p className="text-muted-foreground text-sm">
            Explore transmitter information for radio and television
            broadcasting services in Australia.
          </p>
        </div>
        {/* Transmitter Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredTransmitterRoutes.map((route) => (
            <TransmitterCard key={route.href} route={route} />
          ))}
        </div>
        <div aria-hidden="true" className="h-24" /> {/* Spacer element */}
      </div>
    </SidebarLayout>
  );
}

export default function TransmittersPageClient() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ProgramPageErrorBoundary pageName="transmitters">
        <Suspense fallback={<LoadingSpinner />}>
          <TransmittersContent />
        </Suspense>
      </ProgramPageErrorBoundary>
    </div>
  );
}
