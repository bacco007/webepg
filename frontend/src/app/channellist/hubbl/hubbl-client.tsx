"use client";

import { ChannelDataTable } from "@/components/channel-data-table";

export default function HubblClient() {
  return (
    <ChannelDataTable
      fetchUrl="/api/py/channels/xmlepg_HUBALL"
      title="Hubbl Channels"
    />
  );
}
