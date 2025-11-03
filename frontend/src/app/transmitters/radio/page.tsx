import type { Metadata } from "next";
import RadioTransmittersClient from "./radio-transmitters-client";

export const metadata: Metadata = {
  description:
    "Interactive map showing radio transmitter locations and coverage areas across Australia.",
  openGraph: {
    description:
      "Interactive map showing radio transmitter locations and coverage areas across Australia.",
    siteName: "webEPG",
    title: "Radio Transmitters | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/transmitters/radio",
  },
  title: "Radio Transmitters",
  twitter: {
    card: "summary_large_image",
    description:
      "Interactive map showing radio transmitter locations and coverage areas across Australia.",
    title: "Radio Transmitters | webEPG",
  },
};

export default function TransmittersPage() {
  return <RadioTransmittersClient />;
}
