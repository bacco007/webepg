import type { Metadata } from "next";
import { SITE_CONFIG, THEME_CONFIG, VIEWPORT_CONFIG } from "./constants";

export const metadata: Metadata = {
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  applicationName: SITE_CONFIG.name,
  authors: SITE_CONFIG.authors,
  category: "Entertainment",
  creator: SITE_CONFIG.creator,
  description: SITE_CONFIG.description,
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  generator: "Next.js",
  icons: {
    apple: "/favicon/apple-touch-icon.png",
    icon: [
      { url: "/favicon/favicon.ico" },
      { sizes: "16x16", type: "image/png", url: "/favicon/favicon-16x16.png" },
      { sizes: "32x32", type: "image/png", url: "/favicon/favicon-32x32.png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/favicon/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/favicon/android-chrome-512x512.png",
      },
    ],
    shortcut: "/favicon/favicon-16x16.png",
  },
  keywords: SITE_CONFIG.keywords,
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    description: SITE_CONFIG.shortDescription,
    images: [
      {
        alt: "webEPG - Free Electronic Program Guide for TV and Radio",
        height: 1200,
        type: "image/png",
        url: "/favicon/android-chrome-512x512.png",
        width: 1200,
      },
    ],
    locale: SITE_CONFIG.locale,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} - Electronic Program Guide`,
    type: "website",
    url: SITE_CONFIG.url,
  },
  other: {
    "application/ld+json": JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        description: SITE_CONFIG.description,
        logo: `${SITE_CONFIG.url}/favicon/android-chrome-512x512.png`,
        name: SITE_CONFIG.name,
        sameAs: [],
        url: SITE_CONFIG.url,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        description: SITE_CONFIG.description,
        name: SITE_CONFIG.name,
        potentialAction: {
          "@type": "SearchAction",
          "query-input": "required name=search_term_string",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
          },
        },
        publisher: {
          "@type": "Organization",
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.url,
        },
        url: SITE_CONFIG.url,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        applicationCategory: "EntertainmentApplication",
        author: {
          "@type": "Organization",
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.url,
        },
        description: SITE_CONFIG.shortDescription,
        name: SITE_CONFIG.name,
        operatingSystem: "Web Browser",
        url: SITE_CONFIG.url,
      },
    ]),
    preconnect: SITE_CONFIG.preconnect,
  },
  publisher: SITE_CONFIG.publisher,
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      noimageindex: false,
    },
    index: true,
    noarchive: false,
    nocache: true,
    nosnippet: false,
    notranslate: false,
  },
  title: {
    default: `${SITE_CONFIG.name}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE_CONFIG.twitterHandle,
    description: SITE_CONFIG.shortDescription,
    images: ["/favicon/android-chrome-512x512.png"],
    title: `${SITE_CONFIG.name} - Electronic Program Guide`,
  },
};

export const viewport = {
  colorScheme: "light dark" as const,
  initialScale: VIEWPORT_CONFIG.initialScale,
  maximumScale: VIEWPORT_CONFIG.maximumScale,
  minimumScale: VIEWPORT_CONFIG.minimumScale,
  themeColor: [
    { color: THEME_CONFIG.light, media: "(prefers-color-scheme: light)" },
    { color: THEME_CONFIG.dark, media: "(prefers-color-scheme: dark)" },
  ],
  userScalable: VIEWPORT_CONFIG.userScalable,
  viewportFit: VIEWPORT_CONFIG.viewportFit,
  width: VIEWPORT_CONFIG.width,
};
