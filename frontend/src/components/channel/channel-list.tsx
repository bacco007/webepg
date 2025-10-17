import {
  AlertCircle,
  ChevronDown,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  SidebarSearch,
} from "@/components/layouts/sidebar-layout";
import LoadingState from "@/components/loading-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CardView } from "./card-view";
import { FilterSection } from "./filter-section";
import { useChannelData } from "./hooks/use-channel-data";
import { useChannelFilters } from "./hooks/use-channel-filters";
import { TableView } from "./table-view";
import type { GroupBy, ViewMode } from "./types";
import {
  getChannelDisplayNameWithAbbreviations,
  getChannelNumber,
} from "./utils";

export function ChannelList() {
  const {
    channels,
    filteredChannels,
    setFilteredChannels,
    loading,
    error,
    xmltvDataSource,
    fetchChannels,
  } = useChannelData();

  const {
    searchTerm,
    setSearchTerm,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    setHideNoPrograms,
    uniqueGroups,
    uniqueTypes,
    uniqueSpecs,
    uniqueNameGroups,
    hasNameGroups,
    clearFilters,
    handleGroupFilter,
    handleTypeFilter,
    handleSpecsFilter,
    handleNameGroupFilter,
    groupCounts,
    typeCounts,
    specsCounts,
    nameGroupCounts,
  } = useChannelFilters(channels);

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  // Apply filters to channels
  useEffect(() => {
    const filtered = channels.filter(
      (channel) =>
        (getChannelDisplayNameWithAbbreviations(channel)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          getChannelNumber(channel).includes(searchTerm)) &&
        (selectedGroups.length === 0 ||
          selectedGroups.includes(channel.channel_group)) &&
        (selectedTypes.length === 0 ||
          selectedTypes.includes(channel.other_data.channel_type)) &&
        (selectedSpecs.length === 0 ||
          selectedSpecs.includes(channel.other_data.channel_specs)) &&
        (selectedNameGroups.length === 0 ||
          (channel.other_data.channel_name_group &&
            selectedNameGroups.includes(
              channel.other_data.channel_name_group
            ))) &&
        (!hideNoPrograms || channel.program_count > 0)
    );
    setFilteredChannels(filtered);
  }, [
    searchTerm,
    channels,
    selectedGroups,
    selectedTypes,
    selectedSpecs,
    selectedNameGroups,
    hideNoPrograms,
    setFilteredChannels,
  ]);

  const handleRefresh = () => {
    fetchChannels();
  };

  const getGroupByDisplayText = () => {
    if (groupBy === "none") {
      return "Group By";
    }
    if (groupBy === "channel_group") {
      return "By Group";
    }
    if (groupBy === "channel_type") {
      return "By Type";
    }
    if (groupBy === "channel_specs") {
      return "By Specs";
    }
    return "By Name Group";
  };

  // Define header actions
  const headerActions = (
    <div className="flex items-center space-x-2">
      <ToggleGroup
        onValueChange={(value) => value && setViewMode(value as ViewMode)}
        type="single"
        value={viewMode}
      >
        <ToggleGroupItem aria-label="Card view" value="card">
          <LayoutGrid className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Table view" value="table">
          <List className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      {viewMode === "card" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="sm:w-auto" variant="outline">
              {getGroupByDisplayText()}
              <ChevronDown className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setGroupBy("none")}>
              No Grouping
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGroupBy("channel_group")}>
              Group
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGroupBy("channel_type")}>
              Type
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setGroupBy("channel_specs")}>
              Specs
            </DropdownMenuItem>
            {hasNameGroups && (
              <DropdownMenuItem
                onSelect={() => setGroupBy("channel_name_group")}
              >
                Name Group
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button
        className="gap-1"
        onClick={handleRefresh}
        size="sm"
        variant="outline"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );

  // Prepare sidebar content
  const sidebar = (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarSearch
          onValueChange={setSearchTerm}
          placeholder="Search channels..."
          searchValue={searchTerm}
        />
      </SidebarHeader>
      <SidebarContent>
        {/* Options section */}
        <div className="border-b">
          <div className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/10">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Options</span>
            </div>
          </div>
          <div className="px-4 pb-3">
            <label className="flex cursor-pointer items-center py-1">
              <div className="flex items-center">
                <Checkbox
                  checked={hideNoPrograms}
                  className="mr-2"
                  id="hide-no-programs"
                  onCheckedChange={(checked) =>
                    setHideNoPrograms(checked as boolean)
                  }
                />
                <span className="text-sm">Hide channels with no programs</span>
              </div>
            </label>
          </div>
        </div>

        <FilterSection
          counts={groupCounts}
          filters={selectedGroups}
          onFilterChange={handleGroupFilter}
          options={uniqueGroups}
          title="Channel Owner/Operator"
        />

        <FilterSection
          counts={typeCounts}
          filters={selectedTypes}
          onFilterChange={handleTypeFilter}
          options={uniqueTypes}
          title="Channel Type"
        />

        <FilterSection
          counts={specsCounts}
          filters={selectedSpecs}
          onFilterChange={handleSpecsFilter}
          options={uniqueSpecs}
          title="Channel Specs"
        />

        {hasNameGroups && (
          <FilterSection
            counts={nameGroupCounts}
            filters={selectedNameGroups}
            onFilterChange={handleNameGroupFilter}
            options={uniqueNameGroups}
            title="Name Groups"
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="w-full text-xs"
          onClick={clearFilters}
          size="sm"
          variant="outline"
        >
          Clear All Filters
        </Button>
        <div className="mt-2 text-center text-muted-foreground text-xs">
          Showing {filteredChannels.length} of {channels.length} channels
        </div>
      </SidebarFooter>
    </SidebarContainer>
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Alert className="max-w-md" variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button className="mt-4" onClick={handleRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      sidebar={sidebar}
      title="Channel List"
    >
      <div className="p-4 pb-24">
        {loading ? (
          <div className="flex flex-col space-y-4">
            <LoadingState text="Loading channels..." />
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {viewMode === "card" ? (
              <CardView
                filteredChannels={filteredChannels}
                groupBy={groupBy}
                xmltvDataSource={xmltvDataSource}
              />
            ) : (
              <TableView
                filteredChannels={filteredChannels}
                hasNameGroups={hasNameGroups}
                xmltvDataSource={xmltvDataSource}
              />
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
