"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProviderBadgeProps = {
  provider: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

const providerColors: Record<string, string> = {
  austar:
    "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400",
  ectv: "bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400",
  foxtel:
    "bg-purple-600/10 text-purple-800 hover:bg-purple-600/20 dark:text-purple-300",
  galaxy:
    "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400",
  ncable:
    "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-400",
  northgate:
    "bg-green-600/10 text-green-800 hover:bg-green-600/20 dark:text-green-300",
  optus:
    "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400",
  optusvision:
    "bg-green-600/10 text-green-800 hover:bg-green-600/20 dark:text-green-300",
  selectv:
    "bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 dark:text-pink-400",
};

const providerNames: Record<string, string> = {
  abc: "ABC",
  aussat: "AUSSAT",
  austar: "Austar",
  australis: "Australis Media",
  cetv: "CETV",
  dazn: "DAZN",
  ectv: "ECTV",
  fetchtv: "Fetch TV",
  foxtel: "Foxtel",
  galaxy: "Galaxy",
  ncable: "Neighbourhood Cable",
  "news-corp": "News Corp (Australia)",
  nine: "Nine",
  northgate: "Northgate Communications",
  optus: "Optus",
  optusitv: "Optus iTV",
  optusvision: "Optus Vision",
  pbl: "PBL",
  selectv: "SelecTV",
  seven: "Seven",
  tarbs: "TARBS",
  telstra: "Telstra",
  ten: "Ten",
  transact: "TransACT",
  ubiworldtv: "UBI World TV",
  "xyz-entertainment": "XYZ Entertainment",
};

/**
 * Get the clean display name for a provider ID
 */
export function getProviderName(providerId: string): string {
  return providerNames[providerId] || providerId;
}

export function ProviderBadge({
  provider,
  active = false,
  onClick,
  className,
}: ProviderBadgeProps) {
  const colorClass =
    providerColors[provider] ||
    "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 dark:text-gray-400";
  const displayName = providerNames[provider] || provider;

  return (
    <Badge
      className={cn(
        "cursor-pointer transition-all",
        !active && colorClass,
        active && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
      variant={active ? "default" : "outline"}
    >
      {displayName}
    </Badge>
  );
}

type ProviderFilterProps = {
  providers: string[];
  selectedProviders: string[];
  onToggle: (provider: string) => void;
  className?: string;
};

export function ProviderFilter({
  providers,
  selectedProviders,
  onToggle,
  className,
}: ProviderFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {providers.map((provider) => (
        <ProviderBadge
          active={selectedProviders.includes(provider)}
          key={provider}
          onClick={() => onToggle(provider)}
          provider={provider}
        />
      ))}
    </div>
  );
}

// Event Type Filter component (similar to ProviderFilter)
type EventTypeFilterProps = {
  eventTypes: string[];
  selectedEventTypes: string[];
  onToggle: (eventType: string) => void;
  className?: string;
};

const eventTypeColors: Record<string, string> = {
  acquisition:
    "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-400",
  closure: "bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400",
  expansion:
    "bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-400",
  launch:
    "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400",
  merger:
    "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400",
  milestone:
    "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-400",
  other: "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 dark:text-gray-400",
  partnership:
    "bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 dark:text-pink-400",
  rebrand:
    "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-400",
  regulation:
    "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400",
  technology:
    "bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-400",
};

const eventTypeNames: Record<string, string> = {
  acquisition: "Acquisition",
  closure: "Closure",
  expansion: "Expansion",
  industry: "Industry",
  launch: "Launch",
  merger: "Merger",
  milestone: "Milestone",
  other: "Other",
  partnership: "Partnership",
  rebrand: "Rebrand",
  regulation: "Regulation",
  "super-league-war": "Super League War",
  technology: "Technology",
};

export function EventTypeFilter({
  eventTypes,
  selectedEventTypes,
  onToggle,
  className,
}: EventTypeFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {eventTypes.map((eventType) => {
        const colorClass =
          eventTypeColors[eventType] ||
          "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 dark:text-gray-400";
        const displayName = eventTypeNames[eventType] || eventType;

        return (
          <Badge
            className={cn(
              "cursor-pointer transition-all",
              !selectedEventTypes.includes(eventType) && colorClass,
              selectedEventTypes.includes(eventType) && "ring-2 ring-primary",
              className
            )}
            key={eventType}
            onClick={() => onToggle(eventType)}
            variant={
              selectedEventTypes.includes(eventType) ? "default" : "outline"
            }
          >
            {displayName}
          </Badge>
        );
      })}
    </div>
  );
}
