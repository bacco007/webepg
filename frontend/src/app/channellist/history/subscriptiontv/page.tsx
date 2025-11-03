import type { Metadata } from "next";
import SubscriptionTVHistoryPageClient from "@/components/channellist-history/subscriptiontv-page-client";

export const metadata: Metadata = {
  description:
    "A comprehensive timeline of major events across Australian subscription television providers. Track channel launches, closures, mergers, and technology changes over time.",
  openGraph: {
    description:
      "A comprehensive timeline of major events across Australian subscription television providers. Track channel launches, closures, mergers, and technology changes over time.",
    siteName: "webEPG",
    title: "Australian Subscription TV History | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/history/subscriptiontv",
  },
  title: "Australian Subscription TV History",
  twitter: {
    card: "summary_large_image",
    description:
      "A comprehensive timeline of major events across Australian subscription television providers. Track channel launches, closures, mergers, and technology changes over time.",
    title: "Australian Subscription TV History | webEPG",
  },
};

export default function SubscriptionTVHistoryPage() {
  return <SubscriptionTVHistoryPageClient />;
}
