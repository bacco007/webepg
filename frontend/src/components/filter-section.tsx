"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"

import { useDebounce } from "@/hooks/use-debounce"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"

interface FilterSectionProps {
  title: string
  options: string[]
  filters: string[]
  onFilterChange: (value: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
  counts: Record<string, number>
  showSearch?: boolean
  badge?: string
  getDisplayName?: (value: string) => string
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
  badge,
  getDisplayName = (value) => value,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 300)

  // Filter options to only include those with counts > 0 or those already selected
  const availableOptions = options
    .filter((option) => filters.includes(option) || counts[option] > 0)
    .filter((option) => {
      const displayName = getDisplayName(option).toLowerCase()
      return displayName.includes(debouncedSearch.toLowerCase())
    })

  // Calculate total available options for display
  const totalAvailableOptions = options.filter((option) => counts[option] > 0 || filters.includes(option)).length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b">
      <CollapsibleTrigger className="flex justify-between items-center hover:bg-muted/10 px-4 py-3 w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground text-sm">{title}</span>
          {badge && (
            <Badge variant="outline" className="font-normal text-xs">
              {badge}
            </Badge>
          )}
          {filters.length > 0 && (
            <Badge variant="secondary" className="font-normal text-xs">
              {filters.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{totalAvailableOptions}</span>
          {isOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="slide-in-from-top-2 animate-in duration-200">
        <div className="px-4 pb-3">
          {showSearch && (
            <div className="relative mb-2">
              <Search className="top-2.5 left-2 absolute size-4 text-muted-foreground" />
              <Input
                placeholder={`Search`}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          )}
          <div className="space-y-1 pr-1 max-h-[200px] overflow-y-auto">
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <label key={option} className="flex justify-between items-center py-1 cursor-pointer">
                  <div className="flex items-center">
                    <Checkbox
                      checked={filters.includes(option)}
                      onCheckedChange={() => onFilterChange(option)}
                      className="mr-2"
                    />
                    <span className="text-sm">{getDisplayName(option)}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{counts[option]}</span>
                </label>
              ))
            ) : (
              <div className="py-2 text-muted-foreground text-sm text-center">No options available</div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
