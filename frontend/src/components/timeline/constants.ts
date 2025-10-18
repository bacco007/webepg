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
export const GENRE_COLORS: Record<string, string> = {
  // Mature content
  Adult:
    "bg-red-300 text-red-950 border-red-400 hover:bg-red-400 dark:bg-red-950/60 dark:text-red-100 dark:border-red-900 dark:hover:bg-red-950/80",
  Arts: "bg-purple-200 text-purple-900 border-purple-300 hover:bg-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700 dark:hover:bg-purple-900/60",
  Community:
    "bg-teal-200 text-teal-900 border-teal-300 hover:bg-teal-300 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-700 dark:hover:bg-teal-900/60",
  Default:
    "bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
  Documentary:
    "bg-amber-200 text-amber-900 border-amber-300 hover:bg-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/60",

  // Information & education
  Education:
    "bg-teal-200 text-teal-900 border-teal-300 hover:bg-teal-300 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-700 dark:hover:bg-teal-900/60",
  // Core content types (high frequency)
  Entertainment:
    "bg-violet-200 text-violet-900 border-violet-300 hover:bg-violet-300 dark:bg-violet-900/40 dark:text-violet-100 dark:border-violet-700 dark:hover:bg-violet-900/60",
  Extra:
    "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300 hover:bg-fuchsia-300 dark:bg-fuchsia-900/40 dark:text-fuchsia-100 dark:border-fuchsia-700 dark:hover:bg-fuchsia-900/60",
  FTA: "bg-emerald-200 text-emerald-900 border-emerald-300 hover:bg-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-900/60",
  Information:
    "bg-blue-200 text-blue-900 border-blue-300 hover:bg-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/60",

  // International & cultural
  International:
    "bg-cyan-200 text-cyan-900 border-cyan-300 hover:bg-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-100 dark:border-cyan-700 dark:hover:bg-cyan-900/60",
  Kids: "bg-pink-200 text-pink-900 border-pink-300 hover:bg-pink-300 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700 dark:hover:bg-pink-900/60",
  Lifestyle:
    "bg-orange-200 text-orange-900 border-orange-300 hover:bg-orange-300 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700 dark:hover:bg-orange-900/60",
  Movies:
    "bg-rose-200 text-rose-900 border-rose-300 hover:bg-rose-300 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-700 dark:hover:bg-rose-900/60",
  Music:
    "bg-indigo-200 text-indigo-900 border-indigo-300 hover:bg-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-700 dark:hover:bg-indigo-900/60",
  News: "bg-sky-200 text-sky-900 border-sky-300 hover:bg-sky-300 dark:bg-sky-900/40 dark:text-sky-100 dark:border-sky-700 dark:hover:bg-sky-900/60",

  // Premium & special
  PPV: "bg-yellow-200 text-yellow-900 border-yellow-300 hover:bg-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-900/60",

  // Audio & broadcast
  Radio:
    "bg-purple-200 text-purple-900 border-purple-300 hover:bg-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700 dark:hover:bg-purple-900/60",
  Religious:
    "bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-zinc-300 dark:bg-zinc-800/60 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800/80",

  // Shared & special layouts
  Shared:
    "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-slate-900 border-slate-300 hover:from-slate-300 hover:via-slate-200 hover:to-slate-300 bg-[length:8px_8px] [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.05)_4px,rgba(0,0,0,0.05)_8px)] dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:from-slate-700 dark:hover:via-slate-800 dark:hover:to-slate-700 dark:[background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_8px)]",
  Shopping:
    "bg-red-200 text-red-900 border-red-300 hover:bg-red-300 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700 dark:hover:bg-red-900/60",
  Special:
    "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300 hover:bg-fuchsia-300 dark:bg-fuchsia-900/40 dark:text-fuchsia-100 dark:border-fuchsia-700 dark:hover:bg-fuchsia-900/60",
  Sports:
    "bg-lime-200 text-lime-900 border-lime-300 hover:bg-lime-300 dark:bg-lime-900/40 dark:text-lime-100 dark:border-lime-700 dark:hover:bg-lime-900/60",
  Support:
    "bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300 dark:bg-gray-800/60 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800/80",

  // Default & unknown
  Unknown:
    "bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
};
