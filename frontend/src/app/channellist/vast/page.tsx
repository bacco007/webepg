import type { Metadata } from "next";
import VastClient from "./vast-client";

export const metadata: Metadata = {
  description:
    "Browse VAST satellite channel listings and coverage information for regional Australia.",
  title: "VAST Channels",
};

export default function VastPage() {
  return <VastClient />;
}
