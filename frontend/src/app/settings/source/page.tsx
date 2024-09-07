'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import SourceDropdown from '@/components/snippets/SourceDropdown';
import TimezoneSelector from '@/components/snippets/TimezoneSelector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedTimezone = localStorage.getItem('userTimezone');
    if (storedTimezone) {
      setTimezone(storedTimezone);
    } else {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(detectedTimezone);
      localStorage.setItem('userTimezone', detectedTimezone);
    }
  }, []);

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('userTimezone', newTimezone);
  };

  const handleSave = () => {
    // You might want to save to a backend here if needed
    router.refresh(); // Refresh the current route
  };

  return (
    <div className="flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>
      <div
        className="relative max-h-[calc(100vh-210px)] max-w-full"
        style={{ display: 'flex', overflow: 'scroll' }}
      >
        <div className="container grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Timezone</CardTitle>
              <CardDescription>Select your preferred timezone for the EPG</CardDescription>
            </CardHeader>
            <CardContent>
              <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSave}>Save Settings</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
              <CardDescription>Select your preferred EPG Source</CardDescription>
            </CardHeader>
            <CardContent>
              <SourceDropdown />
            </CardContent>
            {/* <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave}>Save Settings</Button>
      </CardFooter> */}
          </Card>
        </div>
      </div>
    </div>
  );
}
