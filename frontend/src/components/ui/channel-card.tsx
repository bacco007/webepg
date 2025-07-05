import { Clock } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TICKER_CONSTANTS } from "@/lib/ticker-constants";
import type { ChannelData } from "@/types/channel";

interface ChannelCardProps {
  item: ChannelData;
  xmltvDataSource: string;
  calculateProgress: (start: string, stop: string) => number;
}

const ChannelCard = memo<ChannelCardProps>(({ item, xmltvDataSource, calculateProgress }) => {
  const hasValidProgram = item.currentProgram?.stop && item.currentProgram?.start;
  const progress = hasValidProgram 
    ? calculateProgress(item.currentProgram.start, item.currentProgram.stop)
    : 0;

  return (
    <Link
      aria-label={`${item.channel.name.real} - ${item.currentProgram.title}`}
      className="rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-105 transition-all duration-200"
      href={`/channel/${item.channel.slug}?source=${xmltvDataSource}`}
    >
      <Card 
        className="flex flex-row items-center gap-3 shadow-md hover:shadow-lg mr-3 p-3 hover:border-primary/30 border-border/50 h-20 transition-all duration-200 shrink-0"
        style={{ width: `${TICKER_CONSTANTS.CARD_WIDTH}px` }}
      >
        <div className="shrink-0">
          <img
            alt={`${item.channel.name.real} logo`}
            className="size-10 object-contain"
            height={40}
            loading="lazy"
            src={item.channel.icon.light || "/placeholder.svg"}
            width={40}
          />
        </div>
        <div className="overflow-hidden grow">
          <div className="flex justify-between items-center mb-1">
            <div className="font-semibold text-xs truncate">
              {item.channel.name.real}
            </div>
            <span className="text-muted-foreground text-xs">
              {item.currentProgram?.stop
                ? `Ends ${new Date(item.currentProgram.stop).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
          </div>
          <h3 className="font-bold text-sm truncate">
            {item.currentProgram.title}
          </h3>
          {hasValidProgram && (
            <Progress
              aria-label={`${Math.round(progress)}% through current program`}
              className="mt-1 h-1"
              value={progress}
            />
          )}
          <div className="flex items-center mt-1 text-xs">
            <Clock aria-hidden="true" className="mr-1 size-3" />
            <span>{item.currentProgram.lengthstring || "N/A"}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
});

ChannelCard.displayName = "ChannelCard";

export default ChannelCard; 