"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SidebarSettingsProps {
  sortBy: string;
  onSortByChange: (value: string) => void;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: "channelNumber", label: "Channel Number" },
  { value: "channelName", label: "Channel Name" },
  { value: "networkName", label: "Network Name" },
];

const GROUP_OPTIONS = [
  { value: "none", label: "None" },
  { value: "network", label: "Network" },
  { value: "category", label: "Category" },
];

const DISPLAY_NAME_OPTIONS = [
  { value: "clean", label: "Clean" },
  { value: "real", label: "Real" },
  { value: "location", label: "Location" },
];

export function SidebarSettings({
  sortBy,
  onSortByChange,
  groupBy,
  onGroupByChange,
  displayName,
  onDisplayNameChange,
}: SidebarSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible className="border-b" onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">
            Display Settings
          </span>
          <Badge className="font-normal text-xs" variant="outline">
            View
          </Badge>
        </div>
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="size-4 rotate-180 text-muted-foreground transition-transform" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="slide-in-from-top-2 animate-in duration-200">
        <div className="space-y-4 px-4 pb-3">
          {/* Sort by */}
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="sort-by">
              Sort by
            </Label>
            <Select onValueChange={onSortByChange} value={sortBy}>
              <SelectTrigger className="w-full" id="sort-by">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group by */}
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="group-by">
              Group by
            </Label>
            <Select onValueChange={onGroupByChange} value={groupBy}>
              <SelectTrigger className="w-full" id="group-by">
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="display-name">
              Display Name
            </Label>
            <Select onValueChange={onDisplayNameChange} value={displayName}>
              <SelectTrigger className="w-full" id="display-name">
                <SelectValue placeholder="Select name format" />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_NAME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
