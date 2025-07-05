"use client";

import { Loader2, RefreshCw, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  FilterSidebar,
  getChannelMap,
  getFilteredChannelMap,
  NetworkGroup,
  useVastChannelData,
} from "@/components/vast-channel-list";
import { useDebounce } from "@/hooks/use-debounce";

export default function ChannelMapPage() {
  const { channelData, loading, error, networkGroups, fetchAllChannelData } =
    useVastChannelData();

  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>(
    []
  );
  const [selectedChannelSpecs, setSelectedChannelSpecs] = useState<string[]>(
    []
  );
  const [networkSearch, setNetworkSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [specsSearch, setSpecsSearch] = useState("");
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  // State to track collapsed network groups
  const [collapsedNetworks, setCollapsedNetworks] = useState<
    Record<string, boolean>
  >({});

  const debouncedGlobalSearch = useDebounce(globalFilter, 300);

  // Toggle network collapse state
  const toggleNetworkCollapse = useCallback((network: string) => {
    setCollapsedNetworks((prev) => ({
      ...prev,
      [network]: !prev[network],
    }));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setDesktopSidebarCollapsed(savedState === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebarCollapsed",
      desktopSidebarCollapsed.toString()
    );
  }, [desktopSidebarCollapsed]);

  // Get channel map and filtered channel map
  const channelMap = getChannelMap(channelData);
  const filteredChannelMap = getFilteredChannelMap(channelMap, {
    globalFilter: debouncedGlobalSearch,
    selectedNetworks,
    selectedChannelTypes,
    selectedChannelSpecs,
  });

  // Clear all filters
  const clearFilters = () => {
    setGlobalFilter("");
    setSelectedNetworks([]);
    setSelectedChannelTypes([]);
    setSelectedChannelSpecs([]);
    setNetworkSearch("");
    setTypeSearch("");
    setSpecsSearch("");
  };

  // Count total channels and filtered channels
  const totalChannels = Object.values(channelMap).reduce(
    (count, network) => count + Object.keys(network).length,
    0
  );

  const filteredChannels = Object.values(filteredChannelMap).reduce(
    (count, network) => count + Object.keys(network).length,
    0
  );

  // Prepare sidebar content
  const sidebar = (
    <FilterSidebar
      channelData={channelData}
      filteredChannels={filteredChannels}
      globalFilter={globalFilter}
      networkGroups={networkGroups}
      networkSearch={networkSearch}
      onClearFilters={clearFilters}
      onGlobalFilterChange={setGlobalFilter}
      onNetworkFilterChange={(value) => {
        setSelectedNetworks((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        );
      }}
      onNetworkSearchChange={setNetworkSearch}
      onSpecsFilterChange={(value) => {
        setSelectedChannelSpecs((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        );
      }}
      onSpecsSearchChange={setSpecsSearch}
      onTypeFilterChange={(value) => {
        setSelectedChannelTypes((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        );
      }}
      onTypeSearchChange={setTypeSearch}
      selectedChannelSpecs={selectedChannelSpecs}
      selectedChannelTypes={selectedChannelTypes}
      selectedNetworks={selectedNetworks}
      specsSearch={specsSearch}
      totalChannels={totalChannels}
      typeSearch={typeSearch}
    />
  );

  // Define header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        className="gap-1"
        disabled={loading}
        onClick={fetchAllChannelData}
        size="sm"
        variant="outline"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-destructive text-xl">Error</h2>
          <p>{error}</p>
          <Button className="mt-4" onClick={fetchAllChannelData}>
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarLayout
      actions={headerActions}
      sidebar={sidebar}
      title="VAST Channel List - Mapped by State"
    >
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg">Loading channel data...</span>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          <Table>
            <TableBody>
              {Object.entries(filteredChannelMap).map(([network, channels]) => (
                <NetworkGroup
                  channels={channels}
                  isCollapsed={collapsedNetworks[network]}
                  key={network}
                  network={network}
                  onToggleCollapse={toggleNetworkCollapse}
                />
              ))}
              {Object.keys(filteredChannelMap).length === 0 && (
                <TableRow>
                  <TableCell
                    className="h-24 text-center"
                    colSpan={1 + 7} // 1 for channel column + 7 states
                  >
                    No results found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div aria-hidden="true" className="h-24" /> {/* Spacer element */}
        </div>
      )}
    </SidebarLayout>
  );
}
