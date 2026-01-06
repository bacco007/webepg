/**
 * Timeline Constants
 * Constants and configuration for the Timeline component
 */

import type { TimelineEventType } from "./types";

export const TIMELINE_CONSTANTS = {
  DEFAULT_GAP: 6,
  DEFAULT_LABEL_WIDTH: 60,
  DEFAULT_PX_PER_YEAR: 480, // 240px = 20px per month (divisible by 12)
  DEFAULT_ROW_HEIGHT: 45,
  DEFAULT_SPAN_PADDING: 4,
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
  Added:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  Launch:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  Merge:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  Move: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  News: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  Removal:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  Rename:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  Split:
    "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
};

// Genre colors for channel categorization
// Colors are organized by semantic meaning and frequency of use
export const GENRE_COLORS: Record<string, string> = {
  // Mature content - Red (warning color)
  Adult:
    "bg-red-100 text-red-950 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-600 dark:hover:bg-red-900/70",

  // Creative & Arts - Purple family
  Arts: "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200 dark:bg-purple-800/50 dark:text-purple-200 dark:border-purple-600 dark:hover:bg-purple-800/70",

  // Community & Social - Teal family
  Community:
    "bg-teal-100 text-teal-900 border-teal-200 hover:bg-teal-200 dark:bg-teal-800/50 dark:text-teal-200 dark:border-teal-600 dark:hover:bg-teal-800/70",

  // Information & Data - Blue family
  Datacasting:
    "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200 dark:bg-blue-800/50 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-800/70",

  // Neutral & Default
  Default:
    "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600",

  // Educational & Documentary - Amber/Yellow family
  Documentary:
    "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200 dark:bg-amber-800/50 dark:text-amber-200 dark:border-amber-600 dark:hover:bg-amber-800/70",
  Education:
    "bg-cyan-100 text-cyan-900 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-800/50 dark:text-cyan-200 dark:border-cyan-600 dark:hover:bg-cyan-800/70",

  // Entertainment - Violet/Purple family
  Entertainment:
    "bg-violet-100 text-violet-900 border-violet-200 hover:bg-violet-200 dark:bg-violet-800/50 dark:text-violet-200 dark:border-violet-600 dark:hover:bg-violet-800/70",

  // Special/Extra channels - Fuchsia/Pink family
  Extra:
    "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200 hover:bg-fuchsia-200 dark:bg-fuchsia-800/50 dark:text-fuchsia-200 dark:border-fuchsia-600 dark:hover:bg-fuchsia-800/70",

  // Free-to-Air & Interactive - Green/Emerald family
  FTA: "bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-800/50 dark:text-emerald-200 dark:border-emerald-600 dark:hover:bg-emerald-800/70",

  // Gaming & Sports - Green/Lime family
  Gaming:
    "bg-green-100 text-green-900 border-green-200 hover:bg-green-200 dark:bg-green-800/50 dark:text-green-200 dark:border-green-600 dark:hover:bg-green-800/70",
  Information:
    "bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200 dark:bg-sky-800/50 dark:text-sky-200 dark:border-sky-600 dark:hover:bg-sky-800/70",
  Interactive:
    "bg-teal-100 text-teal-900 border-teal-200 hover:bg-teal-200 dark:bg-teal-800/50 dark:text-teal-200 dark:border-teal-600 dark:hover:bg-teal-800/70",

  // International & Cultural - Cyan family
  International:
    "bg-cyan-100 text-cyan-900 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-800/50 dark:text-cyan-200 dark:border-cyan-600 dark:hover:bg-cyan-800/70",

  // Family & Lifestyle - Pink/Orange family
  Kids: "bg-pink-100 text-pink-900 border-pink-200 hover:bg-pink-200 dark:bg-pink-800/50 dark:text-pink-200 dark:border-pink-600 dark:hover:bg-pink-800/70",
  Lifestyle:
    "bg-orange-100 text-orange-900 border-orange-200 hover:bg-orange-200 dark:bg-orange-800/50 dark:text-orange-200 dark:border-orange-600 dark:hover:bg-orange-800/70",

  // Movies & Premium - Rose/Yellow family
  Movies:
    "bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200 dark:bg-rose-800/50 dark:text-rose-200 dark:border-rose-600 dark:hover:bg-rose-800/70",

  // Music - Indigo
  Music:
    "bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-800/50 dark:text-indigo-200 dark:border-indigo-600 dark:hover:bg-indigo-800/70",
  News: "bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200 dark:bg-sky-800/50 dark:text-sky-200 dark:border-sky-600 dark:hover:bg-sky-800/70",
  Other:
    "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600",
  Popup:
    "bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-800/50 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/70",
  PPV: "bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-800/50 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/70",
  Promo:
    "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200 dark:bg-amber-800/50 dark:text-amber-200 dark:border-amber-600 dark:hover:bg-amber-800/70",
  Radio:
    "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200 dark:bg-purple-800/50 dark:text-purple-200 dark:border-purple-600 dark:hover:bg-purple-800/70",

  // Religious & Support - Neutral grays
  Religious:
    "bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-600",

  // Shared channels - Special gradient pattern
  Shared:
    "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-slate-900 border-slate-200 hover:from-slate-200 hover:via-slate-100 hover:to-slate-200 bg-[length:8px_8px] [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:from-slate-600 dark:hover:via-slate-700 dark:hover:to-slate-600 dark:[background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.08)_4px,rgba(255,255,255,0.08)_8px)]",

  // Shopping & Commercial - Red family
  Shopping:
    "bg-red-100 text-red-900 border-red-200 hover:bg-red-200 dark:bg-red-800/50 dark:text-red-200 dark:border-red-600 dark:hover:bg-red-800/70",
  Special:
    "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200 hover:bg-fuchsia-200 dark:bg-fuchsia-800/50 dark:text-fuchsia-200 dark:border-fuchsia-600 dark:hover:bg-fuchsia-800/70",
  "Special Interest":
    "bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200 dark:bg-rose-800/50 dark:text-rose-200 dark:border-rose-600 dark:hover:bg-rose-800/70",
  Sports:
    "bg-lime-100 text-lime-900 border-lime-200 hover:bg-lime-200 dark:bg-lime-800/50 dark:text-lime-200 dark:border-lime-600 dark:hover:bg-lime-800/70",
  Streaming:
    "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200 dark:bg-purple-800/50 dark:text-purple-200 dark:border-purple-600 dark:hover:bg-purple-800/70",
  Support:
    "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600",
  Television:
    "bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-800/50 dark:text-indigo-200 dark:border-indigo-600 dark:hover:bg-indigo-800/70",
  Unknown:
    "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600",
};
