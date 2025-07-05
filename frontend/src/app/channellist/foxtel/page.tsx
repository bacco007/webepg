"use client";

import { ChannelDataTable } from "@/components/channel-data-table";

export default function FetchChannelsPage() {
  return (
    <ChannelDataTable
      fetchUrl="/api/py/channels/xmlepg_FOXHD"
      title="Foxtel Channels"
      // Optional customizations:
      // dataExtractor={(data) => data.data.channels} // Default extractor
      // initialSorting={[{ id: "channel_number", desc: false }]} // Default sorting
      // defaultColumnVisibility={{}} // Default column visibility
      // showChannelTypeFilter={true} // Show/hide specific filters
      // showChannelGroupFilter={true}
      // showChannelSpecsFilter={true}
      // renderCustomActions={() => <Button>Custom Action</Button>} // Add custom actions
    />
  );
}
