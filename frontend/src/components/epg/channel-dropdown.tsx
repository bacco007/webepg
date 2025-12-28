"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

// Regex for checking if a string contains only digits
const NUMERIC_REGEX = /^\d+$/;

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

export function ChannelDropdown({ channelSlug }: ChannelDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>("");

  // Fetch data source from cookies
  useEffect(() => {
    const fetchDataSource = async () => {
      const source = (await getCookie("xmltvdatasource")) || "xmlepg_FTASYD";
      setDataSource(source);
    };

    fetchDataSource();
  }, []);

  // Fetch channels
  useEffect(() => {
    if (!dataSource) {
      return;
    }

    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/py/channels/${dataSource}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data?.data?.channels) {
          // Sort all channels without deduplication
          const sortedChannels = [...data.data.channels].sort((a, b) => {
            // Check if both channel numbers are purely numeric
            const aNumStr = a.channel_number || "";
            const bNumStr = b.channel_number || "";

            const aIsNumeric = NUMERIC_REGEX.test(aNumStr);
            const bIsNumeric = NUMERIC_REGEX.test(bNumStr);

            // If both are numeric, sort numerically
            if (aIsNumeric && bIsNumeric) {
              return (
                Number.parseInt(aNumStr, 10) - Number.parseInt(bNumStr, 10)
              );
            }

            // If only one is numeric, prioritize numeric values
            if (aIsNumeric) {
              return -1;
            }
            if (bIsNumeric) {
              return 1;
            }

            // If neither is numeric or both are missing, sort by name
            return a.channel_names.real.localeCompare(b.channel_names.real);
          });

          setChannels(sortedChannels);
        }
      } catch (_error) {
        //
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [dataSource]);

  // Find current channel - match by slug and also consider channel number if available
  const currentChannel = channels.find((channel) => {
    // First try to match by slug exactly
    if (channel.channel_slug === channelSlug) {
      return true;
    }
    return false;
  });

  // Determine button content
  const getButtonContent = () => {
    if (loading) {
      return "Loading channels...";
    }

    if (currentChannel) {
      return (
        <div className="flex items-center gap-2">
          <img
            alt={currentChannel.channel_names.real}
            className="h-4 w-4 object-contain dark:hidden"
            src={currentChannel.channel_logo.light || "/placeholder.svg"}
          />
          <img
            alt={currentChannel.channel_names.real}
            className="hidden h-4 w-4 object-contain dark:block"
            src={currentChannel.channel_logo.dark || "/placeholder.svg"}
          />
          <span className="truncate">{currentChannel.channel_names.real}</span>
          {currentChannel.channel_number && (
            <span className="text-muted-foreground text-xs">
              ({currentChannel.channel_number})
            </span>
          )}
        </div>
      );
    }

    return "Select channel";
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-[200px] justify-between"
          variant="outline"
        >
          {getButtonContent()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command
          filter={(value, search) => {
            // Custom filter function to match against channel name, number, and slug
            if (!search) {
              return 1;
            }

            const item = value.toLowerCase();
            const searchLower = search.toLowerCase();

            // Check if the item contains the search string
            if (item.includes(searchLower)) {
              return 1;
            }

            // Check for partial matches at word boundaries
            const words = item.split(" ");
            for (const word of words) {
              if (word.startsWith(searchLower)) {
                return 0.8;
              }
            }

            return 0;
          }}
        >
          <CommandInput placeholder="Search channels..." />
          <CommandList>
            <CommandEmpty>No channel found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {channels.map((channel) => {
                // Create a composite key that includes both ID and channel number to ensure uniqueness
                const channelKey = `${channel.channel_id}-${channel.channel_number}`;

                return (
                  <CommandItem
                    key={channelKey}
                    onSelect={() => {
                      // Include channel number in the URL to ensure we navigate to the specific channel instance
                      const queryParams = new URLSearchParams({
                        lcn: channel.channel_number || "",
                        source: dataSource,
                      }).toString();

                      router.push(
                        `/channel/${channel.channel_slug}?${queryParams}`
                      );
                      setOpen(false);
                    }}
                    value={`${channel.channel_names.real} ${channel.channel_names.clean} ${channel.channel_number} ${channel.channel_slug}`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        alt={channel.channel_names.real}
                        className="h-4 w-4 object-contain dark:hidden"
                        src={channel.channel_logo.light || "/placeholder.svg"}
                      />
                      <img
                        alt={channel.channel_names.real}
                        className="hidden h-4 w-4 object-contain dark:block"
                        src={channel.channel_logo.dark || "/placeholder.svg"}
                      />
                      <span className="truncate">
                        {channel.channel_names.real}
                        {channel.channel_number &&
                          ` (${channel.channel_number})`}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        channel.channel_slug === channelSlug &&
                          currentChannel?.channel_number ===
                            channel.channel_number
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
