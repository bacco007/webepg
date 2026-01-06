import type React from "react";
import {
  Award,
  Film,
  Gamepad2,
  Landmark,
  Music,
  Newspaper,
  Shirt,
  Tv,
  Users,
  Utensils,
} from "lucide-react";
import { formatDate, parseISODate } from "@/lib/date-utils";
import { decodeHtml } from "@/lib/html-utils";
import type { ProgramStatus } from "./program-tooltip";
import type { Channel, Program } from "./types";

// ============================================================================
// CATEGORY & ICON UTILITIES
// ============================================================================

// Category to icon mapping
const categoryIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  award: Award,
  ceremony: Award,
  cooking: Utensils,
  documentary: Landmark,
  fashion: Shirt,
  film: Film,
  food: Utensils,
  game: Gamepad2,
  "game show": Users,
  history: Landmark,
  lifestyle: Shirt,
  movie: Film,
  music: Music,
  news: Newspaper,
  reality: Users,
  series: Tv,
  show: Tv,
  sport: Gamepad2,
};

export function getProgramCategoryIcon(categories?: string[]) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const category = categories[0]?.toLowerCase() || "";

  // Find matching icon by checking if category contains any of the mapped keywords
  for (const [keyword, icon] of Object.entries(categoryIconMap)) {
    if (category.includes(keyword)) {
      return icon;
    }
  }

  return null;
}

// ============================================================================
// PROGRAM STATUS UTILITIES
// ============================================================================

export function getProgramStatus(
  isCurrentlyAiring: boolean,
  isPast: boolean
): ProgramStatus {
  if (isCurrentlyAiring) {
    return "now-playing";
  }
  if (isPast) {
    return "ended";
  }
  return "upcoming";
}

export function getProgramStatusWithDetails(program: Program, now: Date) {
  const start = parseISODate(program.start_time);
  const end = parseISODate(program.end_time);

  const isLive = now >= start && now < end;
  const hasEnded = now >= end;
  const isUpNext = now < start;

  return {
    hasEnded,
    isLive,
    isUpNext,
    status: getProgramStatus(isLive, hasEnded),
  };
}

// ============================================================================
// PROGRESS CALCULATION UTILITIES
// ============================================================================

export function calculateProgress(start: string, end: string): number {
  const startTime = parseISODate(start);
  const endTime = parseISODate(end);
  const now = new Date();

  if (now < startTime) {
    return 0;
  }
  if (now >= endTime) {
    return 100;
  }

  const totalDuration = endTime.getTime() - startTime.getTime();
  const elapsed = now.getTime() - startTime.getTime();

  return Math.round((elapsed / totalDuration) * 100);
}

// ============================================================================
// DENSITY UTILITIES
// ============================================================================

export type DensityOption = "compact" | "normal" | "detailed";

export function getDensityPadding(density: DensityOption): string {
  if (density === "compact") {
    return "p-1";
  }
  if (density === "detailed") {
    return "p-3";
  }
  return "p-2";
}

export function getDensityTextSize(density: DensityOption): string {
  if (density === "compact") {
    return "text-sm";
  }
  return "text-base";
}

export function isCompactMode(density: DensityOption): boolean {
  return density === "compact";
}

export function isDetailedMode(density: DensityOption): boolean {
  return density === "detailed";
}

// ============================================================================
// CHANNEL UTILITIES
// ============================================================================

// Regex for numeric validation - defined at top level for performance
const NUMERIC_REGEX = /^\d+$/;

export function hasValidLCN(channel: Channel): boolean {
  return Boolean(channel.channel.lcn && channel.channel.lcn !== "N/A");
}

export function getChannelName(
  channel: Channel,
  displayNameType: "clean" | "real" | "location"
): string {
  return channel.channel.name[displayNameType] || channel.channel.name.clean;
}

