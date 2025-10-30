import type { Metadata } from "next";
import HubblClient from "./hubbl-client";

export const metadata: Metadata = {
  description: "Browse Hubbl channel listings and details.",
  title: "Hubbl Channels",
};

export default function HubblPage() {
  return <HubblClient />;
}
