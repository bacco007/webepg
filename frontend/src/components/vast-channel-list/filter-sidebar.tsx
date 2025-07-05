import { FilterSection } from "@/components/filter-section";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import {
  getChannelMap,
  getChannelSpecs,
  getChannelTypes,
  getNetworkCounts,
  getSpecsCounts,
  getTypeCounts,
} from "./channel-map-utils";
import type { ChannelData } from "./types";

interface FilterSidebarProps {
  channelData: Record<string, ChannelData[]>;
  networkGroups: string[];
  globalFilter: string;
  selectedNetworks: string[];
  selectedChannelTypes: string[];
  selectedChannelSpecs: string[];
  networkSearch: string;
  typeSearch: string;
  specsSearch: string;
  onGlobalFilterChange: (value: string) => void;
  onNetworkFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onSpecsFilterChange: (value: string) => void;
  onNetworkSearchChange: (value: string) => void;
  onTypeSearchChange: (value: string) => void;
  onSpecsSearchChange: (value: string) => void;
  onClearFilters: () => void;
  totalChannels: number;
  filteredChannels: number;
}

export function FilterSidebar({
  channelData,
  networkGroups,
  globalFilter,
  selectedNetworks,
  selectedChannelTypes,
  selectedChannelSpecs,
  networkSearch,
  typeSearch,
  specsSearch,
  onGlobalFilterChange,
  onNetworkFilterChange,
  onTypeFilterChange,
  onSpecsFilterChange,
  onNetworkSearchChange,
  onTypeSearchChange,
  onSpecsSearchChange,
  onClearFilters,
  totalChannels,
  filteredChannels,
}: FilterSidebarProps) {
  const channelMap = getChannelMap(channelData);
  const channelTypes = getChannelTypes(channelData);
  const channelSpecs = getChannelSpecs(channelData);

  const networkCounts = getNetworkCounts(channelMap, {
    globalFilter,
    selectedChannelTypes,
    selectedChannelSpecs,
  });

  const typeCounts = getTypeCounts(channelData, channelTypes, {
    globalFilter,
    selectedNetworks,
    selectedChannelSpecs,
  });

  const specsCounts = getSpecsCounts(channelData, channelSpecs, {
    globalFilter,
    selectedNetworks,
    selectedChannelTypes,
  });

  return (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={onGlobalFilterChange}
          placeholder="Search channels..."
          searchValue={globalFilter}
        />
      </SidebarHeader>
      <SidebarContent>
        <FilterSection
          counts={networkCounts}
          filters={selectedNetworks}
          onFilterChange={onNetworkFilterChange}
          onSearchChange={onNetworkSearchChange}
          options={networkGroups}
          searchValue={networkSearch}
          showSearch={networkGroups.length > 10}
          title="Network"
        />
        <FilterSection
          counts={typeCounts}
          filters={selectedChannelTypes}
          onFilterChange={onTypeFilterChange}
          onSearchChange={onTypeSearchChange}
          options={channelTypes}
          searchValue={typeSearch}
          showSearch={channelTypes.length > 10}
          title="Channel Type"
        />
        <FilterSection
          counts={specsCounts}
          filters={selectedChannelSpecs}
          onFilterChange={onSpecsFilterChange}
          onSearchChange={onSpecsSearchChange}
          options={channelSpecs}
          searchValue={specsSearch}
          showSearch={channelSpecs.length > 10}
          title="Channel Specs"
        />
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="w-full text-xs"
          onClick={onClearFilters}
          size="sm"
          variant="outline"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {filteredChannels} of {totalChannels} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );
}
