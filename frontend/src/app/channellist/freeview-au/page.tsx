'use client';

import type React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChannelLogo {
  light: string;
  dark: string;
}

interface ChannelNames {
  clean: string;
  location: string;
  real: string;
}

interface OtherData {
  channel_type: string;
  channel_specs: string;
}

interface Channel {
  guidelink: string;
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_url: string;
  channel_number: string;
  channel_group: string;
  chlogo: string;
  program_count: number;
  channel_logo: ChannelLogo;
  channel_names: ChannelNames;
  other_data: OtherData;
}

interface UniqueChannel extends Omit<Channel, 'channel_number'> {
  channel_numbers: string[];
  isGrouped: boolean;
}

interface APIResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
}

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo: {
    light: string;
    dark: string;
  };
}

interface GroupedSources {
  [key: string]: Source[];
}

function FilterSection({
  title,
  children,
  isOpen,
  onToggle,
  count,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
}) {
  return (
    <div className="border-b">
      <div
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/10"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{count}</span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="thin-scrollbar max-h-[300px] space-y-1 overflow-y-auto pr-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Component() {
  const [channels, setChannels] = useState<UniqueChannel[]>([]);
  const [groupedSources, setGroupedSources] = useState<GroupedSources>({});
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSources, setFilteredSources] = useState<Source[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get('source');

  useEffect(() => {
    fetch('/api/py/sources')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch sources');
        return response.json();
      })
      .then((data: Source[]) => {
        const filtered = data.filter(
          source =>
            source.group === 'Australia' &&
            source.subgroup.includes('FTA') &&
            !source.subgroup.includes('Streaming') &&
            !source.subgroup.includes('by Network'),
        );

        setAllSources(filtered);
        setFilteredSources(filtered);

        const grouped = filtered.reduce((accumulator, source) => {
          if (!accumulator[source.subgroup]) {
            accumulator[source.subgroup] = [];
          }
          accumulator[source.subgroup].push(source);
          return accumulator;
        }, {} as GroupedSources);

        // Sort sources alphabetically within each subgroup
        Object.keys(grouped).forEach(subgroup => {
          grouped[subgroup].sort((a, b) =>
            a.location.localeCompare(b.location),
          );
        });

        setGroupedSources(grouped);

        // Set all groups to open by default
        const initialOpenGroups = Object.keys(grouped).reduce(
          (acc, key) => {
            acc[key] = true;
            return acc;
          },
          {} as { [key: string]: boolean },
        );

        if (sourceId) {
          setSelectedSource(sourceId);
          const sourceSubgroup = filtered.find(
            s => s.id === sourceId,
          )?.subgroup;
          if (sourceSubgroup) {
            setOpenGroups(previous => ({
              ...initialOpenGroups,
              [sourceSubgroup]: true,
            }));
          } else {
            setOpenGroups(initialOpenGroups);
          }
        } else if (filtered.length > 0) {
          setSelectedSource(filtered[0].id);
          setOpenGroups(initialOpenGroups);
          router.push(`?source=${filtered[0].id}`);
        }
      })
      .catch(error_ => {
        setError('Error fetching sources: ' + error_.message);
        setLoading(false);
      });
  }, [sourceId, router]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allSources.filter(
        source =>
          source.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          source.subgroup.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredSources(filtered);
    } else {
      setFilteredSources(allSources);
    }
  }, [searchTerm, allSources]);

  useEffect(() => {
    if (selectedSource) {
      setLoading(true);
      fetch(`/api/py/channels/${selectedSource}`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch channel data');
          return response.json();
        })
        .then((data: APIResponse) => {
          const uniqueChannels = data.data.channels.reduce(
            (accumulator, channel) => {
              if (channel.channel_id === 'NOEPG') {
                accumulator.push({
                  ...channel,
                  channel_numbers: [channel.channel_number],
                  isGrouped: false,
                });
              } else {
                const existingChannel = accumulator.find(
                  c =>
                    c.channel_id === channel.channel_id &&
                    c.other_data.channel_specs ===
                      channel.other_data.channel_specs,
                );
                if (existingChannel) {
                  existingChannel.channel_numbers.push(channel.channel_number);
                  existingChannel.isGrouped = true;
                } else {
                  accumulator.push({
                    ...channel,
                    channel_numbers: [channel.channel_number],
                    isGrouped: false,
                  });
                }
              }
              return accumulator;
            },
            [] as UniqueChannel[],
          );

          uniqueChannels.sort((a, b) => {
            const aNumber = Number.parseInt(a.channel_numbers[0]);
            const bNumber = Number.parseInt(b.channel_numbers[0]);
            if (aNumber !== bNumber) return aNumber - bNumber;
            return a.channel_names.clean.localeCompare(b.channel_names.clean);
          });

          setChannels(uniqueChannels);
          setLoading(false);
        })
        .catch(error_ => {
          setError('Error fetching channels: ' + error_.message);
          setLoading(false);
        });
    }
  }, [selectedSource]);

  const channelGroups = channels.reduce(
    (groups, channel) => {
      const group = channel.channel_group;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(channel);
      return groups;
    },
    {} as Record<string, UniqueChannel[]>,
  );

  const sortedNetworks = Object.keys(channelGroups).sort((a, b) =>
    a === 'Ungrouped' ? 1 : b === 'Ungrouped' ? -1 : a.localeCompare(b),
  );

  const toggleGroup = (group: string) => {
    setOpenGroups(previous => ({ ...previous, [group]: !previous[group] }));
  };

  const selectSource = (source: Source) => {
    setSelectedSource(source.id);
    router.push(`?source=${source.id}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Create a filtered and grouped version of sources based on search
  const filteredGroupedSources = filteredSources.reduce((acc, source) => {
    if (!acc[source.subgroup]) {
      acc[source.subgroup] = [];
    }
    acc[source.subgroup].push(source);
    return acc;
  }, {} as GroupedSources);

  if (error) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-lg text-destructive">Error: {error}</p>
      </div>
    );
  }

  const selectedSourceDetails = allSources.find(
    source => source.id === selectedSource,
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="w-full border-b bg-background p-4">
        <h1 className="text-xl font-bold">
          Freeview Services
          {selectedSourceDetails && (
            <>
              : {selectedSourceDetails.subgroup.replace('FTA - ', '')} -{' '}
              {selectedSourceDetails.location}
            </>
          )}
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with filters - fixed */}
        <div className="flex w-64 shrink-0 flex-col overflow-hidden border-r bg-background">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 text-sm"
                aria-label="Search locations"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="thin-scrollbar h-full">
              {Object.entries(filteredGroupedSources).map(
                ([subgroup, sources]) => (
                  <FilterSection
                    key={subgroup}
                    title={subgroup.replace('FTA - ', '')}
                    isOpen={openGroups[subgroup] ?? true}
                    onToggle={() => toggleGroup(subgroup)}
                    count={sources.length}
                  >
                    {sources.map(source => (
                      <Button
                        key={source.id}
                        variant={
                          selectedSource === source.id ? 'secondary' : 'ghost'
                        }
                        className="mb-1 w-full justify-start px-2 py-1.5 text-sm"
                        onClick={() => selectSource(source)}
                      >
                        <span className="truncate whitespace-normal text-left">
                          {source.location}
                        </span>
                      </Button>
                    ))}
                  </FilterSection>
                ),
              )}
            </ScrollArea>
          </div>

          <div className="border-t p-3">
            <div className="text-center text-xs text-muted-foreground">
              {filteredSources.length} locations available
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-lg">Loading data...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-6 p-6">
                {sortedNetworks.map(networkName => (
                  <Card key={networkName}>
                    <CardHeader className="bg-muted py-3">
                      <CardTitle>{networkName}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap justify-start gap-4">
                        {channelGroups[networkName].map((channel, index) => (
                          <div
                            key={`${channel.channel_id}-${channel.other_data.channel_specs}-${index}`}
                            className="flex min-w-[250px] flex-1 items-center space-x-4 rounded-lg border p-3 shadow-sm"
                          >
                            <div className="flex size-16 shrink-0 items-center justify-center">
                              <img
                                src={
                                  channel.channel_logo.light ||
                                  '/placeholder.svg'
                                }
                                alt={`${channel.isGrouped ? channel.channel_names.clean : channel.channel_names.real} logo`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="ml-3 grow">
                              <p className="text-sm font-bold">
                                {channel.isGrouped
                                  ? channel.channel_names.clean
                                  : channel.channel_names.real}
                              </p>
                              <p className="text-xs font-semibold text-primary">
                                Channel {channel.channel_numbers.join(', ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {channel.other_data.channel_specs}
                              </p>
                              {/* <Badge
                                variant="outline"
                                className="mt-1 font-normal text-xs"
                              >
                                {channel.other_data.channel_type}
                              </Badge> */}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
