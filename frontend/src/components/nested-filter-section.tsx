import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type NestedFilterSectionProps = {
  data: Record<string, { count: number; subgroups: Record<string, number> }>;
  selectedGroups: string[];
  selectedSubgroups: string[];
  onGroupToggle: (group: string) => void;
  onSubgroupToggle: (group: string, subgroup: string) => void;
  title: string;
};

export function NestedFilterSection({
  data,
  selectedGroups,
  selectedSubgroups,
  onGroupToggle,
  onSubgroupToggle,
  title,
}: NestedFilterSectionProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const handleGroupClick = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="border-b last:border-b-0">
      <div className="flex w-full items-center justify-between px-4 py-3">
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="px-2 pb-3">
        <div className="thin-scrollbar max-h-[300px] space-y-1 overflow-y-auto pr-1">
          {Object.entries(data).length === 0 && (
            <div className="py-2 text-center text-muted-foreground text-sm">
              No options available
            </div>
          )}
          {Object.entries(data).map(([group, { count, subgroups }]) => (
            <div key={group}>
              <button
                aria-expanded={!!openGroups[group]}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left hover:bg-muted/10",
                  selectedGroups.includes(group) && "bg-muted/20"
                )}
                onClick={() => handleGroupClick(group)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleGroupClick(group);
                  }
                }}
                tabIndex={0}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label={`Toggle group ${group}`}
                    checked={selectedGroups.includes(group)}
                    onCheckedChange={() => onGroupToggle(group)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-medium text-sm">{group}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{count}</span>
                  {Object.keys(subgroups).length > 0 &&
                    (openGroups[group] ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ))}
                </div>
              </button>
              {openGroups[group] && Object.keys(subgroups).length > 0 && (
                <div className="ml-6 border-muted/30 border-l pl-3">
                  {Object.entries(subgroups).map(([subgroup, subCount]) => (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-between py-1",
                        selectedSubgroups.includes(subgroup) &&
                          "rounded bg-muted/10"
                      )}
                      key={subgroup}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          aria-label={`Toggle subgroup ${subgroup}`}
                          checked={selectedSubgroups.includes(subgroup)}
                          onCheckedChange={() =>
                            onSubgroupToggle(group, subgroup)
                          }
                        />
                        <span className="ml-2 text-sm">{subgroup}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {subCount}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NestedFilterSection;
