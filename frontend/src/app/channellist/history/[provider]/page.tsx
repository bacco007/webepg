import type { Metadata } from "next";
import ChannelHistoryClient from "./provider-client";

export const metadata: Metadata = {
  description:
    "Explore the timeline of channel changes and events for various TV providers.",
  title: "Channel History Timeline",
};

type ChannelHistoryPageProps = {
  params: Promise<{
    provider: string;
  }>;
};

export default function ChannelHistoryPage({
  params,
}: ChannelHistoryPageProps) {
  return <ChannelHistoryClient params={params} />;
}
