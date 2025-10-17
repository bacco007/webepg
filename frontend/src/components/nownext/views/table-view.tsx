import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ChannelData } from "@/lib/nownext-types";
import {
  calculateProgress,
  decodeChannelName,
  formatTime,
  isChannelGreyedOut,
} from "@/utils/nownext";

type TableViewProps = {
  filteredChannels: ChannelData[];
  onNavigateToNext24Hours: () => void;
  onNavigateToFullWeek: (channelSlug: string) => void;
};

export function TableView({
  filteredChannels,
  onNavigateToNext24Hours,
  onNavigateToFullWeek,
}: TableViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Channel</TableHead>
          <TableHead>Current Program</TableHead>
          <TableHead>Next Program</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredChannels.map((channelData) => (
          <TableRow
            className={isChannelGreyedOut(channelData) ? "opacity-50" : ""}
            key={`${channelData.channel.id}-${channelData.channel.lcn}`}
          >
            <TableCell>
              <div className="flex items-center space-x-2">
                {channelData.channel.icon.light !== "N/A" && (
                  <img
                    alt={decodeChannelName(channelData.channel.name.real)}
                    className="size-8 object-contain"
                    src={channelData.channel.icon.light || "/placeholder.svg"}
                  />
                )}
                <div>
                  <p className="font-medium">{channelData.channel.name.real}</p>
                  {channelData.channel.lcn !== "N/A" && (
                    <p className="text-muted-foreground text-sm">
                      Channel {channelData.channel.lcn}
                    </p>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p>{channelData.currentProgram?.title || "N/A"}</p>
              <p className="text-muted-foreground text-sm">
                {channelData.currentProgram
                  ? `${formatTime(channelData.currentProgram.start)} - ${formatTime(
                      channelData.currentProgram.stop
                    )} (${channelData.currentProgram.lengthstring})`
                  : ""}
              </p>
              {channelData.currentProgram && (
                <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-1 bg-primary"
                    style={{
                      width: `${calculateProgress(channelData.currentProgram.start, channelData.currentProgram.stop)}%`,
                    }}
                  />
                </div>
              )}
            </TableCell>
            <TableCell>
              <p>{channelData.nextProgram?.title || "N/A"}</p>
              <p className="text-muted-foreground text-sm">
                {channelData.nextProgram
                  ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(
                      channelData.nextProgram.stop
                    )} (${channelData.nextProgram.lengthstring})`
                  : ""}
              </p>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button onClick={onNavigateToNext24Hours} variant="secondary">
                  <Clock className="mr-2 size-4" />
                  Next 24hrs
                </Button>
                <Button
                  onClick={() => onNavigateToFullWeek(channelData.channel.slug)}
                  variant="outline"
                >
                  <Clock className="mr-2 size-4" />
                  Full Week
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
