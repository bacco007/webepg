import type { Metadata } from "next";
import FoxtelClient from "./foxtel-client";

export const metadata: Metadata = {
  description:
    "Browse Foxtel channel lineup including Australian pay television and streaming service channels with comprehensive TV listings.",
  openGraph: {
    description:
      "Browse Foxtel channel lineup including Australian pay television and streaming service channels with comprehensive TV listings.",
    siteName: "webEPG",
    title: "Foxtel Channel Lineup | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/foxtel",
  },
  title: "Foxtel Channel Lineup",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse Foxtel channel lineup including Australian pay television and streaming service channels with comprehensive TV listings.",
    title: "Foxtel Channel Lineup | webEPG",
  },
};

export default function FoxtelPage() {
  return <FoxtelClient />;
}
