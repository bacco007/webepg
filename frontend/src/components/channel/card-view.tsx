import { ChannelCard } from "./channel-card";
import type { Channel, GroupBy } from "./types";
import { groupChannels, sortChannels } from "./utils";

type CardViewProps = {
  filteredChannels: Channel[];
  groupBy: GroupBy;
  xmltvDataSource: string;
};

export function CardView({
  filteredChannels,
  groupBy,
  xmltvDataSource,
}: CardViewProps) {
  // Sort channels by channel number first, then by name
  const sortedChannels = sortChannels(filteredChannels);

  if (groupBy === "none") {
    return (
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-6">
          {sortedChannels.map((channel) => (
            <ChannelCard
              channel={channel}
              key={channel.uuid}
              xmltvDataSource={xmltvDataSource}
            />
          ))}
        </div>
      </div>
    );
  }

  const groupedChannels = groupChannels(sortedChannels, groupBy);
  const sortedGroups = Object.keys(groupedChannels).sort();

  return (
    <div className="space-y-8">
      {sortedGroups.map((group) => (
        <div key={group}>
          <h2 className="mb-4 font-bold text-2xl">{group}</h2>
          <div className="g5">
            {groupedChannels[group].map((channel) => (
              <ChannelCard
                channel={channel}
                key={channel.uuid}
                xmltvDataSource={xmltvDataSource}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
