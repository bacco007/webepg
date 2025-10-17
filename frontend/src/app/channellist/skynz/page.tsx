import type { Metadata } from "next";
import SkyNzClient from "./skynz-client";

export const metadata: Metadata = {
  description: "Browse Sky New Zealand channel listings and details.",
  title: "Sky New Zealand Channels",
};

export default function SkyNzPage() {
  return <SkyNzClient />;
}
