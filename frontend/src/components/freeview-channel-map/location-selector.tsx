import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LocationSelectorProps {
  locations: string[];
  visibleLocations: string[];
  setVisibleLocations: (locations: string[]) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  visibleLocations,
  setVisibleLocations,
}) => {
  const toggleAllLocations = (checked: boolean) => {
    if (checked) {
      setVisibleLocations([...locations]);
    } else {
      setVisibleLocations([]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-1" size="sm" variant="outline">
          <span>Locations</span>
          {visibleLocations.length !== locations.length && (
            <Badge className="ml-1 text-xs" variant="secondary">
              {visibleLocations.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Locations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          <DropdownMenuCheckboxItem
            checked={visibleLocations.length === locations.length}
            onCheckedChange={toggleAllLocations}
          >
            All Locations
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {locations.map((location) => (
            <DropdownMenuCheckboxItem
              checked={visibleLocations.includes(location)}
              key={location}
              onCheckedChange={(checked) => {
                setVisibleLocations(
                  checked
                    ? [...visibleLocations, location]
                    : visibleLocations.filter((l) => l !== location)
                );
              }}
            >
              {location}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
