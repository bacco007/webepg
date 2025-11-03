import type { Metadata } from "next";
import SportsPageClient from "./sports-client";

export const metadata: Metadata = {
  description: "Browse upcoming sports events and matches on TV channels.",
  openGraph: {
    description: "Browse upcoming sports events and matches on TV channels.",
    siteName: "webEPG",
    title: "Upcoming Sports | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/sports",
  },
  title: "Upcoming Sports",
  twitter: {
    card: "summary_large_image",
    description: "Browse upcoming sports events and matches on TV channels.",
    title: "Upcoming Sports | webEPG",
  },
};

export default function SportsPage() {
  return <SportsPageClient />;
}
