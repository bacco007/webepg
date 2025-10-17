import type { Metadata } from "next";
import EPGDateClient from "./epg-date-client";

export const metadata: Metadata = {
  description:
    "Browse Electronic Program Guide schedules for a specific date with detailed TV listings.",
  title: "EPG Schedule",
};

type EPGDatePageProps = {
  params: Promise<{
    date: string;
  }>;
};

export default function EPGDatePage({ params }: EPGDatePageProps) {
  return <EPGDateClient params={params} />;
}
