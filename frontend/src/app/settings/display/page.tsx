'use client';

import React, { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

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
  const { theme, setTheme } = useTheme();
  const [timezone, setTimezone] = useState('');
  const router = useRouter();

  const handleSave = () => {
    // You might want to save to a backend here if needed
    router.refresh(); // Refresh the current route
  };

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Display </h3>
          <p className="text-muted-foreground text-sm">Change the display settings</p>
        </div>
        <Separator />
        <div className="container grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Display Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-1">
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="icon"
                  className="w-full"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="size-5" />
                  <span className="pl-2">Dark Mode</span>
                </Button>
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="icon"
                  className="w-full"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="size-5" />
                  <span className="pl-2">Light Mode</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="icon"
                  className="w-full"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="size-5" />
                  <span className="pl-2">System Defined Mode</span>
                </Button>
              </div>
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
