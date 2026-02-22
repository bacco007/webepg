import "./globals.css";
import { Public_Sans } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { FontSizeProvider } from "@/components/font-size-provider";
import { GlobalErrorBoundary } from "@/components/global-error-boundary";
import Header from "@/components/Header";
import AppSidebar from "@/components/sidebar/Sidebar";
import { SkipLink } from "@/components/skip-link";
import { ThemeProvider } from "@/components/theme-provider";
import TopLoader from "@/components/top-loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_CONFIG } from "@/config/constants";
import {
  metadata as siteMetadata,
  viewport as siteViewport,
} from "@/config/metadata";

export const metadata = siteMetadata;
export const viewport = siteViewport;

const publicSans = Public_Sans({
  display: "swap",
  fallback: ["system-ui", "arial"],
  preload: true,
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          as="style"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="preload"
        />
      </head>
      <body className={`${publicSans.variable} antialiased`}>
        <SkipLink />
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
              <NuqsAdapter>
                <TooltipProvider>
                  <SidebarProvider
                    className="flex h-screen w-full overflow-hidden"
                    defaultOpen={defaultOpen}
                  >
                    <AppSidebar variant="inset" />
                    <SidebarInset className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden lg:p-2">
                        <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col justify-start overflow-hidden bg-container lg:rounded-md lg:border">
                          <Header />
                          <main
                            aria-label="Main content"
                            className="main-content flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-background"
                            id="main-content"
                          >
                            {children}
                          </main>
                        </div>
                      </div>
                    </SidebarInset>
                  </SidebarProvider>
                </TooltipProvider>
              </NuqsAdapter>
            </GlobalErrorBoundary>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
      <Script
        defer
        src={SITE_CONFIG.analytics.simpleAnalytics}
        strategy="afterInteractive"
      />
    </html>
  );
}
