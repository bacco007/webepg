'use client';

import * as React from 'react';
import { CalendarClock, ChevronRight, Loader2 } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
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

export default function CollapsibleTimezoneMenu() {
  const [groupedTimezones, setGroupedTimezones] = React.useState<
    GroupedTimezones[]
  >([]);
  const [selectedTimezone, setSelectedTimezone] =
    React.useState<Timezone | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    {},
  );

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
              label: `(${offsetPart})\n${timezone.replaceAll('_', ' ')}`,
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
        timezones: timezones.sort((a, b) => {
          if (a.offset !== b.offset) {
            return a.offset - b.offset;
          }
          return a.value.localeCompare(b.value);
        }),
      }))
      .sort((a, b) => a.group.localeCompare(b.group));
  };

  const handleTimezoneSelect = async (timezone: Timezone) => {
    setSelectedTimezone(timezone);
    await setCookie('userTimezone', timezone.value);
    globalThis.location.reload();
  };

  const toggleGroup = (group: string) => {
    setOpenGroups(previous => ({ ...previous, [group]: !previous[group] }));
  };

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-xs">
          Select Timezone
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="py-1 text-xs">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading timezones...
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel
          asChild
          className="group/label w-full text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              <CalendarClock className="mr-2 size-4" />
              Select Timezone
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {groupedTimezones.map(groupData => (
              <Collapsible
                key={groupData.group}
                open={openGroups[groupData.group]}
                onOpenChange={() => toggleGroup(groupData.group)}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="justify-between py-1 text-sm">
                      {groupData.group}
                      <ChevronRight
                        className={cn(
                          'size-4 transition-transform duration-200',
                          openGroups[groupData.group] && 'rotate-90',
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {groupData.timezones.map(timezone => (
                      <SidebarMenuItem key={timezone.value}>
                        <SidebarMenuButton
                          className="py-0.5 pl-4 text-xs"
                          onClick={() => handleTimezoneSelect(timezone)}
                        >
                          <span
                            className={cn(
                              selectedTimezone?.value === timezone.value &&
                                'font-medium',
                            )}
                          >
                            {timezone.label}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
