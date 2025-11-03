import type { Metadata } from "next";
import SourcesPageClient from "./sources-client";

export const metadata: Metadata = {
  description: "Browse and manage data sources for EPG information.",
  openGraph: {
    description: "Browse and manage data sources for EPG information.",
    siteName: "webEPG",
    title: "Data Sources | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/sources",
  },
  title: "Data Sources",
  twitter: {
    card: "summary_large_image",
    description: "Browse and manage data sources for EPG information.",
    title: "Data Sources | webEPG",
  },
};

export default function SourcesPage() {
  return <SourcesPageClient />;
}
