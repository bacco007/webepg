import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

type NetworkHeaderProps = {
  network: string;
  channelCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  visibleLocationsCount: number;
};

export function NetworkHeader({
  network,
  channelCount,
  isCollapsed,
  onToggle,
  visibleLocationsCount,
}: NetworkHeaderProps) {
  return (
    <TableRow
      className="cursor-pointer bg-muted/50 hover:bg-muted/70"
      onClick={onToggle}
    >
      <TableCell
        className="sticky left-0 z-10 border bg-muted/50 font-bold"
        colSpan={1 + visibleLocationsCount}
      >
        <div className="flex items-center justify-between">
          <span>{network}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{channelCount}</Badge>
            <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
