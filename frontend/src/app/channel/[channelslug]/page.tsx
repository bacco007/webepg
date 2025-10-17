import type { Metadata } from "next";
import ChannelSlugClient from "./channel-slug-client";

export const metadata: Metadata = {
  description:
    "View detailed weekly program guide for a specific channel with comprehensive TV listings.",
  title: "Channel Guide",
};

export default function ChannelSlugPage() {
  return <ChannelSlugClient />;
}
