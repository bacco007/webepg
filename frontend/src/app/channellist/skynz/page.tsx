import type { Metadata } from "next";
import SkyNzClient from "./skynz-client";

export const metadata: Metadata = {
  description:
    "Browse Sky New Zealand channel listings and details for Sky's satellite and streaming premium channels.",
  openGraph: {
    description:
      "Browse Sky New Zealand channel listings and details for Sky's satellite and streaming premium channels.",
    siteName: "webEPG",
    title: "Sky New Zealand Channels | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/skynz",
  },
  title: "Sky New Zealand Channels",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse Sky New Zealand channel listings and details for Sky's satellite and streaming premium channels.",
    title: "Sky New Zealand Channels | webEPG",
  },
};

export default function SkyNzPage() {
  return <SkyNzClient />;
}
