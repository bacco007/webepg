import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
  logo: {
    light: string;
    dark: string;
  };
}

interface GroupedSources {
  [key: string]: Source[];
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
}

function FilterSection({
  title,
  children,
  isOpen,
  onToggle,
  count,
}: FilterSectionProps) {
  return (
    <div className="border-b">
      <div
        className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{count}</span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="space-y-1 pr-1 max-h-[300px] overflow-y-auto thin-scrollbar">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface SourceSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function SourceSearch({
  searchTerm,
  onSearchChange,
}: SourceSearchProps) {
  const clearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="relative">
      <Search className="top-2.5 left-2 absolute size-4 text-muted-foreground" />
      <Input
        aria-label="Search locations"
        className="pl-8 text-sm"
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search locations..."
        value={searchTerm}
      />
      {searchTerm && (
        <Button
          aria-label="Clear search"
          className="top-1 right-1 absolute p-0 w-7 h-7"
          onClick={clearSearch}
          size="sm"
          variant="ghost"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

interface SourceListProps {
  sources: Source[];
  selectedSource: string;
  onSourceSelect: (source: Source) => void;
  openGroups: { [key: string]: boolean };
  onToggleGroup: (group: string) => void;
}

export function SourceList({
  sources,
  selectedSource,
  onSourceSelect,
  openGroups,
  onToggleGroup,
}: SourceListProps) {
  // Group sources by subgroup
  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.subgroup]) {
      acc[source.subgroup] = [];
    }
    acc[source.subgroup].push(source);
    return acc;
  }, {} as GroupedSources);

  return (
    <div className="flex-1 overflow-y-auto">
      {Object.entries(groupedSources).map(([subgroup, sourcesInGroup]) => (
        <FilterSection
          count={sourcesInGroup.length}
          isOpen={openGroups[subgroup] ?? false}
          key={subgroup}
          onToggle={() => onToggleGroup(subgroup)}
          title={subgroup.replace("FTA - ", "")}
        >
          {sourcesInGroup.map((source) => (
            <Button
              className="justify-start mb-1 px-2 py-1.5 w-full text-sm"
              key={source.id}
              onClick={() => onSourceSelect(source)}
              variant={selectedSource === source.id ? "secondary" : "ghost"}
            >
              <span className="text-left truncate whitespace-normal">
                {source.location}
              </span>
            </Button>
          ))}
        </FilterSection>
      ))}
    </div>
  );
}

interface SourceSelectorProps {
  sources: Source[];
  selectedSource: string;
  onSourceSelect: (source: Source) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  openGroups: { [key: string]: boolean };
  onToggleGroup: (group: string) => void;
}

export function SourceSelector({
  sources,
  selectedSource,
  onSourceSelect,
  searchTerm,
  onSearchChange,
  openGroups,
  onToggleGroup,
}: SourceSelectorProps) {
  return (
    <>
      <SourceSearch onSearchChange={onSearchChange} searchTerm={searchTerm} />
      <SourceList
        onSourceSelect={onSourceSelect}
        onToggleGroup={onToggleGroup}
        openGroups={openGroups}
        selectedSource={selectedSource}
        sources={sources}
      />
      <div className="text-muted-foreground text-xs text-center">
        {sources.length} locations available
      </div>
    </>
  );
}
