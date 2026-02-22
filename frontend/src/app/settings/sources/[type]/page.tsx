import type { Metadata } from "next";
import SourcesClient from "./sources-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const sourceTypeLabel = type === "remote" ? "Remote" : "Local";

  return {
    description: `Manage ${sourceTypeLabel.toLowerCase()} XMLTV sources`,
    title: `${sourceTypeLabel} Sources | Settings`,
  };
}

export default async function SourcesPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const sourceType = (type === "remote" ? "remote" : "local") as
    | "remote"
    | "local";

  return <SourcesClient sourceType={sourceType} />;
}
