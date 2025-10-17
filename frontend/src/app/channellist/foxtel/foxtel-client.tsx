"use client";

import { ChannelDataTable } from "@/components/channel-data-table";

export default function FoxtelClient() {
  return (
    <ChannelDataTable
      fetchUrl="/api/py/channels/xmlepg_FOXHD"
      title="Foxtel Channels"
    />
  );
}
