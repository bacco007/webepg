import type { Metadata } from "next";
import HubblClient from "./hubbl-client";

export const metadata: Metadata = {
  description:
    "Browse Hubbl channel listings and details for the Hubbl streaming platform aggregating multiple content services.",
  openGraph: {
    description:
      "Browse Hubbl channel listings and details for the Hubbl streaming platform aggregating multiple content services.",
    siteName: "webEPG",
    title: "Hubbl Channels | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/hubbl",
  },
  title: "Hubbl Channels",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse Hubbl channel listings and details for the Hubbl streaming platform aggregating multiple content services.",
    title: "Hubbl Channels | webEPG",
  },
};

export default function HubblPage() {
  return <HubblClient />;
}
