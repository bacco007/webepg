import "./globals.css";

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { FontSizeProvider } from "@/components/font-size-provider";
import { GlobalErrorBoundary } from "@/components/global-error-boundary";
import Header from "@/components/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import TopLoader from "@/components/top-loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const ibmPlexSans = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // verification: {
  //   google: 'your-google-site-verification',
  // },
  alternates: {
    canonical: "https://www.webepg.xyz",
  },
  authors: [{ name: "webEPG", url: "https://www.webepg.xyz" }],
  creator: "webEPG",
  description:
    "Free and open-source Electronic Program Guide for TV and Radio channels. Get comprehensive program listings, schedules, and more.",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
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
  ],
  metadataBase: new URL("https://www.webepg.xyz"),
  openGraph: {
    description:
      "Free and open-source Electronic Program Guide for TV and Radio channels",
    images: [
      {
        alt: "webEPG Logo",
        height: 512,
        url: "/favicon/android-chrome-512x512.png",
        width: 512,
      },
    ],
    locale: "en_US",
    siteName: "webEPG",
    title: "webEPG - Electronic Program Guide",
    type: "website",
    url: "https://www.webepg.xyz",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      applicationCategory: "EntertainmentApplication",
      author: {
        "@type": "Organization",
        name: "webEPG",
        url: "https://www.webepg.xyz",
      },
      description:
        "Free and open-source Electronic Program Guide for TV and Radio channels",
      name: "webEPG",
      operatingSystem: "Web Browser",
      url: "https://www.webepg.xyz",
    }),
    preconnect: [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://scripts.simpleanalyticscdn.com",
    ],
  },
  publisher: "webEPG",
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
    nocache: true,
  },
  title: {
    default: "webEPG - Electronic Program Guide",
    template: "%s | webEPG",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@webepg",
    description:
      "Free and open-source Electronic Program Guide for TV and Radio channels",
    images: ["/favicon/android-chrome-512x512.png"],
    title: "webEPG - Electronic Program Guide",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 0.5,
  themeColor: [
    { color: "#ffffff", media: "(prefers-color-scheme: light)" },
    { color: "#0f172a", media: "(prefers-color-scheme: dark)" },
  ],
  userScalable: true,
  viewportFit: "cover",
  width: "device-width",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} antialiased`}>
        <TopLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableColorScheme
          enableSystem
        >
          <FontSizeProvider>
            <GlobalErrorBoundary>
              <SidebarProvider defaultOpen={defaultOpen}>
                <div
                  className="flex w-full h-screen overflow-hidden"
                  style={
                    {
                      "--sidebar-width": "calc(var(--spacing) * 72)",
                    } as React.CSSProperties
                  }
                >
                  <Sidebar />
                  <SidebarInset>
                    <div className="lg:p-2 w-full h-svh overflow-hidden">
                      <div className="flex flex-col justify-start bg-container lg:border lg:rounded-md w-full h-full overflow-hidden">
                        <Header />
                        <main
                          className="flex flex-col h-[calc(100svh-40px)] lg:h-[calc(100svh-56px)] size-full overflow-auto"
                          style={{ width: "calc(100svw - 100px)" }}
                        >
                          {children}
                        </main>
                      </div>
                    </div>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </GlobalErrorBoundary>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
      <Script
        defer
        src="https://scripts.simpleanalyticscdn.com/latest.js"
        strategy="afterInteractive"
      />
    </html>
  );
}
