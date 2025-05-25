'use client';

import { ReactNode } from 'react';

import Header from '@/components/Header';
import Sidebar from '@/components/sidebar/Sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { useThemePersistence } from '@/hooks/useThemePersistence';

interface RootLayoutContentProps {
  children: ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  useThemePersistence();

  return (
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
  );
}
