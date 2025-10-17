/**
 * Timeline Constants
 * Constants and configuration for the Timeline component
 */

import type { TimelineEventType } from "./types";

export const TIMELINE_CONSTANTS = {
  DEFAULT_GAP: 6,
  DEFAULT_LABEL_WIDTH: 80,
  DEFAULT_PX_PER_YEAR: 240, // 240px = 20px per month (divisible by 12)
  DEFAULT_ROW_HEIGHT: 50,
  DEFAULT_SPAN_PADDING: 6,
  MIN_SPAN_WIDTH: 40, // Minimum visible width (expands on hover to show full text)
  MOBILE_GAP: 4,
  MOBILE_LABEL_WIDTH: 60,
  MOBILE_PX_PER_YEAR: 120, // 120px = 10px per month (divisible by 12)
  MOBILE_ROW_HEIGHT: 50,
} as const;

export const EVENT_TYPE_BADGES: Record<TimelineEventType, string> = {
  Added: "➕",
  Launch: "🆕",
  Merge: "🧩",
  Move: "🔀",
  News: "📰",
  Removal: "⛔",
  Rename: "🏷️",
  Split: "🍃",
};

export const EVENT_TYPE_COLORS: Record<TimelineEventType, string> = {
  Added: "bg-green-100 text-green-800 border-green-200",
  Launch: "bg-blue-100 text-blue-800 border-blue-200",
  Merge: "bg-purple-100 text-purple-800 border-purple-200",
  Move: "bg-orange-100 text-orange-800 border-orange-200",
  News: "bg-blue-100 text-blue-800 border-blue-200",
  Removal: "bg-red-100 text-red-800 border-red-200",
  Rename: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Split: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

// Genre colors for channel categorization
export const GENRE_COLORS: Record<string, string> = {
  Default: "bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300",
  Documentary:
    "bg-amber-200 text-amber-900 border-amber-300 hover:bg-amber-300",
  Education: "bg-teal-200 text-teal-900 border-teal-300 hover:bg-teal-300",
  Entertainment:
    "bg-violet-200 text-violet-900 border-violet-300 hover:bg-violet-300",
  FTA: "bg-emerald-200 text-emerald-900 border-emerald-300 hover:bg-emerald-300",
  Kids: "bg-pink-200 text-pink-900 border-pink-300 hover:bg-pink-300",
  Lifestyle:
    "bg-orange-200 text-orange-900 border-orange-300 hover:bg-orange-300",
  Movies: "bg-rose-200 text-rose-900 border-rose-300 hover:bg-rose-300",
  Music: "bg-indigo-200 text-indigo-900 border-indigo-300 hover:bg-indigo-300",
  News: "bg-sky-200 text-sky-900 border-sky-300 hover:bg-sky-300",
  Shared:
    "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-slate-900 border-slate-300 hover:from-slate-300 hover:via-slate-200 hover:to-slate-300 bg-[length:8px_8px] [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)]",
  Sports: "bg-lime-200 text-lime-900 border-lime-300 hover:bg-lime-300",
};

export const TIMELINE_STYLES = {
  container:
    "w-full bg-background border border-border rounded-lg overflow-hidden",
  event: "absolute -top-2 flex translate-y-[-100%] flex-col items-center",
  eventBadge: "mt-1 select-none text-[10px] leading-none",
  eventLabel:
    "mt-1 whitespace-nowrap rounded border bg-background/85 px-1 py-0.5 text-[10px]",
  eventLine: "h-3 w-px bg-muted-foreground/60",
  grid: "absolute top-0 bottom-0 border-l border-dashed border-border/50",
  header:
    "sticky top-0 z-20 flex border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60",
  label:
    "sticky left-0 z-10 flex shrink-0 items-center border-r bg-background/90 px-3 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/60",
  legend: "mb-3 flex flex-wrap items-center gap-2 text-sm",
  legendItem: "inline-flex items-center gap-1 rounded border px-2 py-1",
  row: "flex border-b border-border last:border-b-0",
  span: "absolute -translate-y-1/2 top-1/2 rounded border px-2 py-1 text-xs transition-shadow hover:shadow-md cursor-pointer",
  tick: "absolute top-0 h-full border-l border-border",
  tickLabel:
    "absolute -translate-x-1/2 top-0 text-[11px] text-muted-foreground",
  track: "relative overflow-x-auto",
} as const;

// Channel-specific styling classes
export const CHANNEL_STYLES = {
  // ABC - Black/metallic intertwined
  abc: "bg-gradient-to-br from-gray-800 to-gray-900 text-white font-bold px-4 py-2 rounded-lg shadow-lg border-2 border-gray-700",

  // Black Block - Solid black
  "black-block": "bg-black text-white font-bold px-4 py-2 rounded-lg shadow-lg",

  // Channel 7 - Red stylized
  "channel-7":
    "bg-gradient-to-br from-red-500 to-red-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform -rotate-1 hover:rotate-0 transition-transform",

  // Discovery Channel - Blue with globe
  discovery:
    "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg",

  // Encore Sunburst - Purple sunburst
  "encore-sunburst":
    "bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold px-4 py-2 rounded-full shadow-lg transform rotate-3 hover:rotate-0 transition-transform",

  // Encore Wave - Blue wave
  "encore-wave":
    "bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform -rotate-1 hover:rotate-0 transition-transform",

  // Fox 8 Blue - Blue FOX8
  "fox-8-blue":
    "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg",

  // Fox 8 Orange - Orange and blue
  "fox-8-orange":
    "bg-gradient-to-r from-orange-500 to-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform rotate-1 hover:rotate-0 transition-transform",

  // Fox Classics 3D - Brown 3D effect
  "fox-classics-3d":
    "bg-gradient-to-br from-amber-600 to-amber-800 text-white font-bold px-4 py-2 rounded-lg shadow-xl border-2 border-amber-400 transform rotate-2 hover:rotate-0 transition-transform",

  // Fox Classics Simple - Black on white
  "fox-classics-simple":
    "bg-white border-2 border-black text-black font-bold px-4 py-2 rounded-lg shadow-md",

  // Fox Kids - Purple and green
  "fox-kids":
    "bg-gradient-to-r from-purple-500 to-green-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform rotate-1 hover:rotate-0 transition-transform",

  // Fox Kids Colorful - Colorful Fox Kids
  "fox-kids-colorful":
    "bg-gradient-to-r from-pink-500 via-purple-500 to-green-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform rotate-1 hover:rotate-0 transition-transform",

  // Fox Simple - Black FOX
  "fox-simple": "bg-black text-white font-bold px-4 py-2 rounded-lg shadow-lg",

  // Nick Nite - Green and purple arrow style
  "nick-nite":
    "bg-gradient-to-r from-green-500 to-purple-600 text-white font-bold px-3 py-2 rounded-lg shadow-md transform -rotate-1 hover:rotate-0 transition-transform",
  // Nickelodeon - Orange splat style
  nickelodeon:
    "bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold rounded-full px-4 py-2 shadow-lg transform rotate-2 hover:rotate-0 transition-transform",

  // SHOWTIME - Red text
  showtime:
    "bg-gradient-to-r from-red-600 to-red-800 text-white font-bold px-4 py-2 rounded-lg shadow-lg",

  // SHOWTIME GREATS - Blue text
  "showtime-greats":
    "bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold px-4 py-2 rounded-lg shadow-lg",

  // TV1 - Diamond shapes
  tv1: "bg-gradient-to-br from-purple-500 via-orange-500 to-green-500 text-white font-bold px-3 py-2 rounded-lg shadow-lg transform rotate-1 hover:rotate-0 transition-transform",

  // UK•TV - Red text on white
  "uk-tv":
    "bg-white border-2 border-red-500 text-red-600 font-bold px-4 py-2 rounded-lg shadow-md",
} as const;
