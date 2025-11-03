import type { Metadata } from "next";
import FetchClient from "./fetch-client";

export const metadata: Metadata = {
  description:
    "Browse Fetch TV channel lineup and Electronic Program Guide schedules for internet protocol television service.",
  openGraph: {
    description:
      "Browse Fetch TV channel lineup and Electronic Program Guide schedules for internet protocol television service.",
    siteName: "webEPG",
    title: "Fetch TV Channel Lineup | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/fetch",
  },
  title: "Fetch TV Channel Lineup",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse Fetch TV channel lineup and Electronic Program Guide schedules for internet protocol television service.",
    title: "Fetch TV Channel Lineup | webEPG",
  },
};

export default function FetchPage() {
  return <FetchClient />;
}
