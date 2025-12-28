import type { Channel } from "@/lib/nownext-types";

interface ChannelDetailsProps {
  channel: Channel;
}

export function ChannelDetails({ channel }: ChannelDetailsProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{channel.name.real}</h3>
      <p className="text-sm">
        <span className="font-medium">Clean Name:</span> {channel.name.clean}
      </p>
      <p className="text-sm">
        <span className="font-medium">Location:</span> {channel.name.location}
      </p>
      <p className="text-sm">
        <span className="font-medium">LCN:</span> {channel.lcn}
      </p>
      <p className="text-sm">
        <span className="font-medium">Group:</span> {channel.group}
      </p>
    </div>
  );
}
