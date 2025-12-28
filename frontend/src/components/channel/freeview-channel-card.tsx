import { BadgeCheckIcon, BlocksIcon, GroupIcon, RadioIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface FreeviewChannelCardProps {
  channel: {
    channel_id: string;
    channel_slug: string;
    channel_name: string;
    channel_names: {
      clean: string;
      location: string;
      real: string;
    };
    channel_numbers: string[];
    channel_group: string;
    channel_logo: {
      light: string;
      dark: string;
    };
    other_data: {
      channel_type: string;
      channel_specs: string;
    };
    isGrouped: boolean;
  };
  className?: string;
}

export function FreeviewChannelCard({
  channel,
  className,
}: FreeviewChannelCardProps) {
  return (
    <Card className={`flex flex-col gap-2 bg-card p-0 ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-1 pb-0">
        {channel.channel_logo.light !== "N/A" && (
          <div>
            <img
              alt={`${channel.isGrouped ? channel.channel_names.location : channel.channel_names.real} logo`}
              className="block h-12 w-24 object-contain dark:hidden"
              src={channel.channel_logo.light || "/placeholder.svg"}
            />
            <img
              alt={`${channel.isGrouped ? channel.channel_names.location : channel.channel_names.real} logo`}
              className="hidden h-12 w-24 object-contain dark:block"
              src={channel.channel_logo.dark || "/placeholder.svg"}
            />
          </div>
        )}
        <div className="text-right">
          <CardTitle className="font-bold text-sm">
            {channel.isGrouped
              ? channel.channel_names.location
              : channel.channel_names.location}
          </CardTitle>
          {channel.channel_number !== "N/A" && (
            <CardDescription>
              Channel {channel.channel_numbers.join(", ")}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="grow px-4 py-1">
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2 pt-1 text-10px">
            {channel.other_data?.channel_specs &&
            channel.other_data.channel_specs !== "N/A" ? (
              <Badge
                className="px-1.5 py-0.5 text-card-foreground/60 text-xs"
                variant="outline"
              >
                <RadioIcon className="size-3" />
                &nbsp; {channel.other_data.channel_specs}
              </Badge>
            ) : (
              <Badge
                className="text-card-foreground/60 italic"
                variant="outline"
              >
                No Channel Specs
              </Badge>
            )}

            {channel.other_data?.channel_type &&
            channel.other_data.channel_type !== "N/A" &&
            channel.other_data.channel_type !== "(none)" ? (
              <Badge
                className="px-1.5 py-0.5 text-card-foreground/60 text-xs"
                variant="outline"
              >
                <GroupIcon className="size-3" />
                &nbsp; {channel.other_data.channel_type}
              </Badge>
            ) : (
              <Badge
                className="text-card-foreground/60 italic"
                variant="outline"
              >
                No Channel Type
              </Badge>
            )}
            {channel.other_data?.channel_availability &&
              channel.other_data.channel_availability !== "N/A" &&
              channel.other_data.channel_availability !== "(none)" && (
                <Badge className="text-card-foreground/60" variant="outline">
                  <BadgeCheckIcon />
                  {channel.other_data.channel_availability}
                </Badge>
              )}
            {channel.other_data?.channel_packages &&
              channel.other_data.channel_packages !== "N/A" &&
              channel.other_data.channel_packages !== "(none)" && (
                <Badge className="text-card-foreground/60" variant="outline">
                  <BlocksIcon />
                  {channel.other_data.channel_packages}
                </Badge>
              )}
          </div>
          <ScrollBar className="h-1.5" orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
