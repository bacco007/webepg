import { TableCell, TableRow } from "@/components/ui/table";
import { getChannelDisplayName } from "./channel-map-utils";
import { getMergedCells } from "./merged-cells-utils";
import { ALL_STATES, type ChannelData } from "./types";

interface ChannelRowProps {
  network: string;
  channelNumber: string;
  stateChannels: Record<string, ChannelData>;
}

export function ChannelRow({
  network,
  channelNumber,
  stateChannels,
}: ChannelRowProps) {
  const mergedCells = getMergedCells(stateChannels);

  return (
    <TableRow className="hover:bg-muted/50" key={`${network}-${channelNumber}`}>
      <TableCell className="border font-medium">
        <div className="flex items-center gap-2">
          {/* Show channel logo if available */}
          {Object.values(stateChannels)[0]?.channel_logo?.light && (
            <div className="flex size-10 items-center justify-center rounded-md bg-muted/50">
              <img
                alt=""
                className="max-h-full max-w-full object-contain p-1"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=40&width=40";
                }}
                src={
                  Object.values(stateChannels)[0].channel_logo.light ||
                  "/placeholder.svg"
                }
              />
            </div>
          )}
          <div>
            <div>{getChannelDisplayName(stateChannels)}</div>
            <div className="text-muted-foreground text-xs">
              Ch {channelNumber}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Render each state column */}
      {ALL_STATES.map((state, stateIndex) => {
        // Find the merged cell that contains this state index
        const mergedCell = mergedCells.find(
          (cell) => stateIndex >= cell.startIndex && stateIndex <= cell.endIndex
        );

        // If we found a merged cell and this is the first state in the merged range,
        // render it with the appropriate colspan
        if (mergedCell && stateIndex === mergedCell.startIndex) {
          const colspan = mergedCell.endIndex - mergedCell.startIndex + 1;

          if (mergedCell.channel) {
            // This is a channel cell
            return (
              <TableCell
                className="border text-center"
                colSpan={colspan}
                key={`state-${state.code}`}
              >
                <div className="font-medium text-sm">
                  {mergedCell.channel.channel_names.location ||
                    mergedCell.channel.channel_name}
                </div>
              </TableCell>
            );
          }
          // This is a "Not available" cell
          return (
            <TableCell
              className="border text-center"
              colSpan={colspan}
              key={`state-${state.code}`}
            >
              <span className="text-muted-foreground text-xs">
                Not available
              </span>
            </TableCell>
          );
        }
        if (!mergedCell || stateIndex !== mergedCell.startIndex) {
          // Skip this cell as it's part of a colspan
          return null;
        }

        // Fallback - should not reach here
        return (
          <TableCell className="border text-center" key={`state-${state.code}`}>
            <span className="text-muted-foreground text-xs">Error</span>
          </TableCell>
        );
      })}
    </TableRow>
  );
}
