import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type FilterSectionProps = {
  title: string;
  options: string[];
  filters: string[];
  onFilterChange: (value: string) => void;
  counts: Record<string, number>;
};

export function FilterSection({
  title,
  options,
  filters,
  onFilterChange,
  counts,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter options to only include those with counts > 0 or those already selected
  const availableOptions = useMemo(() => {
    return options.filter(
      (option) =>
        filters.includes(option) || // Always show selected options
        counts[option] > 0 // Only show options with counts > 0
    );
  }, [options, counts, filters]);

  // Calculate total available options for display
  const totalAvailableOptions = useMemo(
    () =>
      options.filter((option) => counts[option] > 0 || filters.includes(option))
        .length,
    [options, counts, filters]
  );

  return (
    <div className="border-b">
      <div
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {totalAvailableOptions}
          </span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-3">
          <div className="thin-scrollbar max-h-[200px] space-y-1 overflow-y-auto pr-1">
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <label
                  className="flex cursor-pointer items-center justify-between py-1"
                  key={option}
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={filters.includes(option)}
                      className="mr-2"
                      onCheckedChange={() => onFilterChange(option)}
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {counts[option]}
                  </span>
                </label>
              ))
            ) : (
              <div className="py-2 text-center text-muted-foreground text-sm">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
