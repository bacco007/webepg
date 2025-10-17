import type { Metadata } from "next";
import TimelineIndexPageClient from "./timeline-client";

export const metadata: Metadata = {
  description:
    "Explore historical channel lineup timelines for Australian and New Zealand television services. Track channel changes, launches, and transitions over time.",
  title: "Channel History Timelines",
};

export default function TimelinePage() {
  return <TimelineIndexPageClient />;
}
