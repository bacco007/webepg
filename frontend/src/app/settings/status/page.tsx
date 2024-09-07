'use client';

import { useEffect, useState } from 'react';
import { FileIcon, FolderIcon, GlobeIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export default function SourceStatusPage() {
  const [sourceStatus, setSourceStatus] = useState<Record<string, SourceStatus> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourceStatus = async () => {
      try {
        const response = await fetch('/api/py/sources/status');
        if (!response.ok) {
          throw new Error('Failed to fetch source status');
        }
        const data = await response.json();
        setSourceStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSourceStatus();
  }, []);

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

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">XML Datasource Status</h3>
          <p className="text-muted-foreground text-sm">
            Check the status of the XMLTV Datasources used by webEPG
          </p>
        </div>
        <Separator />
        <div className="grid gap-6">
          {sourceStatus &&
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
            ))}
        </div>
      </div>
    </div>
  );
}
