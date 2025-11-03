import type { Metadata } from "next";
import TransmittersPageClient from "./transmitters-client";

export const metadata: Metadata = {
  description:
    "Explore transmitter information for radio and television broadcasting services in Australia.",
  openGraph: {
    description:
      "Explore transmitter information for radio and television broadcasting services in Australia.",
    siteName: "webEPG",
    title: "Transmitter Maps | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/transmitters",
  },
  title: "Transmitter Maps",
  twitter: {
    card: "summary_large_image",
    description:
      "Explore transmitter information for radio and television broadcasting services in Australia.",
    title: "Transmitter Maps | webEPG",
  },
};

export default function TransmittersPage() {
  return <TransmittersPageClient />;
}
