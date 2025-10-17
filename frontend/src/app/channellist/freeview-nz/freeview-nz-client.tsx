"use client";

import { ChannelDataTable } from "@/components/channel-data-table";

export default function FreeviewNzClient() {
  return (
    <ChannelDataTable
      fetchUrl="/api/py/channels/nzxmltv_freeview"
      title="Freeview (NZ) Channels"
    />
  );
}
