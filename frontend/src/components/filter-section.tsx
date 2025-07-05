"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterSectionProps {
  title: string;
  options: string[];
  filters: string[];
  onFilterChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  counts: Record<string, number>;
  showSearch?: boolean;
  children?: React.ReactNode;
}

export function FilterSection({
  title,
  options,
  filters,
  onFilterChange,
  searchValue,
  onSearchChange,
  counts,
  showSearch = false,
  children,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Collapsible className="border-b" onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3">
        {showSearch && (
          <div className="mb-3">
            <Input
              className="h-8 text-sm"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              type="text"
              value={searchValue}
            />
          </div>
        )}
        {children ? (
          <div>{children}</div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {filteredOptions.map((option) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/10"
                  key={option}
                >
                  <input
                    checked={filters.includes(option)}
                    className="size-4 rounded border-input"
                    onChange={() => onFilterChange(option)}
                    type="checkbox"
                  />
                  <span className="flex-1">{option}</span>
                  <span className="text-muted-foreground text-xs">
                    {counts[option] || 0}
                  </span>
                </label>
              ))}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
