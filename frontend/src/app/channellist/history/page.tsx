import type { Metadata } from "next";
import TimelineIndexPageClient from "./timeline-client";

export const metadata: Metadata = {
  description:
    "Explore historical channel lineup timelines for Australian and New Zealand television services. Track channel changes, launches, and transitions over time.",
  openGraph: {
    description:
      "Explore historical channel lineup timelines for Australian and New Zealand television services. Track channel changes, launches, and transitions over time.",
    siteName: "webEPG",
    title: "Channel History Timelines | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/history",
  },
  title: "Channel History Timelines",
  twitter: {
    card: "summary_large_image",
    description:
      "Explore historical channel lineup timelines for Australian and New Zealand television services. Track channel changes, launches, and transitions over time.",
    title: "Channel History Timelines | webEPG",
  },
};

export default function TimelinePage() {
  return <TimelineIndexPageClient />;
}
