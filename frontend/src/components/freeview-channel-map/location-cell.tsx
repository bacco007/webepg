import { TableCell } from "@/components/ui/table";
import type { ChannelData } from "@/types/channel-map";
import { ChannelLogo } from "./channel-logo";

interface LocationCellProps {
  channel: ChannelData | null;
  location: string;
  colspan?: number;
  density: "comfortable" | "compact";
}

export function LocationCell({
  channel,
  location,
  colspan = 1,
  density,
}: LocationCellProps) {
  if (!channel) {
    return (
      <TableCell
        className={`whitespace-normal border text-center ${density === "compact" ? "py-1" : ""}`}
        colSpan={colspan}
        key={`location-${location}`}
      >
        <span className="text-muted-foreground text-xs">Not available</span>
      </TableCell>
    );
  }

  return (
    <TableCell
      className={`whitespace-normal border text-center ${density === "compact" ? "py-1 text-sm" : ""}`}
      colSpan={colspan}
      key={`location-${location}`}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <ChannelLogo logoUrl={channel.channel_logo?.light} size="md" />
        <div className="font-medium text-sm">
          {channel.channel_names.location || channel.channel_name}
        </div>
      </div>
    </TableCell>
  );
}
