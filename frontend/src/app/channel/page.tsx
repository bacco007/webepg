import type { Metadata } from "next";
import ChannelListPageClient from "./channel-client";

export const metadata: Metadata = {
  description:
    "Browse weekly Electronic Program Guide schedules and TV listings.",
  title: "Weekly EPG",
};

export default function ChannelPage() {
  return <ChannelListPageClient />;
}
