import { Card } from "@/components/ui/card";

type FreeviewChannelCardProps = {
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
};

export function FreeviewChannelCard({
  channel,
  className,
}: FreeviewChannelCardProps) {
  return (
    <Card
      className={`flex items-start rounded-sm border bg-card p-3 ${className ?? ""}`}
    >
      <div className="mr-3 flex size-12 shrink-0 items-center justify-center">
        <img
          alt={`${channel.isGrouped ? channel.channel_names.location : channel.channel_names.real} logo`}
          className="max-h-full max-w-full object-contain"
          src={channel.channel_logo.light || "/placeholder.svg"}
        />
      </div>
      <div className="min-w-0 grow">
        <div className="font-medium text-sm leading-tight">
          {channel.isGrouped
            ? channel.channel_names.location
            : channel.channel_names.location}
        </div>
        <div className="text-sm leading-tight">
          Channel {channel.channel_numbers.join(", ")}
        </div>
        <div className="text-muted-foreground text-xs leading-tight">
          {channel.other_data.channel_specs}
        </div>
        <div className="text-muted-foreground text-xs leading-tight">
          {channel.other_data.channel_type === "Radio"
            ? "Radio"
            : "Free-to-Air"}
        </div>
      </div>
    </Card>
  );
}
