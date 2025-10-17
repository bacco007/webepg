import type { Metadata } from "next";
import TransmitterMap from "@/components/radio-transmitter-map";

export const metadata: Metadata = {
  description:
    "Interactive map showing radio transmitter locations and coverage areas across Australia.",
  title: "Radio Transmitters",
};

export default function TransmittersPage() {
  return (
    <div className="flex size-full flex-col">
      <TransmitterMap />
    </div>
  );
}
