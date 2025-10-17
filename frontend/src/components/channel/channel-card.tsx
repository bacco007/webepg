import {
  BadgeCheckIcon,
  BlocksIcon,
  Building2Icon,
  GroupIcon,
  RadioIcon,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Channel } from "./types";
import { getChannelDisplayNameWithAbbreviations } from "./utils";

type ChannelCardProps = {
  channel: Channel;
  xmltvDataSource: string;
};

export function ChannelCard({ channel, xmltvDataSource }: ChannelCardProps) {
  return (
    <Link
      className="h-full focus:outline-hidden focus:ring-2 focus:ring-primary"
      href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
      passHref
    >
      <Card
        className={`flex flex-col gap-2 bg-card p-0 ${
          channel.program_count === 0 ? "bg-muted grayscale" : "bg-card"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between px-4 py-1 pb-0">
          {channel.channel_logo.light !== "N/A" && (
            <div>
              <img
                alt={getChannelDisplayNameWithAbbreviations(channel)}
                className="block h-12 w-24 object-contain dark:hidden"
                src={channel.channel_logo.light || "/placeholder.svg"}
              />
              <img
                alt={getChannelDisplayNameWithAbbreviations(channel)}
                className="hidden h-12 w-24 object-contain dark:block"
                src={channel.channel_logo.dark || "/placeholder.svg"}
              />
            </div>
          )}
          <div className="text-right">
            <CardTitle className="font-bold text-sm">
              {getChannelDisplayNameWithAbbreviations(channel)}
            </CardTitle>
            {channel.channel_number !== "N/A" && (
              <CardDescription>
                Channel {channel.channel_number}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="grow px-4 py-1">
          <div className="flex flex-wrap gap-1 text-xs">
            {channel.channel_group &&
            channel.channel_group !== "N/A" &&
            channel.channel_group.toLowerCase() !== "unknown" ? (
              <Badge className="bg-primary/10 font-semibold text-primary focus-visible:outline-none focus-visible:ring-primary/20 dark:bg-primary/10 dark:text-primary dark:focus-visible:ring-primary/40 [a&]:hover:bg-primary/5 dark:[a&]:hover:bg-primary/5">
                <Building2Icon />
                {channel.channel_group}
              </Badge>
            ) : (
              <Badge className="font-semibold italic" variant="outline">
                No Owner/Operator
              </Badge>
            )}
          </div>
          <ScrollArea className="w-full">
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              {channel.other_data?.channel_specs &&
              channel.other_data.channel_specs !== "N/A" ? (
                <Badge className="text-card-foreground/60" variant="outline">
                  <RadioIcon />
                  {channel.other_data.channel_specs}
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
                <Badge className="text-card-foreground/60" variant="outline">
                  <GroupIcon />
                  {channel.other_data.channel_type}
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
    </Link>
  );
}
