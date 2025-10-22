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
  optus:
    "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400",
  optusitv:
    "bg-green-600/10 text-green-800 hover:bg-green-600/20 dark:text-green-300",
  selectv:
    "bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 dark:text-pink-400",
};

const providerNames: Record<string, string> = {
  austar: "Austar",
  ectv: "ECTV",
  foxtel: "Foxtel",
  galaxy: "Galaxy",
  ncable: "Neighbourhood Cable",
  optus: "Optus Vision",
  optusitv: "Optus iTV",
  selectv: "SelecTV",
};

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