export function sortChannelsByNumber(
  a: Channel,
  b: Channel,
  displayNameType: "clean" | "real" | "location"
): number {
  // Check if both channels have valid LCNs
  const aHasLCN = hasValidLCN(a);
  const bHasLCN = hasValidLCN(b);

  // If both have LCNs, sort by LCN
  if (aHasLCN && bHasLCN) {
    // Extract the numeric part for proper numeric sorting
    const aLCN = a.channel.lcn;
    const bLCN = b.channel.lcn;

    // Check if both LCNs are purely numeric
    const aIsNumeric = NUMERIC_REGEX.test(aLCN);
    const bIsNumeric = NUMERIC_REGEX.test(bLCN);

    // If both are numeric, sort numerically
    if (aIsNumeric && bIsNumeric) {
      return Number.parseInt(aLCN, 10) - Number.parseInt(bLCN, 10);
    }

    // If only one is numeric, prioritize numeric values
    if (aIsNumeric) {
      return -1;
    }
    if (bIsNumeric) {
      return 1;
    }

    // If both are non-numeric, sort alphabetically
    return aLCN.localeCompare(bLCN);
  }

  // If only one has LCN, prioritize the one with LCN
  if (aHasLCN) {
    return -1;
  }
  if (bHasLCN) {
    return 1;
  }

  // If neither has LCN, sort by name
  return getChannelName(a, displayNameType).localeCompare(
    getChannelName(b, displayNameType)
  );
}

export function sortChannelsByNetwork(
  a: Channel,
  b: Channel,
  channelNetworkMap: Record<string, string>,
  displayNameType: "clean" | "real" | "location"
): number {
  const aNetwork = channelNetworkMap[a.channel.id] || "";
  const bNetwork = channelNetworkMap[b.channel.id] || "";

  // If networks are the same, sort by channel name
  if (aNetwork === bNetwork) {
    return getChannelName(a, displayNameType).localeCompare(
      getChannelName(b, displayNameType)
    );
  }

  return aNetwork.localeCompare(bNetwork);
}

export function sortChannelsWithinNetwork(
  a: Channel,
  b: Channel,
  displayNameType: "clean" | "real" | "location"
): number {
  // First try to sort by LCN if available
  const aHasLCN = hasValidLCN(a);
  const bHasLCN = hasValidLCN(b);

  if (aHasLCN && bHasLCN) {
    const aNum = Number.parseInt(a.channel.lcn, 10) || 0;
    const bNum = Number.parseInt(b.channel.lcn, 10) || 0;
    return aNum - bNum;
  }

  // Fall back to name sorting
  return getChannelName(a, displayNameType).localeCompare(
    getChannelName(b, displayNameType)
  );
}

// ============================================================================
// PROGRAM STYLING UTILITIES
// ============================================================================

// Special styling for placeholder program titles
// Background pattern SVG for diagonal stripes
const placeholderPattern = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'><path fill='none' stroke='%23888888' stroke-opacity='0.4' stroke-width='1' d='M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3'/></svg>";

export const titleColorMappings: Record<string, { className: string; style: React.CSSProperties }> = {
  "No Data Available": {
    className: "bg-[hsl(var(--placeholder-bg))] text-muted-foreground",
    style: {
      backgroundImage: `url('${placeholderPattern}')`,
      backgroundSize: "4px 4px",
      backgroundPosition: "1px 1px",
    },
  },
  "To Be Advised": {
    className: "bg-[hsl(var(--placeholder-bg))] text-muted-foreground",
    style: {
      backgroundImage: `url('${placeholderPattern}')`,
      backgroundSize: "4px 4px",
      backgroundPosition: "1px 1px",
    },
  },
  "To Be Advised (cont)": {
    className: "bg-[hsl(var(--placeholder-bg))] text-muted-foreground",
    style: {
      backgroundImage: `url('${placeholderPattern}')`,
      backgroundSize: "4px 4px",
      backgroundPosition: "1px 1px",
    },
  },
};

// Helper function to check if a program title has special styling
export function getSpecialTitleClass(title: string): { className: string; style: React.CSSProperties } | null {
  return titleColorMappings[decodeHtml(title)] || null;
}

// Helper function to check if a program is a placeholder
export function isPlaceholderProgram(title: string): boolean {
  return Object.keys(titleColorMappings).includes(decodeHtml(title));
}

