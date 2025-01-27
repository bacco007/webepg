'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileIcon,
  FolderIcon,
  Globe,
  GlobeIcon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { FontSizeControl } from '@/components/FontSizeControl';
import { ThemeSelector } from '@/components/ThemeSelector';
import { TimezoneSelector } from '@/components/TimezoneSelector';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { getCookie, setCookie } from '@/lib/cookies';

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

const fontScaleOptions = [
  { value: '80', label: 'Small', icon: ZoomOut },
  { value: '100', label: 'Normal', icon: RotateCcw },
  { value: '120', label: 'Large', icon: ZoomIn },
];

const statusOptions = ['All', 'Downloaded', 'Not Downloaded'];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [timezone, setTimezone] = useState('');
  const [fontScale, setFontScale] = useState('100');
  const [sourceStatus, setSourceStatus] = useState<Record<
    string,
    SourceStatus
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [subgroupFilter, setSubgroupFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const router = useRouter();

  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = (await getCookie('theme')) || 'system';
      const savedFontScale = (await getCookie('fontSize')) || '100';
      const savedTimezone =
        (await getCookie('userTimezone')) ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      setTheme(savedTheme);
      setFontScale(savedFontScale);
      setTimezone(savedTimezone);

      document.documentElement.style.setProperty(
        '--font-scale',
        `${Number.parseInt(savedFontScale) / 100}`,
      );

      try {
        const response = await fetch(
          `/api/py/sources/status?timezone=${encodeURIComponent(savedTimezone)}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch source status');
        }
        const data = await response.json();
        setSourceStatus(data);
      } catch (error_) {
        setError(
          error_ instanceof Error
            ? error_.message
            : 'An unknown error occurred',
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [setTheme]);

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    setCookie('userTimezone', newTimezone);
  };

  const handleSave = () => {
    if (theme) {
      setCookie('theme', theme);
    }
    setCookie('fontSize', fontScale);
    setCookie('userTimezone', timezone);

    document.documentElement.style.setProperty(
      '--font-scale',
      `${Number.parseInt(fontScale) / 100}`,
    );

    router.refresh();

    toast({
      title: 'Settings saved',
      description: 'Your display preferences have been updated.',
    });
  };

  const renderFileStatus = (status: FileStatus) => (
    <div className="flex items-center space-x-2">
      <Badge
        variant={status.status === 'downloaded' ? 'default' : 'destructive'}
      >
        {status.status}
      </Badge>
      {status.date && (
        <span className="text-sm text-muted-foreground">
          {new Date(status.date).toLocaleString()}
        </span>
      )}
    </div>
  );

  const filteredSourceStatus = useMemo(() => {
    if (!sourceStatus) return null;

    return Object.entries(sourceStatus).reduce(
      (accumulator, [sourceId, status]) => {
        const allDownloaded = Object.values(status).every(
          file => file.status === 'downloaded',
        );

        if (
          (statusFilter === 'All' ||
            (statusFilter === 'Downloaded' && allDownloaded) ||
            (statusFilter === 'Not Downloaded' && !allDownloaded)) &&
          (groupFilter === 'All' || status.group === groupFilter) &&
          (subgroupFilter === 'All' || status.subgroup === subgroupFilter) &&
          (locationFilter === 'All' || status.location === locationFilter)
        ) {
          accumulator[sourceId] = status;
        }
        return accumulator;
      },
      {} as Record<string, SourceStatus>,
    );
  }, [sourceStatus, statusFilter, groupFilter, subgroupFilter, locationFilter]);

  const uniqueGroups = useMemo(() => {
    if (!sourceStatus) return ['All'];
    return [
      'All',
      ...new Set(
        Object.values(sourceStatus)
          .map(status => status.group)
          .filter((group): group is string => group !== null),
      ),
    ];
  }, [sourceStatus]);

  const uniqueSubgroups = useMemo(() => {
    if (!sourceStatus) return ['All'];
    return [
      'All',
      ...new Set(
        Object.values(sourceStatus)
          .map(status => status.subgroup)
          .filter((group): group is string => group !== null),
      ),
    ];
  }, [sourceStatus]);

  const uniqueLocations = useMemo(() => {
    if (!sourceStatus) return ['All'];
    return [
      'All',
      ...new Set(
        Object.values(sourceStatus)
          .map(status => status.location)
          .filter((group): group is string => group !== null),
      ),
    ];
  }, [sourceStatus]);

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave}>
            <Globe className="mr-2 size-4" />
            Save All Settings
          </Button>
        </div>
      </div>
      <ScrollArea className="grow">
        <div className="p-4">
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
                    <CardDescription>
                      Choose your preferred color scheme
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThemeSelector />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Font Size</CardTitle>
                    <CardDescription>
                      Adjust the text size for better readability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FontSizeControl />
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
                    <TimezoneSelector />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="source-status">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      XML Datasource Status
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Check the status of the XMLTV Datasources used by webEPG
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by group" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueGroups.map(
                          option =>
                            option !== null && (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={subgroupFilter}
                      onValueChange={setSubgroupFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by subgroup" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSubgroups.map(
                          option =>
                            option !== null && (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={locationFilter}
                      onValueChange={setLocationFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by location" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueLocations.map(
                          option =>
                            option !== null && (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    filteredSourceStatus &&
                    Object.entries(filteredSourceStatus).map(
                      ([sourceId, status]) => (
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
                                {['source_file', 'channels', 'programs'].map(
                                  fileType => (
                                    <TableRow key={fileType}>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center">
                                          <FileIcon className="mr-2 size-4" />
                                          {fileType
                                            .replace('_', ' ')
                                            .charAt(0)
                                            .toUpperCase() +
                                            fileType.replace('_', ' ').slice(1)}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {renderFileStatus(
                                          status[
                                            fileType as keyof SourceStatus
                                          ] as FileStatus,
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ),
                    )
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
