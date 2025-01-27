import './globals.css';

import localFont from 'next/font/local';
import { cookies } from 'next/headers';
import Script from 'next/script';
import type { Metadata, Viewport } from 'next';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import TopLoader from '@/components/TopLoader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getCookie } from '@/lib/cookies';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: {
    default: 'webEPG',
    template: '%s | webEPG',
  },
  description: 'Your comprehensive Electronic Program Guide',
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
  //const defaultOpen = (await getCookie('sidebar:state')) === 'true';
  const fontSize = (await getCookie('fontSize')) || '100';

  return (
    <html lang="en" suppressHydrationWarning>
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
        >
          <SidebarProvider defaultOpen={defaultOpen}>
            <div
              className="flex h-screen w-full overflow-hidden"
              style={
                {
                  '--sidebar-width': '18rem',
                  '--sidebar-width-mobile': '20rem',
                } as React.CSSProperties
              }
            >
              <Sidebar />
              <SidebarInset className="flex size-full flex-col overflow-hidden">
                <Header />
                <main className="flex size-full flex-col overflow-auto">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
      <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </html>
  );
}
