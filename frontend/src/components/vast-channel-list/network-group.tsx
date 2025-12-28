import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { ChannelRow } from "./channel-row";
import { type ChannelData, ZONES } from "./types";

interface NetworkGroupProps {
  network: string;
  channels: Record<string, Record<string, ChannelData>>;
  isCollapsed: boolean;
  onToggleCollapse: (network: string) => void;
}

export function NetworkGroup({
  network,
  channels,
  isCollapsed,
  onToggleCollapse,
}: NetworkGroupProps) {
  const sortedChannels = Object.entries(channels).sort(([numA], [numB]) => {
    // Sort by channel number numerically
    return Number.parseInt(numA, 10) - Number.parseInt(numB, 10);
  });

  return (
    <>
      <TableRow
        className="cursor-pointer bg-muted/50 hover:bg-muted/70"
        onClick={() => onToggleCollapse(network)}
      >
        <TableCell
          className="border font-bold"
          colSpan={1 + ZONES.flatMap((z) => z.states).length}
        >
          <div className="flex items-center justify-between">
            <span>{network}</span>
            <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {!isCollapsed && (
        <>
          <TableRow>
            <TableHead className="border bg-muted">Channel</TableHead>
            {ZONES.flatMap((zone) =>
              zone.states.map((state) => (
                <TableHead
                  className={`border text-center ${zone.color}`}
                  key={state.code}
                >
                  {state.name}
                </TableHead>
              ))
            )}
          </TableRow>
          {sortedChannels.map(([channelNumber, stateChannels]) => (
            <ChannelRow
              channelNumber={channelNumber}
              key={`${network}-${channelNumber}`}
              network={network}
              stateChannels={stateChannels}
            />
          ))}
        </>
      )}
    </>
  );
}
