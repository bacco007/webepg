import { FontSizeControl } from '@/components/FontSizeControl';
import { ThemeSelector } from '@/components/ThemeSelector';
import { TimezoneSelector } from '@/components/TimezoneSelector';
import { getCookie } from '@/lib/cookies';

export default async function SettingsPage() {
  const initialFontSize = (await getCookie('fontSize')) || '100';

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">User Settings</h1>
      <div className="bg-card space-y-6 rounded-lg p-6 shadow">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Theme Preferences</h2>
          <ThemeSelector />
        </section>
        <section>
          <h2 className="mb-4 text-xl font-semibold">Font Size</h2>
          <FontSizeControl />
        </section>
        <section>
          <h2 className="mb-4 text-xl font-semibold">Timezone Preferences</h2>
          <TimezoneSelector />
        </section>
      </div>
    </div>
  );
}
