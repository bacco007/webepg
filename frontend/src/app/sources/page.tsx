import type { Metadata } from "next";
import SourcesPageClient from "./sources-client";

export const metadata: Metadata = {
  description: "Browse and manage data sources for EPG information.",
  title: "Data Sources",
};

export default function SourcesPage() {
  return <SourcesPageClient />;
}
