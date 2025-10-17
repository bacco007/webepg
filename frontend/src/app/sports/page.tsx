import type { Metadata } from "next";
import SportsPageClient from "./sports-client";

export const metadata: Metadata = {
  description: "Browse upcoming sports events and matches on TV channels.",
  title: "Upcoming Sports",
};

export default function SportsPage() {
  return <SportsPageClient />;
}
