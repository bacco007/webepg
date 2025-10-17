import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ChannelData } from "@/types/channel-map";
import { ChannelLogo } from "./channel-logo";

type ChannelCardProps = {
  channelNumber: string;
  channelsWithSameNumber: Array<{
    network: string;
    channelNumber: string;
    locationChannels: Record<string, ChannelData>;
  }>;
  expandedChannels: Record<string, boolean>;
  toggleChannelExpansion: (channelKey: string) => void;
  locationsForSubgroup: string[];
  visibleLocations: string[];
  abbreviateStateName: (channelName: string) => string;
};

export function ChannelCard({
  channelNumber,
  channelsWithSameNumber,
  expandedChannels,
  toggleChannelExpansion,
  locationsForSubgroup,
  visibleLocations,
  abbreviateStateName,
}: ChannelCardProps) {
  const channelKey = `channel-${channelNumber}`;
  const isExpanded = expandedChannels[channelKey];

  // Get a representative channel for display in the header
  const firstChannelInfo = channelsWithSameNumber[0];
  const firstChannel = Object.values(firstChannelInfo.locationChannels)[0];

  // Create a merged view of all channels with this number
  const mergedLocationChannels: Record<string, ChannelData> = {};

  // For each location, find any channel with this number
  const filteredLocations = locationsForSubgroup.filter((loc) =>
    visibleLocations.includes(loc)
  );

  for (const location of filteredLocations) {
    // Check all networks for this channel number in this location
    for (const { network, locationChannels } of channelsWithSameNumber) {
      if (locationChannels[location]) {
        // If we find a channel, add it to our merged view
        mergedLocationChannels[location] = locationChannels[location];
        // Add network info to the channel for display
        mergedLocationChannels[location].channel_network = network;
        break;
      }
    }
  }

  // Get all networks that have this channel number
  const networks = [
    ...new Set(channelsWithSameNumber.map((c) => c.network)),
  ].sort();

  // Get the channel name and apply abbreviation
  const channelName =
    firstChannel?.channel_names.clean || `Channel ${channelNumber}`;
  const abbreviatedChannelName = abbreviateStateName(channelName);

  return (
    <Card className="mb-3" key={channelKey}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <ChannelLogo logoUrl={firstChannel?.channel_logo?.light} size="md" />
          <div className="flex-1">
            <div className="font-medium">{abbreviatedChannelName}</div>
            <div className="text-muted-foreground text-xs">
              Ch {channelNumber}
              {networks.length > 0 && ` • ${networks.join(", ")}`}
            </div>
          </div>
        </div>
      </CardHeader>
      <Button
        className="w-full justify-between"
        onClick={() => toggleChannelExpansion(channelKey)}
        size="sm"
        variant="ghost"
      >
        <span>View Locations</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <CardContent className="p-0">
          <div className="divide-y">
            {locationsForSubgroup
              .filter((loc) => visibleLocations.includes(loc))
              .map((location) => {
                const channel = mergedLocationChannels[location];
                return (
                  <div className="px-3 py-2" key={location}>
                    <div className="font-medium text-sm">{location}</div>
                    {channel ? (
                      <div className="font-light text-sm">
                        {abbreviateStateName(
                          channel.channel_names.location || channel.channel_name
                        )}
                        {channel.channel_network && (
                          <span className="ml-1 text-muted-foreground text-xs">
                            ({channel.channel_network})
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
}
