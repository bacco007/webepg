export const SITE_CONFIG = {
  analytics: {
    simpleAnalytics: "https://scripts.simpleanalyticscdn.com/latest.js",
  },
  authors: [{ name: "webEPG", url: "https://www.webepg.xyz" }] as Array<{
    name: string;
    url: string;
  }>,
  creator: "webEPG",
  description:
    "Free and open-source Electronic Program Guide for TV and Radio channels. Get comprehensive program listings, schedules, and more.",
  fonts: {
    googleFonts: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
  },
  keywords: [
    "EPG",
    "Electronic Program Guide",
    "Television",
    "TV Guide",
    "Program Guide",
    "Streaming",
    "Broadcast",
    "TV Schedule",
    "Radio Schedule",
    "Free EPG",
  ] as string[],
  locale: "en_US",
  name: "webEPG",
  preconnect: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://scripts.simpleanalyticscdn.com",
  ] as string[],
  publisher: "webEPG",
  shortDescription:
    "Free and open-source Electronic Program Guide for TV and Radio channels",
  twitterHandle: "@webepg",
  url: "https://www.webepg.xyz",
} as const;

export const THEME_CONFIG = {
  dark: "#0f172a",
  light: "#ffffff",
} as const;

export const VIEWPORT_CONFIG = {
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 0.5,
  userScalable: true,
  viewportFit: "cover" as const,
  width: "device-width" as const,
} as const;
