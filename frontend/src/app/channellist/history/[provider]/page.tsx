import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/constants";
import { timelineProviders } from "@/lib/timeline-data";
import ChannelHistoryClient from "./provider-client";

interface ChannelHistoryPageProps {
  params: Promise<{
    provider: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChannelHistoryPageProps): Promise<Metadata> {
  const { provider } = await params;
  const providerData = timelineProviders[provider];

  const title = providerData
    ? `${providerData.name} Timeline | ${SITE_CONFIG.name}`
    : "Channel History Timeline";
  const description = providerData
    ? providerData.description
    : "Explore the timeline of channel changes and events for various TV providers.";

  return {
    alternates: {
      canonical: `${SITE_CONFIG.url}/channellist/history/${provider}`,
    },
    description,
    openGraph: {
      description,
      siteName: SITE_CONFIG.name,
      title,
      type: "website",
      url: `${SITE_CONFIG.url}/channellist/history/${provider}`,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      title,
    },
  };
}

export default function ChannelHistoryPage({
  params,
}: ChannelHistoryPageProps) {
  return <ChannelHistoryClient params={params} />;
}
