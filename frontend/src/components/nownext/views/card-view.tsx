import type { ChannelData, GroupBy } from "@/lib/nownext-types";
import { ChannelCard } from "../channel-card";

type CardViewProps = {
  filteredChannels: ChannelData[];
  groupBy: GroupBy;
  onNavigateToNext24Hours: () => void;
  onNavigateToFullWeek: (channelSlug: string) => void;
};

export function CardView({
  filteredChannels,
  groupBy,
  onNavigateToNext24Hours,
  onNavigateToFullWeek,
}: CardViewProps) {
  if (groupBy === "none") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
        {filteredChannels.map((channelData) => (
          <ChannelCard
            channelData={channelData}
            key={`${channelData.channel.id}-${channelData.channel.lcn}`}
            onNavigateToFullWeek={onNavigateToFullWeek}
            onNavigateToNext24Hours={onNavigateToNext24Hours}
          />
        ))}
      </div>
    );
  }

  const groupedChannels: { [key: string]: ChannelData[] } = {};
  for (const channelData of filteredChannels) {
    const groupKey =
      groupBy === "channel_group" ? channelData.channel.group : "Unknown";
    if (groupKey !== "N/A") {
      if (!groupedChannels[groupKey]) {
        groupedChannels[groupKey] = [];
      }
      groupedChannels[groupKey].push(channelData);
    }
  }

  const sortedGroups = Object.keys(groupedChannels).sort();

  return (
    <div className="space-y-8">
      {sortedGroups.map((group, index) => (
        <div
          className={index === sortedGroups.length - 1 ? "mb-4" : ""}
          key={group}
        >
          <h2 className="mb-4 font-bold text-2xl">{group}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
            {groupedChannels[group].map((channelData) => (
              <ChannelCard
                channelData={channelData}
                key={`${channelData.channel.id}-${channelData.channel.lcn}`}
                onNavigateToFullWeek={onNavigateToFullWeek}
                onNavigateToNext24Hours={onNavigateToNext24Hours}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
