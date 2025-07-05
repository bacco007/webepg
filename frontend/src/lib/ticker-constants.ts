// Ticker animation and layout constants
export const TICKER_CONSTANTS = {
  CARD_WIDTH: 300, // Width of each card in pixels
  CARD_SPACING: 12, // Right margin of each card
  PIXELS_PER_SECOND: 50, // Desired scroll speed
  SWIPE_THRESHOLD: 50, // Minimum swipe distance to trigger pause/resume
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
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
