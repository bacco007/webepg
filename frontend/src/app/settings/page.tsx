'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import TimezoneSelector from '@/components/snippets/TimezoneSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your application preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Timezone</h3>
              <p className="text-muted-foreground text-sm">
                Select your preferred timezone for the EPG
              </p>
            </div>
            <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
