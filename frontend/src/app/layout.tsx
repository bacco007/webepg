import './globals.css';

import localFont from 'next/font/local';
import { cookies } from 'next/headers';
import Script from 'next/script';
import type { Metadata, Viewport } from 'next';

import Header from '@/components/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import TopLoader from '@/components/TopLoader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getCookie } from '@/lib/cookies';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
  preload: true,
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'webEPG',
    template: '%s | webEPG',
  },
  metadataBase: new URL('https://www.webepg.xyz'),
  description: 'Your comprehensive Electronic Program Guide',
  keywords: [
    'EPG',
    'Television',
    'TV Guide',
    'Program Guide',
    'Streaming',
    'Broadcast',
  ],
  authors: [{ name: 'webEPG', url: 'https://www.webepg.xyz' }],
  creator: 'webEPG',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.webepg.xyz',
    title: 'webEPG - Electronic Program Guide',
    description: 'Your comprehensive Electronic Program Guide',
    siteName: 'webEPG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'webEPG - Electronic Program Guide',
    description: 'Your comprehensive Electronic Program Guide',
    creator: '@webepg',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-16x16.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true';
  const fontSize = (await getCookie('fontSize')) || '100';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* Remove duplicate viewport meta tag */}</head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ fontSize: `${fontSize}%` }}
      >
        <TopLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <GlobalErrorBoundary>
            <SidebarProvider defaultOpen={defaultOpen}>
              <div
                className="flex w-full h-screen overflow-hidden"
                style={
                  {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
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
                        style={{ width: 'calc(100svw - 100px)' }}
                      >
                        {children}
                      </main>
                    </div>
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </GlobalErrorBoundary>
        </ThemeProvider>
      </body>
      <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </html>
  );
}
