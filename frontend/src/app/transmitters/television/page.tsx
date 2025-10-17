import type { Metadata } from "next";
import TelevisionTransmittersClient from "./television-transmitters-client";

export const metadata: Metadata = {
  description:
    "Interactive map showing television transmitter locations and coverage areas across Australia.",
  title: "Television Transmitters",
};

export default function TelevisionTransmittersPage() {
  return <TelevisionTransmittersClient />;
}
