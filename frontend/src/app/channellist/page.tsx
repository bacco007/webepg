import type { Metadata } from "next";
import ChannelListIndexPageClient from "./channellist-client";

export const metadata: Metadata = {
  description:
    "Explore comprehensive channel listings and program guides for various television services across Australia and New Zealand.",
  openGraph: {
    description:
      "Explore comprehensive channel listings and program guides for various television services across Australia and New Zealand.",
    siteName: "webEPG",
    title: "Channel Lists | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist",
  },
  title: "Channel Lists",
  twitter: {
    card: "summary_large_image",
    description:
      "Explore comprehensive channel listings and program guides for various television services across Australia and New Zealand.",
    title: "Channel Lists | webEPG",
  },
};

export default function ChannelListPage() {
  return <ChannelListIndexPageClient />;
}
