import type { Metadata } from "next";
import FoxtelClient from "./foxtel-client";

export const metadata: Metadata = {
  description:
    "Browse weekly Electronic Program Guide schedules and TV listings.",
  title: "Foxtel Channel Lineup",
};

export default function FoxtelPage() {
  return <FoxtelClient />;
}
