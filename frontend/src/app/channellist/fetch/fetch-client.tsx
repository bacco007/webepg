"use client";

import { ChannelDataTable } from "@/components/channel-data-table";

export default function FetchClient() {
  return (
    <ChannelDataTable
      fetchUrl="/api/py/channels/xmlepg_FETALL"
      title="Fetch TV Channels"
    />
  );
}
