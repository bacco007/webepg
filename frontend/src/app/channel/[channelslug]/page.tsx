import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/constants";
import ChannelSlugClient from "./channel-slug-client";

export const metadata: Metadata = {
  description:
    "View detailed weekly program guide for a specific channel with comprehensive TV listings.",
  openGraph: {
    description:
      "View detailed weekly program guide for a specific channel with comprehensive TV listings.",
    siteName: SITE_CONFIG.name,
    title: "Channel Guide | webEPG",
    type: "website",
    url: SITE_CONFIG.url,
  },
  title: "Channel Guide",
  twitter: {
    card: "summary_large_image",
    description:
      "View detailed weekly program guide for a specific channel with comprehensive TV listings.",
    title: "Channel Guide | webEPG",
  },
};

export default function ChannelSlugPage() {
  return <ChannelSlugClient />;
}
