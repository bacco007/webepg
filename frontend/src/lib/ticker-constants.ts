// Ticker animation and layout constants
export const TICKER_CONSTANTS = {
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // Width of each card in pixels
  CARD_SPACING: 12, // Right margin of each card
  CARD_WIDTH: 300, // Desired scroll speed
  PIXELS_PER_SECOND: 50, // Minimum swipe distance to trigger pause/resume
  SWIPE_THRESHOLD: 50, // 5 minutes in milliseconds
} as const;

// Default data source
export const DEFAULT_DATA_SOURCE = "xmlepg_FTASYD" as const;

// Skeleton configuration
export const SKELETON_IDS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
] as const;

// Channel specification colors for different video formats
export const channelSpecColors = {
  hdMpeg2: "bg-green-100/50 dark:bg-green-900/30",
  hdMpeg4: "bg-green-100/50 dark:bg-green-900/30",
  notAvailable: "bg-muted/80",
  radio: "bg-purple-100/50 dark:bg-purple-900/30",
  sdMpeg2: "bg-orange-100/50 dark:bg-orange-900/30",
  sdMpeg4: "bg-yellow-100/50 dark:bg-yellow-900/30",
} as const;
