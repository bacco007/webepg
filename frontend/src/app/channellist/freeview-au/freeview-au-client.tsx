"use client";

import { FreeviewChannelCard } from "@/components/channel/freeview-channel-card";
import { SourceList, SourceSearch } from "@/components/channel/source-selector";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
} from "@/components/layouts/sidebar-layout";
import LoadingState from "@/components/loading-state";
import { useFreeviewData } from "@/hooks/use-freeview-data";

export default function FreeviewAuClient() {
  const {
    filteredSources,
    selectedSource,
    loading,
    error,
    openGroups,
    searchTerm,
    channelGroups,
    sortedNetworks,
    selectedSourceDetails,
    toggleGroup,
    selectSource,
    setSearchTerm,
  } = useFreeviewData();

  if (error) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-destructive text-lg">Error: {error}</p>
      </div>
    );
  }

  // Create the sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SourceSearch onSearchChange={setSearchTerm} searchTerm={searchTerm} />
      </SidebarHeader>
      <SidebarContent>
        <SourceList
          onSourceSelect={selectSource}
          onToggleGroup={toggleGroup}
          openGroups={openGroups}
          selectedSource={selectedSource}
          sources={filteredSources}
        />
      </SidebarContent>
      <SidebarFooter>
        <div className="text-center text-muted-foreground text-xs">
          {filteredSources.length} locations available
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  // Create the page title
  const pageTitle = selectedSourceDetails
    ? `Freeview Services: ${selectedSourceDetails.subgroup.replace("FTA - ", "")} - ${selectedSourceDetails.location}`
    : "Freeview Services";

  return (
    <SidebarLayout
      contentClassName="p-0 overflow-auto"
      sidebar={sidebar}
      title={pageTitle}
    >
      {loading ? (
        <LoadingState
          className="bg-background/95"
          fullscreen={false}
          text="Loading Freeview data..."
        />
      ) : (
        <div className="h-full overflow-auto bg-background">
          {sortedNetworks.map((networkName) => (
            <div className="mb-4" key={networkName}>
              <div className="bg-muted px-4 py-2">
                <h2 className="font-medium">{networkName}</h2>
              </div>
              <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {channelGroups[networkName].map((channel, index) => (
                  <FreeviewChannelCard
                    channel={channel}
                    key={`${channel.channel_id}-${channel.other_data.channel_specs}-${index}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
