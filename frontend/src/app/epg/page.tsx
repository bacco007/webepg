import type { Metadata } from "next";
import EPGDayListClient from "./epg-client";

export const metadata: Metadata = {
  description:
    "Browse daily Electronic Program Guide schedules and TV listings.",
  title: "Daily EPG",
};

export default function EPGPage() {
  return <EPGDayListClient />;
}
