import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChannelData } from "@/lib/nownext-types";
import {
  calculateProgress,
  decodeChannelName,
  formatTime,
  isChannelGreyedOut,
} from "@/utils/nownext";

type ChannelCardProps = {
  channelData: ChannelData;
  onNavigateToNext24Hours: () => void;
  onNavigateToFullWeek: (channelSlug: string) => void;
};

export function ChannelCard({
  channelData,
  onNavigateToNext24Hours,
  onNavigateToFullWeek,
}: ChannelCardProps) {
  return (
    <Card
      className={`flex flex-col bg-card p-0 ${isChannelGreyedOut(channelData) ? "bg-muted grayscale" : ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between px-4 py-1 pb-0">
        {channelData.channel.icon.light !== "N/A" && (
          <div>
            <img
              alt={decodeChannelName(channelData.channel.name.real)}
              className="block size-auto h-14 object-contain dark:hidden"
              src={channelData.channel.icon.light || "/placeholder.svg"}
            />
            <img
              alt={decodeChannelName(channelData.channel.name.real)}
              className="hidden size-auto h-14 object-contain dark:block"
              src={channelData.channel.icon.dark || "/placeholder.svg"}
            />
          </div>
        )}
        <div className="text-right">
          <CardTitle className="text-lg">
            {channelData.channel.name.real}
          </CardTitle>
          {channelData.channel.lcn !== "N/A" && (
            <CardDescription>Channel {channelData.channel.lcn}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="grow px-4 py-1">
        <div className="text-sm">
          <div className="font-semibold">
            Current Program: {channelData.currentProgram?.title || "N/A"}
          </div>
          <div className="text-card-foreground/60">
            {channelData.currentProgram
              ? `${formatTime(channelData.currentProgram.start)} - ${formatTime(channelData.currentProgram.stop)}`
              : ""}{" "}
            ({channelData.currentProgram?.lengthstring || "N/A"})
          </div>
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
          <div className="py-0.5" />
          <div className="mt-2 font-semibold">
            Next Program: {channelData.nextProgram?.title || "N/A"}
          </div>
          <div className="text-card-foreground/60">
            {channelData.nextProgram
              ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(channelData.nextProgram.stop)}`
              : ""}{" "}
            ({channelData.nextProgram?.lengthstring || "N/A"})
          </div>
        </div>
        <div className="py-0.5" />
      </CardContent>
      <CardFooter className="px-4 py-1 pt-0">
        <div className="flex w-full gap-3 py-0.5">
          <Button
            className="flex-1 px-1.5 py-0.5 text-xs"
            onClick={onNavigateToNext24Hours}
            variant="secondary"
          >
            <Clock className="mr-2 size-3" />
            Next 24hrs
          </Button>
          <Button
            className="flex-1 px-1.5 py-0.5 text-xs"
            onClick={() => onNavigateToFullWeek(channelData.channel.slug)}
            variant="outline"
          >
            <Clock className="mr-2 size-3" />
            Full Week
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
