'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Source {
  id: string;
  group: string;
  subgroup?: string;
  location: string;
  url: string;
}

interface GroupedSources {
  [group: string]: {
    [subgroup: string]: Source[];
  };
}

export default function SourceSelectorPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [groupedSources, setGroupedSources] = useState<GroupedSources>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
        groupSources(data);
        // Set initial value from localStorage if available
        const storedSource = localStorage.getItem('xmltvdatasource');
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

  const groupSources = (sourcesData: Source[]) => {
    const grouped: GroupedSources = {};
    sourcesData.forEach((source) => {
      if (!grouped[source.group]) {
        grouped[source.group] = {};
      }
      const subgroup = source.subgroup || 'Other';
      if (!grouped[source.group][subgroup]) {
        grouped[source.group][subgroup] = [];
      }
      grouped[source.group][subgroup].push(source);
    });

    // Sort groups alphabetically
    const sortedGroups = Object.keys(grouped).sort();
    const sortedGrouped: GroupedSources = {};

    sortedGroups.forEach((group) => {
      sortedGrouped[group] = {};
      // Sort subgroups alphabetically
      const sortedSubgroups = Object.keys(grouped[group]).sort();

      sortedSubgroups.forEach((subgroup) => {
        // Sort sources within each subgroup by location
        sortedGrouped[group][subgroup] = grouped[group][subgroup].sort((a, b) =>
          a.location.localeCompare(b.location)
        );
      });
    });

    setGroupedSources(sortedGrouped);
  };

  const handleSetSource = (sourceId: string) => {
    localStorage.setItem('xmltvdatasource', sourceId);
    setSelectedSource(sourceId);
    toast({
      title: 'Source Updated',
      description: `Data source has been set to: ${sourceId}`,
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const filteredGroupedSources = Object.entries(groupedSources).reduce<GroupedSources>(
    (acc, [group, subgroups]) => {
      const filteredSubgroups = Object.entries(subgroups).reduce<{ [subgroup: string]: Source[] }>(
        (subAcc, [subgroup, sources]) => {
          const filteredSources = sources.filter(
            (source) =>
              source.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
              group.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (subgroup !== 'Other' && subgroup.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          if (filteredSources.length > 0) {
            subAcc[subgroup] = filteredSources;
          }
          return subAcc;
        },
        {}
      );
      if (Object.keys(filteredSubgroups).length > 0) {
        acc[group] = filteredSubgroups;
      }
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto w-full max-w-4xl">
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
        <Card className="mx-auto w-full max-w-4xl">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto w-full max-w-4xl">
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
          <ScrollArea className="h-[600px] rounded-md border p-4">
            {Object.entries(filteredGroupedSources).map(([group, subgroups]) => (
              <Collapsible
                key={group}
                open={expandedGroups.has(group)}
                onOpenChange={() => toggleGroup(group)}
                className="mb-4 space-y-2"
              >
                <CollapsibleTrigger className="bg-secondary hover:bg-secondary/80 flex w-full items-center justify-between rounded-lg p-4 font-semibold">
                  <span>{group}</span>
                  {expandedGroups.has(group) ? (
                    <ChevronUp className="size-5" />
                  ) : (
                    <ChevronDown className="size-5" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  {Object.entries(subgroups).map(([subgroup, sources]) => (
                    <Card key={subgroup}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-primary text-lg font-semibold">
                          {subgroup !== 'Other' ? subgroup : ''}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {sources.map((source) => (
                          <div key={source.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{source.location}</p>
                            </div>
                            <Button
                              onClick={() => handleSetSource(source.id)}
                              variant={selectedSource === source.id ? 'default' : 'outline'}
                              size="sm"
                            >
                              {selectedSource === source.id ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
            {Object.keys(filteredGroupedSources).length === 0 && (
              <p className="text-muted-foreground text-center">No sources found</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
