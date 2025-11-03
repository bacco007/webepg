import type { Metadata } from "next";
import TelevisionTransmittersClient from "./television-transmitters-client";

export const metadata: Metadata = {
  description:
    "Interactive map showing television transmitter locations and coverage areas across Australia.",
  openGraph: {
    description:
      "Interactive map showing television transmitter locations and coverage areas across Australia.",
    siteName: "webEPG",
    title: "Television Transmitters | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/transmitters/television",
  },
  title: "Television Transmitters",
  twitter: {
    card: "summary_large_image",
    description:
      "Interactive map showing television transmitter locations and coverage areas across Australia.",
    title: "Television Transmitters | webEPG",
  },
};

export default function TelevisionTransmittersPage() {
  return <TelevisionTransmittersClient />;
}
