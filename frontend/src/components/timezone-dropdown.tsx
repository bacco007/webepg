"use client";

import {
  CalendarClock,
  Check,
  ChevronDown,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getCookie, setCookie } from "@/lib/cookies";
import { detectTimezone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

interface Timezone {
  value: string;
  label: string;
  group: string;
  offset: number;
}

interface GroupedTimezones {
  group: string;
  timezones: Timezone[];
}

export function TimezoneDropdown() {
  const [groupedTimezones, setGroupedTimezones] = useState<GroupedTimezones[]>(
    []
  );
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupTimezones = useCallback((data: Timezone[]): GroupedTimezones[] => {
    const groupMap = new Map<string, Timezone[]>();

    for (const timezone of data) {
      if (!groupMap.has(timezone.group)) {
        groupMap.set(timezone.group, []);
      }
      const group = groupMap.get(timezone.group);
      if (group) {
        group.push(timezone);
      }
    }

    return [...groupMap.entries()]
      .map(([group, timezones]) => ({
        group,
        timezones: timezones.sort((a, b) => {
          if (a.offset !== b.offset) {
            return a.offset - b.offset;
          }
          return a.value.localeCompare(b.value);
        }),
      }))
      .sort((a, b) => a.group.localeCompare(b.group));
  }, []);

  useEffect(() => {
    const initializeTimezones = async () => {
      try {
        setError(null);
        const detectedTimezone = detectTimezone();
        const formattedTimezones = Intl.supportedValuesOf("timeZone")
          .map((timezone) => {
            const formatter = new Intl.DateTimeFormat("en", {
              timeZone: timezone,
              timeZoneName: "longOffset",
            });
            const parts = formatter.formatToParts(new Date());
            const offsetPart =
              parts.find((part) => part.type === "timeZoneName")?.value || "";
            const offset =
              Number.parseInt(
                offsetPart.replace("GMT", "").replace(":", ""),
                10
              ) || 0;
            const group = timezone.split("/")[0];

            return {
              value: timezone,
              label: `${offsetPart} ${timezone.replaceAll("_", " ")}`,
              group,
              offset,
            };
          })
          .sort((a, b) => {
            if (a.offset !== b.offset) {
              return a.offset - b.offset;
            }
            return a.value.localeCompare(b.value);
          });

        const groupedTz = groupTimezones(formattedTimezones);
        setGroupedTimezones(groupedTz);

        const savedTimezone = await getCookie("userTimezone");
        const savedTz = formattedTimezones.find(
          (tz) => tz.value === savedTimezone
        );
        if (savedTz) {
          setSelectedTimezone(savedTz);
        } else {
          const browserTz = formattedTimezones.find(
            (tz) => tz.value === detectedTimezone
          );
          setSelectedTimezone(browserTz || formattedTimezones[0]);
        }
      } catch (_error) {
        setError("Failed to load timezones. Please try again.");
        toast.error("Failed to load timezones");
      } finally {
        setIsLoading(false);
      }
    };

    initializeTimezones();
  }, [groupTimezones]);

  const handleTimezoneSelect = async (timezone: Timezone) => {
    try {
      setSelectedTimezone(timezone);
      await setCookie("userTimezone", timezone.value);
      toast.success("Timezone updated successfully");
      setIsOpen(false);
      globalThis.location.reload();
    } catch (_error) {
      toast.error("Failed to update timezone");
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery) {
      return groupedTimezones;
    }

    const query = searchQuery.toLowerCase();
    return groupedTimezones
      .map((group) => ({
        ...group,
        timezones: group.timezones.filter(
          (tz) =>
            tz.label.toLowerCase().includes(query) ||
            tz.group.toLowerCase().includes(query) ||
            tz.value.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.timezones.length > 0);
  }, [groupedTimezones, searchQuery]);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className="justify-start"
          disabled={isLoading || !!error}
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CalendarClock className="mr-2 size-4" />
          )}
          <span className="truncate">
            {selectedTimezone ? selectedTimezone.label : "Select Timezone"}
          </span>
          <ChevronDown className="ml-auto size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[350px] p-0">
        <div className="flex items-center px-3 pt-3 pb-2">
          <Search className="mr-2 size-4 shrink-0 opacity-50" />
          <Input
            className="h-8"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timezones..."
            value={searchQuery}
          />
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {(() => {
            if (error) {
              return (
                <div className="p-4 text-center text-destructive text-sm">
                  {error}
                </div>
              );
            }

            if (filteredGroups.length === 0) {
              return (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No timezones found
                </div>
              );
            }

            return filteredGroups.map((groupData) => (
              <DropdownMenuGroup key={groupData.group}>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="flex items-center justify-between">
                      <span>{groupData.group}&nbsp;</span>
                      <span className="text-muted-foreground text-xs">
                        ({groupData.timezones.length})
                      </span>
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {groupData.timezones.map((timezone) => (
                      <DropdownMenuItem
                        className="flex items-center justify-between"
                        key={timezone.value}
                        onSelect={() => handleTimezoneSelect(timezone)}
                      >
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "truncate",
                              selectedTimezone?.value === timezone.value &&
                                "font-medium"
                            )}
                          >
                            {timezone.label}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            GMT{timezone.offset >= 0 ? "+" : ""}
                            {timezone.offset / 100}
                          </span>
                        </div>
                        {selectedTimezone?.value === timezone.value && (
                          <Check className="ml-2 size-4 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            ));
          })()}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
