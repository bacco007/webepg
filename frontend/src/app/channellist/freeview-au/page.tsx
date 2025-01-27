'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

export default function Component() {
  const [channels, setChannels] = useState<UniqueChannel[]>([]);
  const [groupedSources, setGroupedSources] = useState<GroupedSources>({});
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

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
        const filteredSources = data.filter(
          source =>
            source.group === 'Australia' &&
            source.subgroup.includes('FTA') &&
            !source.subgroup.includes('Streaming') &&
            !source.subgroup.includes('by Network'),
        );
        const grouped = filteredSources.reduce((accumulator, source) => {
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
        if (sourceId) {
          setSelectedSource(sourceId);
          const sourceSubgroup = filteredSources.find(
            s => s.id === sourceId,
          )?.subgroup;
          if (sourceSubgroup) {
            setOpenGroups(previous => ({
              ...previous,
              [sourceSubgroup]: true,
            }));
          }
        } else if (filteredSources.length > 0) {
          setSelectedSource(filteredSources[0].id);
          setOpenGroups({ [filteredSources[0].subgroup]: true });
          router.push(`?source=${filteredSources[0].id}`);
        }
      })
      .catch(error_ => {
        setError('Error fetching sources: ' + error_.message);
        setLoading(false);
      });
  }, [sourceId, router]);

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
    setOpenGroups(previous => ({ ...previous, [source.subgroup]: true }));
    router.push(`?source=${source.id}`);
  };

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-lg">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-lg text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">
          Freeview Services (by Operator):{' '}
          {selectedSource
            ? groupedSources[
                Object.keys(groupedSources).find(key =>
                  groupedSources[key].some(
                    source => source.id === selectedSource,
                  ),
                ) || ''
              ]
                ?.find(source => source.id === selectedSource)
                ?.subgroup.replace('FTA - ', '')
            : ''}{' '}
          -{' '}
          {selectedSource
            ? groupedSources[
                Object.keys(groupedSources).find(key =>
                  groupedSources[key].some(
                    source => source.id === selectedSource,
                  ),
                ) || ''
              ]?.find(source => source.id === selectedSource)?.location
            : ''}
        </h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="w-64 border-r">
          <div className="space-y-2 p-4">
            {Object.entries(groupedSources).map(([subgroup, sources]) => (
              <Collapsible
                key={subgroup}
                open={openGroups[subgroup]}
                onOpenChange={() => toggleGroup(subgroup)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium hover:bg-muted">
                  {subgroup.replace('FTA - ', '')}
                  {openGroups[subgroup] ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {sources.map(source => (
                    <Button
                      key={source.id}
                      variant={
                        selectedSource === source.id ? 'secondary' : 'ghost'
                      }
                      className="w-full justify-start px-2 py-1 text-xs"
                      onClick={() => selectSource(source)}
                    >
                      <span className="whitespace-normal text-left">
                        {source.location}
                      </span>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
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
                        <div className="relative size-16 shrink-0">
                          <Image
                            src={channel.channel_logo.light}
                            alt={`${channel.isGrouped ? channel.channel_names.clean : channel.channel_names.real} logo`}
                            fill
                            className="object-contain"
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
                          <p className="text-xs text-muted-foreground">
                            {channel.other_data.channel_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
