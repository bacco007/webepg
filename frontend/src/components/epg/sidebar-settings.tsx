"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface SidebarSettingsProps {
  sortBy: string
  onSortByChange: (value: string) => void
  groupBy: string
  onGroupByChange: (value: string) => void
  displayName: string
  onDisplayNameChange: (value: string) => void
}

const SORT_OPTIONS = [
  { value: "channelNumber", label: "Channel Number" },
  { value: "channelName", label: "Channel Name" },
  { value: "networkName", label: "Network Name" },
]

const GROUP_OPTIONS = [
  { value: "none", label: "None" },
  { value: "network", label: "Network" },
  { value: "category", label: "Category" },
]

const DISPLAY_NAME_OPTIONS = [
  { value: "clean", label: "Clean" },
  { value: "real", label: "Real" },
  { value: "location", label: "Location" },
]

export function SidebarSettings({
  sortBy,
  onSortByChange,
  groupBy,
  onGroupByChange,
  displayName,
  onDisplayNameChange,
}: SidebarSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b">
      <CollapsibleTrigger className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">Display Settings</span>
          <Badge variant="outline" className="font-normal text-xs">
            View
          </Badge>
        </div>
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="size-4 text-muted-foreground rotate-180 transition-transform" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="slide-in-from-top-2 animate-in duration-200">
        <div className="space-y-4 px-4 pb-3">
          {/* Sort by */}
          <div className="space-y-2">
            <Label htmlFor="sort-by" className="text-sm">
              Sort by
            </Label>
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger id="sort-by" className="w-full">
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
            <Label htmlFor="group-by" className="text-sm">
              Group by
            </Label>
            <Select value={groupBy} onValueChange={onGroupByChange}>
              <SelectTrigger id="group-by" className="w-full">
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
            <Label htmlFor="display-name" className="text-sm">
              Display Name
            </Label>
            <Select value={displayName} onValueChange={onDisplayNameChange}>
              <SelectTrigger id="display-name" className="w-full">
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
  )
}
