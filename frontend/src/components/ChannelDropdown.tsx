'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getCookie } from '@/lib/cookies';

interface Channel {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_names: {
    real: string;
    clean: string;
    location: string;
  };
  channel_number: string;
  channel_logo: {
    light: string;
    dark: string;
  };
}

interface ChannelDropdownProps {
  channelSlug: string;
}

// Helper function to sort channels by number
function sortChannelsByNumber<T>(
  channels: T[],
  getNumberFn: (channel: T) => string,
  getNameFn: (channel: T) => string,
): T[] {
  return [...channels].sort((a, b) => {
    // Check if both channel numbers are purely numeric
    const aNumStr = getNumberFn(a) || '';
    const bNumStr = getNumberFn(b) || '';

    const aIsNumeric = /^\d+$/.test(aNumStr);
    const bIsNumeric = /^\d+$/.test(bNumStr);

    // If both are numeric, sort numerically
    if (aIsNumeric && bIsNumeric) {
      return Number.parseInt(aNumStr) - Number.parseInt(bNumStr);
    }

    // If only one is numeric, prioritize numeric values
    if (aIsNumeric) return -1;
    if (bIsNumeric) return 1;

    // If neither is numeric or both are missing, sort by name
    return getNameFn(a).localeCompare(getNameFn(b));
  });
}

export default function ChannelDropdown({ channelSlug }: ChannelDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('');

  // Fetch data source from cookies
  useEffect(() => {
    const fetchDataSource = async () => {
      const source = (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
      setDataSource(source);
    };

    fetchDataSource();
  }, []);

  // Fetch channels
  useEffect(() => {
    if (!dataSource) return;

    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/py/channels/${dataSource}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.data && data.data.channels) {
          // Use our sorting function with proper type assertions
          const channelsData = data.data.channels as Channel[];
          const sortedChannels = sortChannelsByNumber<Channel>(
            channelsData,
            channel => channel.channel_number,
            channel => channel.channel_names.real,
          );

          setChannels(sortedChannels);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [dataSource]);

  // Find current channel
  const currentChannel = channels.find(
    channel => channel.channel_slug === channelSlug,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-[200px]"
        >
          {loading ? (
            'Loading channels...'
          ) : currentChannel ? (
            <div className="flex items-center gap-2">
              <img
                src={currentChannel.channel_logo.light || '/placeholder.svg'}
                alt={currentChannel.channel_names.real}
                className="dark:hidden w-4 h-4 object-contain"
              />
              <img
                src={currentChannel.channel_logo.dark || '/placeholder.svg'}
                alt={currentChannel.channel_names.real}
                className="hidden dark:block w-4 h-4 object-contain"
              />
              <span className="truncate">
                {currentChannel.channel_names.real}
              </span>
            </div>
          ) : (
            'Select channel'
          )}
          <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput placeholder="Search channels..." />
          <CommandList>
            <CommandEmpty>No channel found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {channels.map(channel => (
                <CommandItem
                  key={channel.channel_slug}
                  value={channel.channel_slug}
                  onSelect={() => {
                    router.push(
                      `/channel/${channel.channel_slug}?source=${dataSource}`,
                    );
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={channel.channel_logo.light || '/placeholder.svg'}
                      alt={channel.channel_names.real}
                      className="dark:hidden w-4 h-4 object-contain"
                    />
                    <img
                      src={channel.channel_logo.dark || '/placeholder.svg'}
                      alt={channel.channel_names.real}
                      className="hidden dark:block w-4 h-4 object-contain"
                    />
                    <span className="truncate">
                      {channel.channel_names.real}
                      {channel.channel_number && ` (${channel.channel_number})`}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      channel.channel_slug === channelSlug
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
