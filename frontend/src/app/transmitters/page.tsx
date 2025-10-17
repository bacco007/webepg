import type { Metadata } from "next";
import TransmittersPageClient from "./transmitters-client";

export const metadata: Metadata = {
  description:
    "Explore transmitter information for radio and television broadcasting services in Australia.",
  title: "Transmitter Maps",
};

export default function TransmittersPage() {
  return <TransmittersPageClient />;
}
