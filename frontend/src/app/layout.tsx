import './globals.css';

import type { Metadata, Viewport } from 'next';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { fonts } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: {
    default: 'webEPG',
    template: '%s | webEPG',
  },
  description: 'Your comprehensive Electronic Program Guide',
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-16x16.png',
    apple: '/favicon/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn('bg-background from-background to-secondary font-sans antialiased', fonts)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen flex-col overflow-hidden">
            <Header className="shrink-0" />
            <main className="scrollbar-custom grow overflow-auto">
              <div className="from-background to-secondary min-h-full w-full bg-gradient-to-br">
                {children}
              </div>
            </main>
            <Footer className="h-12 shrink-0" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
