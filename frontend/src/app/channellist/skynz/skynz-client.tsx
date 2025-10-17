"use client";

import { ChannelDataTable } from "@/components/channel-data-table";

export default function SkyNzClient() {
  return (
    <ChannelDataTable
      fetchUrl="/api/py/channels/nzxmltv_sky"
      title="Sky (NZ) Channels"
    />
  );
}
