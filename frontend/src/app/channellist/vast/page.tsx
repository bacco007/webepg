import type { Metadata } from "next";
import VastClient from "./vast-client";

export const metadata: Metadata = {
  description:
    "Browse VAST satellite channel listings and coverage information for Viewer Access Satellite Television in regional Australia.",
  openGraph: {
    description:
      "Browse VAST satellite channel listings and coverage information for Viewer Access Satellite Television in regional Australia.",
    siteName: "webEPG",
    title: "VAST Channels | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/vast",
  },
  title: "VAST Channels",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse VAST satellite channel listings and coverage information for Viewer Access Satellite Television in regional Australia.",
    title: "VAST Channels | webEPG",
  },
};

export default function VastPage() {
  return <VastClient />;
}