export function getProgramColors(
  specialTitleClass: { className: string; style: React.CSSProperties } | null,
  isPast: boolean,
  isCurrentlyAiring: boolean
) {
  let bgColor = "";
  let textColor = "";
  let hoverBgColor = "hover:bg-accent";
  let backgroundStyle: React.CSSProperties | undefined;

  if (specialTitleClass) {
    bgColor = specialTitleClass.className;
    backgroundStyle = specialTitleClass.style;
    textColor = "";
    hoverBgColor = "";
  } else if (isPast) {
    bgColor = "bg-[hsl(var(--program-past))]";
    textColor = "text-[hsl(var(--program-past-foreground))]";
    hoverBgColor = "hover:bg-[hsl(var(--program-past))]";
  } else if (isCurrentlyAiring) {
    bgColor = "bg-[hsl(var(--program-current))]";
    textColor = "text-[hsl(var(--program-current-foreground))] font-medium";
    hoverBgColor = "hover:bg-[hsl(var(--program-current))]";
  }

  return { bgColor, hoverBgColor, textColor, backgroundStyle };
}

export function getMobileProgramStyling(
  isPlaceholder: boolean,
  specialTitleClass: string | null,
  status: ProgramStatus
) {
  if (isPlaceholder) {
    if (specialTitleClass) {
      return "border-l-gray-400 text-white";
    }
    return "border-l-transparent";
  }

  if (status === "now-playing") {
    return "border-l-[hsl(var(--program-current-border))] bg-[hsl(var(--program-current))/20]";
  }

  if (status === "upcoming") {
    return "border-l-[hsl(var(--program-new))]";
  }

  return "border-l-transparent";
}

export function getDesktopProgramStyling(status: ProgramStatus) {
  if (status === "now-playing") {
    return "border-l-[hsl(var(--program-current-border))] bg-[hsl(var(--program-current))/20]";
  }

  if (status === "upcoming") {
    return "border-l-[hsl(var(--program-new))]";
  }

  return "border-l-transparent";
}

export function getProgramColor(
  program: Program,
  useCategories: boolean,
  categoryColors: { [key: string]: string },
  defaultColorClassesArray: string[]
) {
  if (
    useCategories &&
    program.categories?.[0] &&
    categoryColors[program.categories[0]]
  ) {
    return `bg-gradient-to-br ${categoryColors[program.categories[0]]} border border-current/20 shadow-md`;
  }
  return defaultColorClassesArray[0];
}

// ============================================================================
// LAYOUT & STYLING UTILITIES
// ============================================================================

export function getZIndex(
  isHovered: boolean,
  isSelected: boolean,
  showMobileTooltip: boolean,
  isPast: boolean,
  isCurrentlyAiring: boolean
): number {
  if (isHovered || isSelected || showMobileTooltip) {
    return 100;
  }
  if (isPast) {
    return 1;
  }
  if (isCurrentlyAiring) {
    return 2;
  }
  return 1;
}

export function getGridCellBorderStyle(
  dayIndex: number,
  visibleDays: number,
  slotIndex: number,
  timeSlotsLength: number
) {
  if (dayIndex === visibleDays - 1) {
    if (slotIndex === timeSlotsLength - 1) {
      return "rounded-br-md";
    }
    return "border-b";
  }
  return "border-r border-b";
}

// ============================================================================
// PROGRAM INDICATOR UTILITIES
// ============================================================================

export function getProgramIndicators(program: Program) {
  const isPremiere =
    program.premiere ||
    program.categories?.some((cat) => cat.toLowerCase().includes("premiere"));
  const isNew =
    program.new ||
    program.categories?.some((cat) => cat.toLowerCase().includes("new"));

  return { isNew, isPremiere };
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export function formatProgramDuration(start: string, end: string): string {
  const startTime = parseISODate(start);
  const endTime = parseISODate(end);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));
  return `${durationMinutes} min`;
}

export function formatProgramTimeRange(start: string, end: string): string {
  return `${formatDate(parseISODate(start), "HH:mm")} - ${formatDate(parseISODate(end), "HH:mm")}`;
}
