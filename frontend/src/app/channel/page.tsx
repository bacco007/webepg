import type { Metadata } from "next";
import ChannelListPageClient from "./channel-client";

export const metadata: Metadata = {
  description:
    "Browse weekly Electronic Program Guide schedules and TV listings.",
  openGraph: {
    description:
      "Browse weekly Electronic Program Guide schedules and TV listings.",
    siteName: "webEPG",
    title: "Weekly EPG | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channel",
  },
  title: "Weekly EPG",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse weekly Electronic Program Guide schedules and TV listings.",
    title: "Weekly EPG | webEPG",
  },
};

export default function ChannelPage() {
  return <ChannelListPageClient />;
}
