import { Metadata } from 'next';

import { SidebarNav } from '@/app/settings/components/sidebar-nav';

export const metadata: Metadata = {
  title: 'Forms',
  description: 'Advanced form example using react-hook-form and Zod.',
};

const sidebarNavItems = [
  {
    title: 'Source Status',
    href: '/settings/status',
  },
  {
    title: 'Timezone',
    href: '/settings/timezone',
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>
      <div className="scrollbar-custom flex grow flex-col space-y-8 overflow-auto lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:w-4/5">{children}</div>
      </div>
    </div>
  );
}
