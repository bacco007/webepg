"use client";

import { CalendarClock, Check } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getCookie, setCookie } from "@/lib/cookies";
import { detectTimezone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

type Timezone = {
  value: string;
  label: string;
  group: string;
  offset: number;
};

type GroupedTimezones = {
  group: string;
  timezones: Timezone[];
};

const groupTimezones = (data: Timezone[]): GroupedTimezones[] => {
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
};

export function TimezoneSelector() {
  const [groupedTimezones, setGroupedTimezones] = useState<GroupedTimezones[]>(
    []
  );
  const [selectedTimezone, setSelectedTimezone] = useState<Timezone | null>(
    null
  );
  const [browserTimezone, setBrowserTimezone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    const initializeTimezones = async () => {
      try {
        const detectedTimezone = detectTimezone();
        setBrowserTimezone(detectedTimezone);

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
              group,
              label: `${offsetPart} ${timezone.replaceAll("_", " ")}`,
              offset,
              value: timezone,
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
          setExpandedGroups([savedTz.group]);
        } else {
          const browserTz = formattedTimezones.find(
            (tz) => tz.value === detectedTimezone
          );
          const defaultTz = browserTz || formattedTimezones[0];
          setSelectedTimezone(defaultTz);
          setExpandedGroups([defaultTz.group]);
        }
      } catch (_error) {
        setMessage("Error loading timezones. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeTimezones();
  }, []);

  const handleTimezoneSelect = async (timezone: Timezone) => {
    try {
      setSelectedTimezone(timezone);
      await setCookie("userTimezone", timezone.value);
      setMessage("Timezone updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (_error) {
      setMessage("Failed to update timezone. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Label className="font-medium text-sm">Browser Timezone:</Label>
          <span className="text-sm">{browserTimezone}</span>
        </div>
        <div className="space-y-2">
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label className="font-medium text-sm">Browser Timezone:</Label>
        <span className="text-sm">{browserTimezone}</span>
      </div>
      <RadioGroup
        className="space-y-2"
        onValueChange={(value) => {
          const tz = groupedTimezones
            .flatMap((group) => group.timezones)
            .find((t) => t.value === value);
          if (tz) {
            handleTimezoneSelect(tz);
            if (!expandedGroups.includes(tz.group)) {
              setExpandedGroups([...expandedGroups, tz.group]);
            }
          }
        }}
        value={selectedTimezone?.value}
      >
        <Accordion
          className="w-full"
          onValueChange={setExpandedGroups}
          type="multiple"
          value={expandedGroups}
        >
          {groupedTimezones.map((groupData) => (
            <AccordionItem
              className="border-none"
              key={groupData.group}
              value={groupData.group}
            >
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{groupData.group}</span>
                  <span className="text-muted-foreground text-xs">
                    ({groupData.timezones.length} timezones)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 pl-4 sm:grid-cols-2">
                  {groupData.timezones.map((timezone) => (
                    <div
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 transition-colors",
                        selectedTimezone?.value === timezone.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                      key={timezone.value}
                    >
                      <RadioGroupItem
                        className="mt-0.5"
                        id={timezone.value}
                        value={timezone.value}
                      />
                      <Label
                        className="flex flex-1 cursor-pointer items-center justify-between"
                        htmlFor={timezone.value}
                      >
                        <div className="flex min-w-0 items-center space-x-3">
                          <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {timezone.label}
                            </p>
                            <p className="truncate text-muted-foreground text-sm">
                              GMT{timezone.offset >= 0 ? "+" : ""}
                              {timezone.offset / 100}
                            </p>
                          </div>
                        </div>
                        {selectedTimezone?.value === timezone.value && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </RadioGroup>
      {message && (
        <p
          className={cn(
            "text-sm",
            message.includes("success") ? "text-green-600" : "text-red-600"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
