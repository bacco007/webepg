'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type React from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
} from '@/components/layouts/sidebar-layout';

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
        className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{count}</span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="space-y-1 pr-1 max-h-[300px] overflow-y-auto thin-scrollbar">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FreeviewAuPage() {
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
            !source.subgroup.includes('All Regions') &&
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

        // Initialize all groups as closed
        const initialOpenGroups = Object.keys(grouped).reduce(
          (acc, key) => {
            acc[key] = false;
            return acc;
          },
          {} as { [key: string]: boolean },
        );

        if (sourceId) {
          setSelectedSource(sourceId);
          const selectedSource = filtered.find(s => s.id === sourceId);
          if (selectedSource) {
            // Only open the group containing the selected source
            setOpenGroups({
              ...initialOpenGroups,
              [selectedSource.subgroup]: true,
            });
          } else {
            setOpenGroups(initialOpenGroups);
          }
        } else if (filtered.length > 0) {
          setSelectedSource(filtered[0].id);
          // Only open the group containing the first source
          setOpenGroups({
            ...initialOpenGroups,
            [filtered[0].subgroup]: true,
          });
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
              if (
                channel.channel_id === 'NOEPG' ||
                channel.channel_id.startsWith('R_')
              ) {
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
            return a.channel_names.location.localeCompare(
              b.channel_names.location,
            );
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

    // When selecting a source, only keep its group open
    const updatedGroups = Object.keys(openGroups).reduce(
      (acc, key) => {
        acc[key] = key === source.subgroup;
        return acc;
      },
      {} as { [key: string]: boolean },
    );

    setOpenGroups(updatedGroups);
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
      <div className="flex justify-center items-center size-full">
        <p className="text-destructive text-lg">Error: {error}</p>
      </div>
    );
  }

  const selectedSourceDetails = allSources.find(
    source => source.id === selectedSource,
  );

  // Create the sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <div className="relative">
          <Search className="top-2.5 left-2 absolute size-4 text-muted-foreground" />
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
              className="top-1 right-1 absolute p-0 w-7 h-7"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(filteredGroupedSources).map(([subgroup, sources]) => (
          <FilterSection
            key={subgroup}
            title={subgroup.replace('FTA - ', '')}
            isOpen={openGroups[subgroup] ?? false}
            onToggle={() => toggleGroup(subgroup)}
            count={sources.length}
          >
            {sources.map(source => (
              <Button
                key={source.id}
                variant={selectedSource === source.id ? 'secondary' : 'ghost'}
                className="justify-start mb-1 px-2 py-1.5 w-full text-sm"
                onClick={() => selectSource(source)}
              >
                <span className="text-left truncate whitespace-normal">
                  {source.location}
                </span>
              </Button>
            ))}
          </FilterSection>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground text-xs text-center">
          {filteredSources.length} locations available
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // Create the page title
  const pageTitle = selectedSourceDetails
    ? `Freeview Services: ${selectedSourceDetails.subgroup.replace('FTA - ', '')} - ${selectedSourceDetails.location}`
    : 'Freeview Services';

  return (
    <SidebarLayout
      title={pageTitle}
      sidebar={sidebar}
      contentClassName="p-0 overflow-auto"
    >
      {loading ? (
        <div className="flex flex-1 justify-center items-center">
          <p className="text-lg">Loading data...</p>
        </div>
      ) : (
        <div className="bg-gray-50 h-full overflow-auto">
          {sortedNetworks.map(networkName => (
            <div key={networkName} className="mb-4">
              <div className="bg-gray-100 px-4 py-2">
                <h2 className="font-medium">{networkName}</h2>
              </div>
              <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 p-2">
                {channelGroups[networkName].map((channel, index) => (
                  <div
                    key={`${channel.channel_id}-${channel.other_data.channel_specs}-${index}`}
                    className="flex items-start bg-white p-3 border rounded-sm"
                  >
                    <div className="flex justify-center items-center mr-3 size-12 shrink-0">
                      <img
                        src={
                          channel.channel_logo.light ||
                          '/placeholder.svg' ||
                          '/placeholder.svg'
                        }
                        alt={`${channel.isGrouped ? channel.channel_names.location : channel.channel_names.real} logo`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 grow">
                      <div className="font-medium leading-tight">
                        {channel.isGrouped
                          ? channel.channel_names.location
                          : channel.channel_names.location}
                      </div>
                      <div className="text-sm leading-tight">
                        Channel {channel.channel_numbers.join(', ')}
                      </div>
                      <div className="text-gray-600 text-xs leading-tight">
                        {channel.other_data.channel_specs}
                      </div>
                      <div className="text-gray-600 text-xs leading-tight">
                        {channel.other_data.channel_type === 'Radio'
                          ? 'Radio'
                          : 'Free-to-Air'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
