'use client';

import * as React from 'react';
import { ChevronRight, Loader2, MoreHorizontal } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
}

interface GroupedTimezones {
  group: string;
  timezones: Timezone[];
}

const timezones: Timezone[] = [
  {
    value: 'America/New_York',
    label: 'Eastern Standard Time (EST)',
    group: 'North America',
  },
  {
    value: 'America/Chicago',
    label: 'Central Standard Time (CST)',
    group: 'North America',
  },
  {
    value: 'America/Denver',
    label: 'Mountain Standard Time (MST)',
    group: 'North America',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Standard Time (PST)',
    group: 'North America',
  },
  {
    value: 'America/Anchorage',
    label: 'Alaska Standard Time (AKST)',
    group: 'North America',
  },
  {
    value: 'Pacific/Honolulu',
    label: 'Hawaii Standard Time (HST)',
    group: 'North America',
  },
  {
    value: 'Europe/London',
    label: 'Greenwich Mean Time (GMT)',
    group: 'Europe & Africa',
  },
  {
    value: 'Europe/Paris',
    label: 'Central European Time (CET)',
    group: 'Europe & Africa',
  },
  {
    value: 'Europe/Kiev',
    label: 'Eastern European Time (EET)',
    group: 'Europe & Africa',
  },
  {
    value: 'Europe/Lisbon',
    label: 'Western European Summer Time (WEST)',
    group: 'Europe & Africa',
  },
  {
    value: 'Africa/Johannesburg',
    label: 'Central Africa Time (CAT)',
    group: 'Europe & Africa',
  },
  {
    value: 'Africa/Nairobi',
    label: 'East Africa Time (EAT)',
    group: 'Europe & Africa',
  },
  { value: 'Asia/Dubai', label: 'Gulf', group: 'Asia' },
  { value: 'Europe/Moscow', label: 'Moscow', group: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India', group: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China', group: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Japan', group: 'Asia' },
  { value: 'Asia/Seoul', label: 'Korea', group: 'Asia' },
  {
    value: 'Asia/Jakarta',
    label: 'Indonesia WIB',
    group: 'Asia',
  },
  {
    value: 'Asia/Makassar',
    label: 'Indonesia WITA',
    group: 'Asia',
  },
  {
    value: 'Asia/Jayapura',
    label: 'Indonesia WIT',
    group: 'Asia',
  },
  {
    value: 'Asia/Dili',
    label: 'East Timor',
    group: 'Asia',
  },
  {
    value: 'Australia/Perth',
    label: 'Australia WST',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Adelaide',
    label: 'Australia CST (SA)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Darwin',
    label: 'Australia CST (NT)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Sydney',
    label: 'Australia EST (NSW/VIC/Tas)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Brisbane',
    label: 'Australia EST (Qld)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Norfolk',
    label: 'Australia Norfolk Island',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Lord_Howe',
    label: 'Australia Lord Howe Island',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Eucla',
    label: 'Australia CWT',
    group: 'Australia & Pacific',
  },
  {
    value: 'Indian/Cocos',
    label: 'Cocos/Keeling Island',
    group: 'Australia & Pacific',
  },
  {
    value: 'Indian/Christmas',
    label: 'Christmas Island',
    group: 'Australia & Pacific',
  },
  {
    value: 'Pacific/Guadalcanal',
    label: 'Solomon Island',
    group: 'Australia & Pacific',
  },
  {
    value: 'Pacific/Auckland',
    label: 'New Zealand',
    group: 'Australia & Pacific',
  },
  {
    value: 'Pacific/Fiji',
    label: 'Fiji',
    group: 'Australia & Pacific',
  },
  {
    value: 'Pacific/Tongatapu',
    label: 'Tonga',
    group: 'Australia & Pacific',
  },
  {
    value: 'America/Argentina/Buenos_Aires',
    label: 'Argentina)',
    group: 'South America',
  },
  {
    value: 'America/La_Paz',
    label: 'Bolivia',
    group: 'South America',
  },
  {
    value: 'America/Sao_Paulo',
    label: 'Brasilia',
    group: 'South America',
  },
  {
    value: 'America/Santiago',
    label: 'Chile',
    group: 'South America',
  },
];

export default function CollapsibleTimezoneMenu() {
  const [groupedTimezones, setGroupedTimezones] = React.useState<GroupedTimezones[]>([]);
  const [selectedTimezone, setSelectedTimezone] = React.useState<Timezone | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const initializeTimezones = async () => {
      try {
        const groupedTz = groupTimezones(timezones);
        setGroupedTimezones(groupedTz);

        const savedTimezone = await getCookie('userTimezone');
        const savedTz = timezones.find((tz) => tz.value === savedTimezone);
        if (savedTz) {
          setSelectedTimezone(savedTz);
        } else {
          // Default to the first timezone if no saved timezone
          setSelectedTimezone(timezones[0]);
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

    data.forEach((timezone) => {
      if (!groupMap.has(timezone.group)) {
        groupMap.set(timezone.group, []);
      }
      groupMap.get(timezone.group)!.push(timezone);
    });

    return Array.from(groupMap.entries())
      .map(([group, timezones]) => ({
        group,
        timezones: timezones.sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .sort((a, b) => a.group.localeCompare(b.group));
  };

  const handleTimezoneSelect = async (timezone: Timezone) => {
    setSelectedTimezone(timezone);
    await setCookie('userTimezone', timezone.value);
    window.location.reload();
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-xs">Select Timezone</SidebarGroupLabel>
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
          className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
        >
          <CollapsibleTrigger>
            Select Timezone
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {groupedTimezones.map((groupData) => (
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
                          openGroups[groupData.group] && 'rotate-90'
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {groupData.timezones.map((timezone) => (
                      <SidebarMenuItem key={timezone.value}>
                        <SidebarMenuButton
                          className="py-0.5 pl-4 text-xs"
                          onClick={() => handleTimezoneSelect(timezone)}
                        >
                          <span
                            className={cn(
                              selectedTimezone?.value === timezone.value && 'font-medium'
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
