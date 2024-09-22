'use client';

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Source {
  id: string;
  group: string;
  subgroup?: string;
  location: string;
}

export default function SourceSelectorPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const data: Source[] = await response.json();
        setSources(data);
        // Set initial value from localStorage if available
        const storedSource = localStorage.getItem('storedDataSource');
        if (storedSource) {
          setSelectedSource(storedSource);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  const handleSetSource = (sourceId: string) => {
    localStorage.setItem('storedDataSource', sourceId);
    setSelectedSource(sourceId);
    toast({
      title: 'Source Updated',
      description: `Data source has been set to: ${sourceId}`,
    });
  };

  const filteredSources = sources.filter(
    (source) =>
      source.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.subgroup && source.subgroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="flex h-24 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">EPG Data Source</CardTitle>
          <CardDescription>Select your preferred EPG data provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Search className="size-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grow"
            />
          </div>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {filteredSources.map((source) => (
              <div key={source.id} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{source.location}</h3>
                    <p className="text-sm text-gray-500">
                      {source.group}
                      {source.subgroup && ` - ${source.subgroup}`}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSetSource(source.id)}
                    variant={selectedSource === source.id ? 'default' : 'outline'}
                  >
                    {selectedSource === source.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            ))}
            {filteredSources.length === 0 && (
              <p className="text-center text-gray-500">No sources found</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
