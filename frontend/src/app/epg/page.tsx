import type { Metadata } from "next";
import EPGDayListClient from "./epg-client";

export const metadata: Metadata = {
  description:
    "Browse daily Electronic Program Guide schedules and TV listings.",
  openGraph: {
    description:
      "Browse daily Electronic Program Guide schedules and TV listings.",
    siteName: "webEPG",
    title: "Daily EPG | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/epg",
  },
  title: "Daily EPG",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse daily Electronic Program Guide schedules and TV listings.",
    title: "Daily EPG | webEPG",
  },
};

export default function EPGPage() {
  return <EPGDayListClient />;
}
