import type { Metadata } from "next";
import FetchClient from "./fetch-client";

export const metadata: Metadata = {
  description:
    "Browse weekly Electronic Program Guide schedules and TV listings.",
  title: "Fetch TV Channel Lineup",
};

export default function FetchPage() {
  return <FetchClient />;
}
