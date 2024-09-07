'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { Separator } from '@/components/ui/separator';

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
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Timezone </h3>
          <p className="text-muted-foreground text-sm">
            Change the timezone that the EPG data is shown in
          </p>
        </div>
        <Separator />
        <div className="container grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Preferred Timezone</CardTitle>
            </CardHeader>
            <CardContent>
              <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSave}>Save Settings</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
