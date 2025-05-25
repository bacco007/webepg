'use client';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  RefreshCw,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Rows,
  RowsIcon,
  Filter,
  Layers,
  Table2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSearch,
  SidebarLayout,
} from '@/components/layouts/sidebar-layout';
import { FilterSection } from '@/components/filter-section';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChannelData {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_number: string;
  channel_group: string;
  channel_logo: {
    light: string;
    dark: string;
  };
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  other_data?: {
    channel_type?: string;
    channel_specs?: string;
  };
  channel_network?: string; // Add this line
}

interface ApiResponse {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: ChannelData[];
  };
}

interface SourceData {
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

interface ZoneConfig {
  name: string;
  states: {
    code: string;
    name: string;
  }[];
  color: string;
}

interface MergedCell {
  startIndex: number;
  endIndex: number;
  channel: ChannelData | null; // Allow null for empty cells
}

interface EmptyStreak {
  startIndex: number;
  endIndex: number;
}

const ZONES: ZoneConfig[] = [
  {
    name: 'South Zone',
    states: [
      { code: 'NSW', name: 'NSW/ACT' },
      { code: 'VIC', name: 'Victoria' },
      { code: 'TAS', name: 'Tasmania' },
      { code: 'SA', name: 'South Australia' },
    ],
    color: 'bg-blue-100 dark:bg-blue-950/30',
  },
  {
    name: 'North Zone',
    states: [
      { code: 'QLD', name: 'Queensland' },
      { code: 'NT', name: 'Northern Territory' },
    ],
    color: 'bg-green-100 dark:bg-green-950/30',
  },
  {
    name: 'West Zone',
    states: [{ code: 'WA', name: 'Western Australia' }],
    color: 'bg-amber-100 dark:bg-amber-950/30',
  },
];

// Flatten all states into a single array for easier indexing
const ALL_STATES = ZONES.flatMap(zone => zone.states);

export default function ChannelMapSourcesPage() {
  const [sources, setSources] = useState<SourceData[]>([]);
  const [channelData, setChannelData] = useState<Record<string, ChannelData[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkGroups, setNetworkGroups] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>(
    [],
  );
  const [selectedChannelSpecs, setSelectedChannelSpecs] = useState<string[]>(
    [],
  );
  const [networkSearch, setNetworkSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [specsSearch, setSpecsSearch] = useState('');
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [collapsedNetworks, setCollapsedNetworks] = useState<
    Record<string, boolean>
  >({});
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [visibleLocations, setVisibleLocations] = useState<string[]>([]);
  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    'comfortable',
  );
  const [expandedChannels, setExpandedChannels] = useState<
    Record<string, boolean>
  >({});
  const [viewMode, setViewMode] = useState<'networks' | 'flat'>('networks');

  const isMobile = useIsMobile();
  const debouncedGlobalSearch = useDebounce(globalFilter, 300);

  // Toggle network collapse state
  const toggleNetworkCollapse = (network: string) => {
    setCollapsedNetworks(prev => ({
      ...prev,
      [network]: !prev[network],
    }));
  };

  // Toggle channel expansion for mobile view
  const toggleChannelExpansion = (channelKey: string) => {
    setExpandedChannels(prev => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  };

  // Toggle collapse all networks
  const toggleAllNetworks = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    Object.keys(filteredChannelMap).forEach(network => {
      newState[network] = collapse;
    });
    setCollapsedNetworks(newState);
  };

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'sidebarCollapsed',
      desktopSidebarCollapsed.toString(),
    );
  }, [desktopSidebarCollapsed]);

  // Fetch sources on initial load
  useEffect(() => {
    fetchSources();
  }, []);

  // Fetch channel data when subgroup changes
  useEffect(() => {
    if (selectedSubgroup) {
      fetchChannelDataForSubgroup(selectedSubgroup);
    }
  }, [selectedSubgroup]);

  // Update visible locations when locations change
  const locationsForSubgroup = useMemo(() => {
    return sources
      .filter(source => source.subgroup === selectedSubgroup)
      .map(source => source.location)
      .sort((a, b) => a.localeCompare(b));
  }, [sources, selectedSubgroup]);

  useEffect(() => {
    setVisibleLocations(locationsForSubgroup);
  }, [locationsForSubgroup]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/py/sources');
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.status}`);
      }

      const allSources: SourceData[] = await response.json();

      // Filter sources based on criteria
      const filteredSources = allSources.filter(
        source =>
          source.group === 'Australia' &&
          source.subgroup.includes('FTA') &&
          !source.subgroup.includes('Streaming') &&
          !source.subgroup.includes('All Regions') &&
          !source.subgroup.includes('by Network') &&
          !source.location.includes('Regional News') &&
          !source.location.includes('ABC/SBS - All States'),
      );

      setSources(filteredSources);

      // Set the first subgroup as selected by default
      const subgroups = getUniqueSubgroups(filteredSources);
      if (subgroups.length > 0) {
        setSelectedSubgroup(subgroups[0]);
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelDataForSubgroup = async (subgroup: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get all sources for this subgroup
      const subgroupSources = sources.filter(
        source => source.subgroup === subgroup,
      );

      // Reset channel data
      setChannelData({});

      // Fetch channel data for each source
      const channelDataMap: Record<string, ChannelData[]> = {};
      const allNetworks = new Set<string>();

      for (const source of subgroupSources) {
        const response = await fetch(`/api/py/channels/${source.id}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch data for ${source.location}: ${response.status}`,
          );
        }

        const data: ApiResponse = await response.json();

        // Use location as the key instead of state code
        channelDataMap[source.location] = data.data.channels;

        // Collect all network groups
        data.data.channels.forEach(channel => {
          if (channel.channel_group) {
            allNetworks.add(channel.channel_group);
          }
        });
      }

      setChannelData(channelDataMap);
      setNetworkGroups(Array.from(allNetworks).sort());
    } catch (err) {
      console.error('Error fetching channel data:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setLoading(false);
    }
  };

  // Get unique subgroups from sources
  const getUniqueSubgroups = (sourceList: SourceData[]): string[] => {
    const subgroups = new Set<string>();
    sourceList.forEach(source => {
      subgroups.add(source.subgroup);
    });
    return Array.from(subgroups).sort();
  };

  // Group channels by network and channel number
  const getChannelMap = () => {
    const channelMap: Record<
      string,
      Record<string, Record<string, ChannelData>>
    > = {};
    const networks: Record<string, Set<string>> = {};

    // First pass: collect all unique channel numbers by network
    Object.entries(channelData).forEach(([location, channels]) => {
      channels.forEach(channel => {
        const network = channel.channel_group || 'Other';
        if (!networks[network]) {
          networks[network] = new Set();
        }

        // Use channel number as the identifier
        if (channel.channel_number) {
          networks[network].add(channel.channel_number);
        }
      });
    });

    // Second pass: organize channels by network, channel number, and location
    Object.entries(networks).forEach(([network, channelNumbers]) => {
      channelMap[network] = {};

      channelNumbers.forEach(channelNumber => {
        channelMap[network][channelNumber] = {};

        // Find this channel number in each location
        Object.entries(channelData).forEach(([location, channels]) => {
          // Find channels with matching number and network
          const matchingChannels = channels.filter(
            c =>
              c.channel_number === channelNumber && c.channel_group === network,
          );

          // If multiple channels match, use the first one
          if (matchingChannels.length > 0) {
            channelMap[network][channelNumber][location] = matchingChannels[0];
          }
        });
      });
    });

    // Sort networks alphabetically
    const sortedChannelMap: Record<
      string,
      Record<string, Record<string, ChannelData>>
    > = {};
    Object.keys(channelMap)
      .sort((a, b) => a.localeCompare(b))
      .forEach(network => {
        sortedChannelMap[network] = channelMap[network];
      });

    return sortedChannelMap;
  };

  // Get a representative channel name for display in the first column
  const getChannelDisplayName = (
    locationChannels: Record<string, ChannelData>,
  ): string => {
    // Get the first available channel
    const firstChannel = Object.values(locationChannels)[0];
    if (!firstChannel) return 'Unknown Channel';

    // Use the clean name as it's usually the most generic
    return firstChannel.channel_names.clean;
  };

  // Function to determine which cells can be merged
  const getMergedCells = (
    locationChannels: Record<string, ChannelData>,
    filteredLocations: string[],
  ): MergedCell[] => {
    const mergedCells: MergedCell[] = [];
    const locationsWithChannels = new Set(Object.keys(locationChannels));

    let currentMergeStart = -1;
    let currentChannelName: string | null = null;

    for (let i = 0; i < filteredLocations.length; i++) {
      const location = filteredLocations[i];
      const hasChannel = locationsWithChannels.has(location);

      if (hasChannel) {
        const channel = locationChannels[location];
        const channelName =
          channel.channel_names.location || channel.channel_name;

        // If we're not in a merge or the channel name is different, start a new merge
        if (currentMergeStart === -1 || channelName !== currentChannelName) {
          // If we were in a merge, end it
          if (currentMergeStart !== -1) {
            mergedCells.push({
              startIndex: currentMergeStart,
              endIndex: i - 1,
              channel: currentChannelName
                ? {
                    channel_names: {
                      location: currentChannelName,
                      clean: currentChannelName,
                      real: currentChannelName,
                    },
                    // Add other required properties with placeholder values
                    channel_id: '',
                    channel_slug: '',
                    channel_name: currentChannelName,
                    channel_number: '',
                    channel_group: '',
                    channel_logo: { light: '', dark: '' },
                  }
                : null,
            });
          }

          // Start a new merge
          currentMergeStart = i;
          currentChannelName = channelName;
        }
        // If the channel name is the same, continue the current merge
      } else {
        // This location doesn't have a channel

        // If we're in a merge, check if we should end it
        if (currentMergeStart !== -1) {
          // End the current merge
          mergedCells.push({
            startIndex: currentMergeStart,
            endIndex: i - 1,
            channel: currentChannelName
              ? {
                  channel_names: {
                    location: currentChannelName,
                    clean: currentChannelName,
                    real: currentChannelName,
                  },
                  // Add other required properties with placeholder values
                  channel_id: '',
                  channel_slug: '',
                  channel_name: currentChannelName,
                  channel_number: '',
                  channel_group: '',
                  channel_logo: { light: '', dark: '' },
                }
              : null,
          });

          // Start a new "Not available" merge
          currentMergeStart = i;
          currentChannelName = null;
        } else if (currentMergeStart === -1) {
          // Start a new "Not available" merge
          currentMergeStart = i;
          currentChannelName = null;
        }
      }
    }

    // Add the last merge if there is one
    if (currentMergeStart !== -1) {
      mergedCells.push({
        startIndex: currentMergeStart,
        endIndex: filteredLocations.length - 1,
        channel: currentChannelName
          ? {
              channel_names: {
                location: currentChannelName,
                clean: currentChannelName,
                real: currentChannelName,
              },
              // Add other required properties with placeholder values
              channel_id: '',
              channel_slug: '',
              channel_name: currentChannelName,
              channel_number: '',
              channel_group: '',
              channel_logo: { light: '', dark: '' },
            }
          : null,
      });
    }

    return mergedCells;
  };

  // Render a row with merged cells
  const renderChannelRow = (
    network: string,
    channelNumber: string,
    locationChannels: Record<string, ChannelData>,
  ) => {
    const filteredLocations = locationsForSubgroup.filter(loc =>
      visibleLocations.includes(loc),
    );
    const mergedCells = getMergedCells(locationChannels, filteredLocations);

    return (
      <TableRow
        key={`${network}-${channelNumber}`}
        className="hover:bg-muted/50"
      >
        <TableCell
          className={`bg-background sticky left-0 z-10 w-[100px] min-w-[100px] border font-medium shadow-sm ${
            density === 'compact' ? 'py-1' : ''
          }`}
        >
          <div className="flex justify-center items-center">
            <div className="text-center">
              <div className="font-medium">Ch {channelNumber}</div>
            </div>
          </div>
        </TableCell>

        {/* Render each location column */}
        {filteredLocations.map((location, locationIndex) => {
          // Find the merged cell that contains this location index
          const mergedCell = mergedCells.find(
            cell =>
              locationIndex >= cell.startIndex &&
              locationIndex <= cell.endIndex,
          );

          // If we found a merged cell and this is the first location in the merged range,
          // render it with the appropriate colspan
          if (mergedCell && locationIndex === mergedCell.startIndex) {
            const colspan = mergedCell.endIndex - mergedCell.startIndex + 1;

            if (mergedCell.channel) {
              // This is a channel cell - find the actual channel data for logo
              const actualChannel =
                locationChannels[filteredLocations[locationIndex]];
              const logoUrl = actualChannel?.channel_logo?.light || '';

              // This is a channel cell
              return (
                <TableCell
                  key={`location-${location}`}
                  colSpan={colspan}
                  className={`border text-center whitespace-normal ${density === 'compact' ? 'py-1 text-sm' : ''}`}
                >
                  <div className="flex flex-col justify-center items-center gap-1">
                    {logoUrl && (
                      <div className="flex justify-center items-center bg-muted/50 rounded-md size-10">
                        <img
                          src={logoUrl || '/placeholder.svg'}
                          alt=""
                          className="p-1 max-w-full max-h-full object-contain"
                          loading="lazy"
                          onError={e => {
                            e.currentTarget.src =
                              '/placeholder.svg?height=32&width=32';
                          }}
                        />
                      </div>
                    )}
                    <div className="font-medium text-sm">
                      {mergedCell.channel.channel_names.location ||
                        mergedCell.channel.channel_name}
                    </div>
                  </div>
                </TableCell>
              );
            } else {
              // This is a "Not available" cell
              return (
                <TableCell
                  key={`location-${location}`}
                  colSpan={colspan}
                  className={`border text-center whitespace-normal ${density === 'compact' ? 'py-1' : ''}`}
                >
                  <span className="text-muted-foreground text-xs">
                    Not available
                  </span>
                </TableCell>
              );
            }
          } else if (!mergedCell || locationIndex !== mergedCell.startIndex) {
            // Skip this cell as it's part of a colspan
            return null;
          }

          // Fallback - should not reach here
          return (
            <TableCell
              key={`location-${location}`}
              className="border text-center"
            >
              <span className="text-muted-foreground text-xs">Error</span>
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  // Render a channel card for mobile view
  const renderChannelCard = (
    network: string,
    channelNumber: string,
    locationChannels: Record<string, ChannelData>,
  ) => {
    const channelKey = `${network}-${channelNumber}`;
    const isExpanded = expandedChannels[channelKey] || false;

    return (
      <Card key={channelKey} className="mb-3">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center gap-2">
            {/* Show channel logo if available */}
            {Object.values(locationChannels)[0]?.channel_logo?.light && (
              <div className="flex justify-center items-center bg-muted/50 rounded-md size-10">
                <img
                  src={
                    Object.values(locationChannels)[0].channel_logo.light ||
                    '/placeholder.svg'
                  }
                  alt=""
                  className="p-1 max-w-full max-h-full object-contain"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src = '/placeholder.svg?height=40&width=40';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <div className="font-medium">
                {getChannelDisplayName(locationChannels)}
              </div>
              <div className="text-muted-foreground text-xs">
                Ch {channelNumber} • {network}
              </div>
            </div>
          </div>
        </CardHeader>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleChannelExpansion(channelKey)}
          className="justify-between w-full"
        >
          <span>View Locations</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
        {isExpanded && (
          <CardContent className="p-0">
            <div className="divide-y">
              {locationsForSubgroup
                .filter(loc => visibleLocations.includes(loc))
                .map(location => {
                  const channel = locationChannels[location];
                  return (
                    <div key={location} className="px-3 py-2">
                      <div className="font-medium text-sm">{location}</div>
                      {channel ? (
                        <div className="font-light text-sm">
                          {channel.channel_names.location ||
                            channel.channel_name}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-xs">
                          Not available
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // Get all unique channel types and specs
  const channelTypes = useMemo(() => {
    const types = new Set<string>();
    Object.values(channelData).forEach(channels => {
      channels.forEach(channel => {
        if (channel.other_data?.channel_type) {
          types.add(channel.other_data.channel_type);
        }
      });
    });
    return Array.from(types).sort();
  }, [channelData]);

  const channelSpecs = useMemo(() => {
    const specs = new Set<string>();
    Object.values(channelData).forEach(channels => {
      channels.forEach(channel => {
        if (channel.other_data?.channel_specs) {
          specs.add(channel.other_data.channel_specs);
        }
      });
    });
    return Array.from(specs).sort();
  }, [channelData]);

  // Apply filters to the channel map
  const filteredChannelMap = useMemo(() => {
    const channelMap = getChannelMap();

    if (
      !debouncedGlobalSearch &&
      selectedNetworks.length === 0 &&
      selectedChannelTypes.length === 0 &&
      selectedChannelSpecs.length === 0
    ) {
      return channelMap;
    }

    const filteredMap: Record<
      string,
      Record<string, Record<string, ChannelData>>
    > = {};

    Object.entries(channelMap).forEach(([network, channels]) => {
      // Filter by network
      if (selectedNetworks.length > 0 && !selectedNetworks.includes(network)) {
        return;
      }

      // Add network to filtered map
      filteredMap[network] = {};

      Object.entries(channels).forEach(([channelNumber, locationChannels]) => {
        // Check if any location's channel matches the filters
        const anyLocationMatches = Object.values(locationChannels).some(
          channel => {
            // Filter by channel type
            if (
              selectedChannelTypes.length > 0 &&
              (!channel.other_data?.channel_type ||
                !selectedChannelTypes.includes(channel.other_data.channel_type))
            ) {
              return false;
            }

            // Filter by channel specs
            if (
              selectedChannelSpecs.length > 0 &&
              (!channel.other_data?.channel_specs ||
                !selectedChannelSpecs.includes(
                  channel.other_data.channel_specs,
                ))
            ) {
              return false;
            }

            // Filter by search term
            if (debouncedGlobalSearch) {
              const searchTerm = debouncedGlobalSearch.toLowerCase();
              return (
                channel.channel_name.toLowerCase().includes(searchTerm) ||
                channel.channel_names.real.toLowerCase().includes(searchTerm) ||
                channel.channel_number.toLowerCase().includes(searchTerm) ||
                channel.channel_group.toLowerCase().includes(searchTerm) ||
                (channel.other_data?.channel_type || '')
                  .toLowerCase()
                  .includes(searchTerm) ||
                (channel.other_data?.channel_specs || '')
                  .toLowerCase()
                  .includes(searchTerm)
              );
            }

            return true;
          },
        );

        if (anyLocationMatches) {
          filteredMap[network][channelNumber] = locationChannels;
        }
      });

      // Remove empty networks
      if (Object.keys(filteredMap[network]).length === 0) {
        delete filteredMap[network];
      }
    });

    return filteredMap;
  }, [
    channelData,
    debouncedGlobalSearch,
    selectedNetworks,
    selectedChannelTypes,
    selectedChannelSpecs,
  ]);

  // Calculate counts for filter options
  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const channelMap = getChannelMap();

    Object.entries(channelMap).forEach(([network, channels]) => {
      counts[network] = Object.keys(channels).length;
    });

    return counts;
  }, [channelData]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    channelTypes.forEach(type => {
      // Count channels that match this type
      let count = 0;

      Object.values(channelData).forEach(channels => {
        channels.forEach(channel => {
          if (channel.other_data?.channel_type === type) {
            count++;
          }
        });
      });

      counts[type] = count;
    });

    return counts;
  }, [channelData, channelTypes]);

  const specsCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    channelSpecs.forEach(spec => {
      // Count channels that match this spec
      let count = 0;

      Object.values(channelData).forEach(channels => {
        channels.forEach(channel => {
          if (channel.other_data?.channel_specs === spec) {
            count++;
          }
        });
      });

      counts[spec] = count;
    });

    return counts;
  }, [channelData, channelSpecs]);

  // Clear all filters
  const clearFilters = () => {
    setGlobalFilter('');
    setSelectedNetworks([]);
    setSelectedChannelTypes([]);
    setSelectedChannelSpecs([]);
    setNetworkSearch('');
    setTypeSearch('');
    setSpecsSearch('');
  };

  // Count total channels and filtered channels
  const totalChannels = useMemo(() => {
    let count = 0;
    Object.values(getChannelMap()).forEach(network => {
      count += Object.keys(network).length;
    });
    return count;
  }, [channelData]);

  const filteredChannels = useMemo(() => {
    let count = 0;
    Object.values(filteredChannelMap).forEach(network => {
      count += Object.keys(network).length;
    });
    return count;
  }, [filteredChannelMap]);

  // Get unique subgroups for the select dropdown
  const subgroups = useMemo(() => {
    return getUniqueSubgroups(sources);
  }, [sources]);

  // Toggle all locations
  const toggleAllLocations = (checked: boolean) => {
    if (checked) {
      setVisibleLocations([...locationsForSubgroup]);
    } else {
      setVisibleLocations([]);
    }
  };

  // Location selector component
  const LocationSelector = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="w-4 h-4" />
            <span>Locations</span>
            {visibleLocations.length !== locationsForSubgroup.length && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {visibleLocations.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Locations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto">
            <DropdownMenuCheckboxItem
              checked={visibleLocations.length === locationsForSubgroup.length}
              onCheckedChange={toggleAllLocations}
            >
              All Locations
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {locationsForSubgroup.map(location => (
              <DropdownMenuCheckboxItem
                key={location}
                checked={visibleLocations.includes(location)}
                onCheckedChange={checked => {
                  setVisibleLocations(
                    checked
                      ? [...visibleLocations, location]
                      : visibleLocations.filter(l => l !== location),
                  );
                }}
              >
                {location}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Density toggle component
  const DensityToggle = () => {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={density}
            onValueChange={value =>
              value && setDensity(value as 'comfortable' | 'compact')
            }
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="comfortable"
                  aria-label="Comfortable view"
                >
                  <RowsIcon className="w-4 h-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Comfortable view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="compact" aria-label="Compact view">
                  <Rows className="w-4 h-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Compact view</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </TooltipProvider>

        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={value =>
              value && setViewMode(value as 'networks' | 'flat')
            }
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="networks"
                  aria-label="Group by networks"
                >
                  <Layers className="w-4 h-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Group by networks</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="flat" aria-label="Single table">
                  <Table2 className="w-4 h-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Single table</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </TooltipProvider>
      </div>
    );
  };

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <div className="space-y-2">
          <Select value={selectedSubgroup} onValueChange={setSelectedSubgroup}>
            <SelectTrigger>
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {subgroups.map(subgroup => (
                <SelectItem key={subgroup} value={subgroup}>
                  {subgroup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SidebarSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder="Search channels..."
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          title="Network"
          options={networkGroups}
          filters={selectedNetworks}
          onFilterChange={value => {
            setSelectedNetworks(prev =>
              prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value],
            );
          }}
          searchValue={networkSearch}
          onSearchChange={setNetworkSearch}
          counts={networkCounts}
          showSearch={networkGroups.length > 10}
        />
        <FilterSection
          title="Channel Type"
          options={channelTypes}
          filters={selectedChannelTypes}
          onFilterChange={value => {
            setSelectedChannelTypes(prev =>
              prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value],
            );
          }}
          searchValue={typeSearch}
          onSearchChange={setTypeSearch}
          counts={typeCounts}
          showSearch={channelTypes.length > 10}
        />
        <FilterSection
          title="Channel Specs"
          options={channelSpecs}
          filters={selectedChannelSpecs}
          onFilterChange={value => {
            setSelectedChannelSpecs(prev =>
              prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value],
            );
          }}
          searchValue={specsSearch}
          onSearchChange={setSpecsSearch}
          counts={specsCounts}
          showSearch={channelSpecs.length > 10}
        />
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-xs"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-muted-foreground text-xs text-center">
          Showing {filteredChannels} of {totalChannels} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={fetchSources}
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>

      {!isMobile && (
        <>
          <LocationSelector />
          <DensityToggle />
        </>
      )}

      {!isMobile && (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllNetworks(true)}
            disabled={loading || Object.keys(filteredChannelMap).length === 0}
          >
            Collapse All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllNetworks(false)}
            disabled={loading || Object.keys(filteredChannelMap).length === 0}
          >
            Expand All
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile view controls
  const MobileControls = () => {
    if (!isMobile) return null;

    return (
      <div className="flex justify-between items-center gap-2 mb-4">
        <LocationSelector />
        <DensityToggle />
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-destructive text-xl">Error</h2>
          <p>{error}</p>
          <Button onClick={fetchSources} className="mt-4">
            <RotateCw className="mr-2 w-4 h-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarLayout
      sidebar={sidebar}
      title="Channel Map by Region"
      actions={headerActions}
    >
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          <span className="ml-2 text-lg">Loading channel data...</span>
        </div>
      ) : (
        <div className="p-4 h-full overflow-auto">
          {selectedSubgroup && (
            <div className="bg-muted/20 mb-4 p-4 rounded-md">
              <h2 className="font-medium text-lg">{selectedSubgroup}</h2>
              <p className="text-muted-foreground text-sm">
                Showing channels across {visibleLocations.length} of{' '}
                {locationsForSubgroup.length} locations
              </p>

              <MobileControls />

              {visibleLocations.length === 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 mt-2 p-2 rounded text-yellow-800 dark:text-yellow-200 text-sm">
                  Please select at least one location to display channels.
                </div>
              )}
            </div>
          )}
          {visibleLocations.length > 0 &&
            (isMobile ? (
              // Mobile card view
              <div className="space-y-4">
                {viewMode === 'networks'
                  ? // Networks view - grouped by network
                    Object.entries(filteredChannelMap).map(
                      ([network, channels]) => {
                        const sortedChannels = Object.entries(channels).sort(
                          ([numA, _], [numB, __]) => {
                            return (
                              Number.parseInt(numA) - Number.parseInt(numB)
                            );
                          },
                        );

                        const isCollapsed = collapsedNetworks[network];

                        return (
                          <div key={network} className="mb-6">
                            <div
                              className="flex justify-between items-center bg-muted/50 mb-3 p-3 rounded-md cursor-pointer"
                              onClick={() => toggleNetworkCollapse(network)}
                            >
                              <h3 className="font-bold">{network}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {Object.keys(channels).length}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-0 w-6 h-6"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronUp className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="space-y-2">
                                {sortedChannels.map(
                                  ([channelNumber, locationChannels]) =>
                                    renderChannelCard(
                                      network,
                                      channelNumber,
                                      locationChannels,
                                    ),
                                )}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )
                  : // Flat view - all channels in a single list
                    (() => {
                      // Flatten all channels from all networks into a single array
                      const allChannels = Object.entries(
                        filteredChannelMap,
                      ).flatMap(([network, channels]) => {
                        return Object.entries(channels).map(
                          ([channelNumber, locationChannels]) => ({
                            network,
                            channelNumber,
                            locationChannels,
                          }),
                        );
                      });

                      // Group channels by channel number only
                      const channelsByNumber: Record<
                        string,
                        Array<{
                          network: string;
                          channelNumber: string;
                          locationChannels: Record<string, ChannelData>;
                        }>
                      > = {};

                      allChannels.forEach(channel => {
                        if (!channelsByNumber[channel.channelNumber]) {
                          channelsByNumber[channel.channelNumber] = [];
                        }
                        channelsByNumber[channel.channelNumber].push(channel);
                      });

                      // Sort channel numbers numerically
                      const sortedChannelNumbers = Object.keys(
                        channelsByNumber,
                      ).sort((a, b) => {
                        const numA = Number.parseInt(a) || 0;
                        const numB = Number.parseInt(b) || 0;
                        return numA - numB;
                      });

                      // Render each channel number group
                      return (
                        <div className="space-y-2">
                          {sortedChannelNumbers.map(channelNumber => {
                            const channelsWithSameNumber =
                              channelsByNumber[channelNumber];
                            const channelKey = `channel-${channelNumber}`;
                            const isExpanded =
                              expandedChannels[channelKey] || false;

                            // Get a representative channel for display in the header
                            // Prefer the first channel from the first network
                            const firstChannelInfo = channelsWithSameNumber[0];
                            const firstChannel = Object.values(
                              firstChannelInfo.locationChannels,
                            )[0];

                            // Create a merged view of all channels with this number
                            const mergedLocationChannels: Record<
                              string,
                              ChannelData
                            > = {};

                            // For each location, find any channel with this number
                            locationsForSubgroup
                              .filter(loc => visibleLocations.includes(loc))
                              .forEach(location => {
                                // Check all networks for this channel number in this location
                                for (const {
                                  network,
                                  locationChannels,
                                } of channelsWithSameNumber) {
                                  if (locationChannels[location]) {
                                    // If we find a channel, add it to our merged view
                                    mergedLocationChannels[location] =
                                      locationChannels[location];
                                    // Add network info to the channel for display
                                    mergedLocationChannels[
                                      location
                                    ].channel_network = network;
                                    break;
                                  }
                                }
                              });

                            // Get all networks that have this channel number
                            const networks = [
                              ...new Set(
                                channelsWithSameNumber.map(c => c.network),
                              ),
                            ].sort();

                            return (
                              <Card key={channelKey} className="mb-3">
                                <CardHeader className="p-3 pb-2">
                                  <div className="flex items-center gap-2">
                                    {/* Show channel logo if available */}
                                    {firstChannel?.channel_logo?.light && (
                                      <div className="flex justify-center items-center bg-muted/50 rounded-md size-10">
                                        <img
                                          src={
                                            firstChannel.channel_logo.light ||
                                            '/placeholder.svg'
                                          }
                                          alt=""
                                          className="p-1 max-w-full max-h-full object-contain"
                                          loading="lazy"
                                          onError={e => {
                                            e.currentTarget.src =
                                              '/placeholder.svg?height=40&width=40';
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {firstChannel?.channel_names.clean ||
                                          `Channel ${channelNumber}`}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        Ch {channelNumber}
                                        {networks.length > 0 &&
                                          ` • ${networks.join(', ')}`}
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleChannelExpansion(channelKey)
                                  }
                                  className="justify-between w-full"
                                >
                                  <span>View Locations</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                                {isExpanded && (
                                  <CardContent className="p-0">
                                    <div className="divide-y">
                                      {locationsForSubgroup
                                        .filter(loc =>
                                          visibleLocations.includes(loc),
                                        )
                                        .map(location => {
                                          const channel =
                                            mergedLocationChannels[location];
                                          return (
                                            <div
                                              key={location}
                                              className="px-3 py-2"
                                            >
                                              <div className="font-medium text-sm">
                                                {location}
                                              </div>
                                              {channel ? (
                                                <div className="font-light text-sm">
                                                  {channel.channel_names
                                                    .location ||
                                                    channel.channel_name}
                                                  {channel.channel_network && (
                                                    <span className="ml-1 text-muted-foreground text-xs">
                                                      ({channel.channel_network}
                                                      )
                                                    </span>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="text-muted-foreground text-xs">
                                                  Not available
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })()}

                {Object.keys(filteredChannelMap).length === 0 && (
                  <div className="bg-muted/20 p-8 rounded-md text-center">
                    {selectedSubgroup ? (
                      <>No results found. Try adjusting your filters.</>
                    ) : (
                      <>Please select a region to view channels.</>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Desktop table view
              <div className="w-full overflow-x-auto">
                <Table className="w-full table-fixed">
                  <TableBody>
                    {viewMode === 'networks' ? (
                      // Networks view - grouped by network
                      Object.entries(filteredChannelMap).map(
                        ([network, channels]) => {
                          const sortedChannels = Object.entries(channels).sort(
                            ([numA, _], [numB, __]) => {
                              // Sort by channel number numerically
                              return (
                                Number.parseInt(numA) - Number.parseInt(numB)
                              );
                            },
                          );

                          const isCollapsed = collapsedNetworks[network];

                          return (
                            <React.Fragment key={network}>
                              <TableRow
                                className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                                onClick={() => toggleNetworkCollapse(network)}
                              >
                                <TableCell
                                  colSpan={1 + visibleLocations.length}
                                  className="left-0 z-10 sticky bg-muted/50 border font-bold"
                                >
                                  <div className="flex justify-between items-center">
                                    <span>{network}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {Object.keys(channels).length}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-0 w-6 h-6"
                                      >
                                        {isCollapsed ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronUp className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {!isCollapsed && (
                                <>
                                  <TableRow>
                                    <TableHead
                                      className={`bg-muted sticky left-0 z-10 w-[100px] min-w-[100px] border ${
                                        density === 'compact' ? 'py-1' : ''
                                      }`}
                                    >
                                      Channel
                                    </TableHead>
                                    {visibleLocations.map(location => (
                                      <TableHead
                                        key={location}
                                        className={`w-auto border text-center whitespace-normal ${
                                          density === 'compact'
                                            ? 'py-1 text-xs'
                                            : ''
                                        }`}
                                      >
                                        {location}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                  {sortedChannels.map(
                                    ([channelNumber, locationChannels]) =>
                                      renderChannelRow(
                                        network,
                                        channelNumber,
                                        locationChannels,
                                      ),
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          );
                        },
                      )
                    ) : (
                      // Flat view - all channels in a single table
                      <>
                        <TableRow>
                          <TableHead
                            className={`bg-muted sticky left-0 z-10 w-[100px] min-w-[100px] border ${
                              density === 'compact' ? 'py-1' : ''
                            }`}
                          >
                            Channel
                          </TableHead>
                          {visibleLocations.map(location => (
                            <TableHead
                              key={location}
                              className={`w-auto border text-center whitespace-normal ${
                                density === 'compact' ? 'py-1 text-xs' : ''
                              }`}
                            >
                              {location}
                            </TableHead>
                          ))}
                        </TableRow>
                        {(() => {
                          // Define filteredLocations here for the flat view
                          const filteredLocations = locationsForSubgroup.filter(
                            loc => visibleLocations.includes(loc),
                          );

                          // Flatten all channels from all networks into a single array
                          const allChannels = Object.entries(
                            filteredChannelMap,
                          ).flatMap(([network, channels]) => {
                            return Object.entries(channels).map(
                              ([channelNumber, locationChannels]) => ({
                                network,
                                channelNumber,
                                locationChannels,
                              }),
                            );
                          });

                          // Group channels by channel number only
                          const channelsByNumber: Record<
                            string,
                            Array<{
                              network: string;
                              channelNumber: string;
                              locationChannels: Record<string, ChannelData>;
                            }>
                          > = {};

                          allChannels.forEach(channel => {
                            if (!channelsByNumber[channel.channelNumber]) {
                              channelsByNumber[channel.channelNumber] = [];
                            }
                            channelsByNumber[channel.channelNumber].push(
                              channel,
                            );
                          });

                          // Sort channel numbers numerically
                          const sortedChannelNumbers = Object.keys(
                            channelsByNumber,
                          ).sort((a, b) => {
                            const numA = Number.parseInt(a) || 0;
                            const numB = Number.parseInt(b) || 0;
                            return numA - numB;
                          });

                          // Render each channel number as a single row
                          return sortedChannelNumbers.map(channelNumber => {
                            const channelsWithSameNumber =
                              channelsByNumber[channelNumber];

                            // Create a merged view of all channels with this number
                            const mergedLocationChannels: Record<
                              string,
                              ChannelData & { networks?: string[] }
                            > = {};

                            // For each location, find all channels with this number
                            filteredLocations.forEach(location => {
                              // Check all networks for this channel number in this location
                              const networksForLocation: string[] = [];
                              let channelForLocation: ChannelData | null = null;

                              for (const {
                                network,
                                locationChannels,
                              } of channelsWithSameNumber) {
                                if (locationChannels[location]) {
                                  // If we find a channel, add its network to our list
                                  networksForLocation.push(network);
                                  // If this is the first channel we've found, use it as our display channel
                                  if (!channelForLocation) {
                                    channelForLocation =
                                      locationChannels[location];
                                  }
                                }
                              }

                              // If we found any channels, add them to our merged view
                              if (channelForLocation) {
                                mergedLocationChannels[location] = {
                                  ...channelForLocation,
                                  networks: networksForLocation,
                                };
                              }
                            });

                            // Render the row with the merged channel data
                            return (
                              <TableRow
                                key={`channel-${channelNumber}`}
                                className="hover:bg-muted/50"
                              >
                                <TableCell
                                  className={`bg-background sticky left-0 z-10 w-[100px] min-w-[100px] border font-medium shadow-sm ${
                                    density === 'compact' ? 'py-1' : ''
                                  }`}
                                >
                                  <div className="flex justify-center items-center">
                                    <div className="text-center">
                                      <div className="font-medium">
                                        Ch {channelNumber}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Render each location column */}
                                {filteredLocations.map(
                                  (location, locationIndex) => {
                                    const channel =
                                      mergedLocationChannels[location];

                                    if (!channel) {
                                      return (
                                        <TableCell
                                          key={`location-${location}`}
                                          className={`border text-center whitespace-normal ${
                                            density === 'compact' ? 'py-1' : ''
                                          }`}
                                        >
                                          <span className="text-muted-foreground text-xs">
                                            Not available
                                          </span>
                                        </TableCell>
                                      );
                                    }

                                    // Get all networks that provide this channel in this location
                                    const networks = channel.networks || [];

                                    // Find consecutive locations with the same channel and networks
                                    let colspan = 1;
                                    let j = locationIndex + 1;
                                    while (j < filteredLocations.length) {
                                      const nextLocation = filteredLocations[j];
                                      const nextChannel =
                                        mergedLocationChannels[nextLocation];

                                      // Check if next location has the same channel with same networks
                                      if (
                                        nextChannel &&
                                        nextChannel.channel_names.location ===
                                          channel.channel_names.location &&
                                        JSON.stringify(nextChannel.networks) ===
                                          JSON.stringify(networks)
                                      ) {
                                        colspan++;
                                        j++;
                                      } else {
                                        break;
                                      }
                                    }

                                    // Skip cells that are part of a colspan
                                    if (locationIndex > 0) {
                                      const prevLocation =
                                        filteredLocations[locationIndex - 1];
                                      const prevChannel =
                                        mergedLocationChannels[prevLocation];

                                      if (
                                        prevChannel &&
                                        prevChannel.channel_names.location ===
                                          channel.channel_names.location &&
                                        JSON.stringify(prevChannel.networks) ===
                                          JSON.stringify(networks)
                                      ) {
                                        return null;
                                      }
                                    }

                                    return (
                                      <TableCell
                                        key={`location-${location}`}
                                        colSpan={colspan}
                                        className={`border text-center whitespace-normal ${
                                          density === 'compact'
                                            ? 'py-1 text-sm'
                                            : ''
                                        }`}
                                      >
                                        <div className="flex flex-col justify-center items-center gap-1">
                                          {channel.channel_logo?.light && (
                                            <div className="flex justify-center items-center bg-muted/50 rounded-md size-10">
                                              <img
                                                src={
                                                  channel.channel_logo.light ||
                                                  '/placeholder.svg'
                                                }
                                                alt=""
                                                className="p-1 max-w-full max-h-full object-contain"
                                                loading="lazy"
                                                onError={e => {
                                                  e.currentTarget.src =
                                                    '/placeholder.svg?height=32&width=32';
                                                }}
                                              />
                                            </div>
                                          )}
                                          <div className="font-medium text-sm">
                                            {channel.channel_names.location ||
                                              channel.channel_name}
                                          </div>
                                          {/* {networks.length > 0 && (
                                            <div className="text-muted-foreground text-xs">
                                              {networks.join(', ')}
                                            </div>
                                          )} */}
                                        </div>
                                      </TableCell>
                                    );
                                  },
                                )}
                              </TableRow>
                            );
                          });
                        })()}
                      </>
                    )}
                    {Object.keys(filteredChannelMap).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={1 + visibleLocations.length}
                          className="h-24 text-center"
                        >
                          {selectedSubgroup ? (
                            <>No results found. Try adjusting your filters.</>
                          ) : (
                            <>Please select a region to view channels.</>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
          <div className="h-24" aria-hidden="true"></div> {/* Spacer element */}
        </div>
      )}
    </SidebarLayout>
  );
}
