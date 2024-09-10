'use client';

import React, { useEffect, useState } from 'react';
import {
  FileIcon,
  FolderIcon,
  Globe,
  GlobeIcon,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import SourceDropdown from '@/components/snippets/SourceDropdown';
import TimezoneSelector from '@/components/snippets/TimezoneSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const fontScaleOptions = [
  { value: '80', label: 'Small', icon: ZoomOut },
  { value: '100', label: 'Normal', icon: RotateCcw },
  { value: '120', label: 'Large', icon: ZoomIn },
];

interface FileStatus {
  status: string;
  date: string;
}

interface SourceStatus {
  source_file: FileStatus;
  channels: FileStatus;
  programs: FileStatus;
  group: string | null;
  subgroup: string | null;
  location: string | null;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [timezone, setTimezone] = useState('');
  const [fontScale, setFontScale] = useState('100');
  const [sourceStatus, setSourceStatus] = useState<Record<string, SourceStatus> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem('theme') || 'system';
    const savedFontScale = localStorage.getItem('fontScale') || '100';
    const savedTimezone =
      localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

    setTheme(savedTheme);
    setFontScale(savedFontScale);
    setTimezone(savedTimezone);

    document.documentElement.style.setProperty(
      '--font-scale',
      `${Number.parseInt(savedFontScale) / 100}`
    );

    // Fetch source status
    const fetchSourceStatus = async () => {
      try {
        const response = await fetch(
          `/api/py/sources/status?timezone=${encodeURIComponent(savedTimezone)}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch source status');
        }
        const data = await response.json();
        setSourceStatus(data);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSourceStatus();
  }, [setTheme]);

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('userTimezone', newTimezone);
  };

  const handleSave = () => {
    // Save settings to localStorage
    if (theme) {
      localStorage.setItem('theme', theme);
    }
    localStorage.setItem('fontScale', fontScale);
    localStorage.setItem('userTimezone', timezone);

    // You might want to save to a backend here if needed
    router.refresh(); // Refresh the current route

    toast({
      title: 'Settings saved',
      description: 'Your display preferences have been updated.',
    });
  };

  const renderFileStatus = (status: FileStatus) => (
    <div className="flex items-center space-x-2">
      <Badge variant={status.status === 'downloaded' ? 'default' : 'destructive'}>
        {status.status}
      </Badge>
      {status.date && (
        <span className="text-muted-foreground text-sm">
          {new Date(status.date).toLocaleString()}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>
      <main className="w-full grow overflow-auto">
        <div className="w-full p-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="source-status">Source Status</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Display Mode</CardTitle>
                    <CardDescription>Choose your preferred color scheme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="mr-2 size-5" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="mr-2 size-5" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setTheme('system')}
                      >
                        <Monitor className="mr-2 size-5" />
                        System
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Font Size</CardTitle>
                    <CardDescription>Adjust the text size for better readability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                      {fontScaleOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={fontScale === option.value ? 'default' : 'outline'}
                          className="w-full justify-start"
                          onClick={() => setFontScale(option.value)}
                        >
                          <option.icon className="mr-2 size-5" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Timezone</CardTitle>
                    <CardDescription>
                      Set your preferred timezone for accurate scheduling
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      style={{
                        width: '100%',
                      }}
                    >
                      <TimezoneSelector value={timezone} onChange={handleTimezoneChange} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>EPG Source</CardTitle>
                    <CardDescription>Select your preferred EPG data source</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SourceDropdown />
                  </CardContent>
                </Card>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} size="lg">
                  <Globe className="mr-2 size-5" />
                  Save All Settings
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="source-status">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">XML Datasource Status</h3>
                  <p className="text-muted-foreground text-sm">
                    Check the status of the XMLTV Datasources used by webEPG
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : error ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{error}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    sourceStatus &&
                    Object.entries(sourceStatus).map(([sourceId, status]) => (
                      <Card key={sourceId}>
                        <CardHeader>
                          <CardTitle>{sourceId}</CardTitle>
                          <CardDescription>
                            <div className="flex items-center space-x-2">
                              {status.group && (
                                <span className="flex items-center">
                                  <FolderIcon className="mr-1 size-4" />
                                  {status.group}
                                </span>
                              )}
                              {status.subgroup && (
                                <span className="flex items-center">
                                  <FolderIcon className="mr-1 size-4" />
                                  {status.subgroup}
                                </span>
                              )}
                              {status.location && (
                                <span className="flex items-center">
                                  <GlobeIcon className="mr-1 size-4" />
                                  {status.location}
                                </span>
                              )}
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>File Type</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <FileIcon className="mr-2 size-4" />
                                    Source File
                                  </div>
                                </TableCell>
                                <TableCell>{renderFileStatus(status.source_file)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <FileIcon className="mr-2 size-4" />
                                    Channels
                                  </div>
                                </TableCell>
                                <TableCell>{renderFileStatus(status.channels)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <FileIcon className="mr-2 size-4" />
                                    Programs
                                  </div>
                                </TableCell>
                                <TableCell>{renderFileStatus(status.programs)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
