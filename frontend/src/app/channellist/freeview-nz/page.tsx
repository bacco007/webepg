'use client';

import { ChannelDataTable } from '@/components/channel-data-table';

export default function FetchChannelsPage() {
  return (
    <ChannelDataTable
      title="Freeview (NZ) Channels"
      fetchUrl="/api/py/channels/nzxmltv_freeview"
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
