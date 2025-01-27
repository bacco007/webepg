'use client';

import * as React from 'react';
import { CalendarClock, Check, ChevronDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCookie, setCookie } from '@/lib/cookies';
import { cn } from '@/lib/utils';

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
  const [groupedTimezones, setGroupedTimezones] = React.useState<
    GroupedTimezones[]
  >([]);
  const [selectedTimezone, setSelectedTimezone] =
    React.useState<Timezone | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initializeTimezones = async () => {
      try {
        const formattedTimezones = Intl.supportedValuesOf('timeZone')
          .map(timezone => {
            const formatter = new Intl.DateTimeFormat('en', {
              timeZone: timezone,
              timeZoneName: 'longOffset',
            });
            const parts = formatter.formatToParts(new Date());
            const offsetPart =
              parts.find(part => part.type === 'timeZoneName')?.value || '';
            const offset =
              Number.parseInt(offsetPart.replace('GMT', '').replace(':', '')) ||
              0;
            const group = timezone.split('/')[0];

            return {
              value: timezone,
              label: `${offsetPart} ${timezone.replaceAll('_', ' ')}`,
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

        const savedTimezone = await getCookie('userTimezone');
        const savedTz = formattedTimezones.find(
          tz => tz.value === savedTimezone,
        );
        if (savedTz) {
          setSelectedTimezone(savedTz);
        } else {
          setSelectedTimezone(formattedTimezones[0]);
        }
      } catch (error) {
        console.error('Error initializing timezones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTimezones();
  }, []);

  const groupTimezones = (data: Timezone[]): GroupedTimezones[] => {
    const groupMap = new Map<string, Timezone[]>();

    data.forEach(timezone => {
      if (!groupMap.has(timezone.group)) {
        groupMap.set(timezone.group, []);
      }
      groupMap.get(timezone.group)!.push(timezone);
    });

    return [...groupMap.entries()]
      .map(([group, timezones]) => ({
        group,
        timezones: timezones.sort(
          (
            a: { offset: number; value: string },
            b: { offset: number; value: any },
          ) => {
            if (a.offset !== b.offset) {
              return a.offset - b.offset;
            }
            return a.value.localeCompare(b.value);
          },
        ),
      }))
      .sort((a, b) => a.group.localeCompare(b.group));
  };

  const handleTimezoneSelect = async (timezone: Timezone) => {
    setSelectedTimezone(timezone);
    await setCookie('userTimezone', timezone.value);
    globalThis.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-start">
          {isLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CalendarClock className="mr-2 size-4" />
          )}
          {selectedTimezone ? selectedTimezone.label : 'Select Timezone'}
          <ChevronDown className="ml-auto size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[300px] w-[350px] overflow-y-auto">
        <DropdownMenuLabel>Select Timezone</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groupedTimezones.map(groupData => (
          <DropdownMenuGroup key={groupData.group}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{groupData.group}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {groupData.timezones.map(timezone => (
                  <DropdownMenuItem
                    key={timezone.value}
                    onSelect={() => handleTimezoneSelect(timezone)}
                  >
                    <span
                      className={cn(
                        'grow truncate',
                        selectedTimezone?.value === timezone.value &&
                          'font-medium',
                      )}
                    >
                      {timezone.label}
                    </span>
                    {selectedTimezone?.value === timezone.value && (
                      <Check className="ml-2 size-4 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
