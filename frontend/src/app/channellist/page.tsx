import type { Metadata } from "next";
import ChannelListIndexPageClient from "./channellist-client";

export const metadata: Metadata = {
  description:
    "Explore comprehensive channel listings and program guides for various television services across Australia and New Zealand.",
  title: "Channel Lists",
};

export default function ChannelListPage() {
  return <ChannelListIndexPageClient />;
}
