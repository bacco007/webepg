import type { Metadata } from "next";
import AdditionalChannelsClient from "./additional-channels-client";

export const metadata: Metadata = {
  description: "Manage additional channels in the XMLEPG system",
  title: "Additional Channels | Settings",
};

export default function AdditionalChannelsPage() {
  return <AdditionalChannelsClient />;
}
