import type { Metadata } from "next";
import RadioTransmittersClient from "./radio-transmitters-client";

export const metadata: Metadata = {
  description:
    "Interactive map showing radio transmitter locations and coverage areas across Australia.",
  title: "Radio Transmitters",
};

export default function TransmittersPage() {
  return <RadioTransmittersClient />;
}
