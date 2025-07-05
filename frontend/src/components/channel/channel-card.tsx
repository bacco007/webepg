import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Channel } from "./types";
import { getChannelDisplayNameWithAbbreviations } from "./utils";

interface ChannelCardProps {
  channel: Channel;
  xmltvDataSource: string;
}

export function ChannelCard({ channel, xmltvDataSource }: ChannelCardProps) {
  return (
    <Link
      className="h-full focus:outline-hidden focus:ring-2 focus:ring-primary"
      href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
      passHref
    >
      <Card
        className={`flex h-full flex-col rounded-lg border p-3 shadow-sm transition-shadow duration-300 hover:shadow-lg ${
          channel.program_count === 0 ? "bg-muted grayscale" : "bg-card"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="flex size-16 shrink-0 items-center justify-center">
            <img
              alt={getChannelDisplayNameWithAbbreviations(channel)}
              className="max-h-full max-w-full object-contain"
              height="100"
              src={channel.channel_logo.light || "/placeholder.svg"}
              width="100"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <p className="font-bold text-sm">
              {getChannelDisplayNameWithAbbreviations(channel)}
            </p>
            {typeof channel.channel_number === "string" &&
              channel.channel_number !== "N/A" && (
                <p className="font-semibold text-primary text-xs">
                  Channel {channel.channel_number}
                </p>
              )}
            {channel.channel_group &&
              channel.channel_group !== "N/A" &&
              channel.channel_group.toLowerCase() !== "unknown" && (
                <p className="font-semibold text-primary text-xs">
                  {channel.channel_group}
                </p>
              )}
            {channel.other_data &&
              channel.other_data.channel_specs !== "N/A" &&
              channel.other_data.channel_type !== "N/A" && (
                <p className="text-muted-foreground text-xs">
                  {channel.other_data.channel_specs},{" "}
                  {channel.other_data.channel_type}
                </p>
              )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
