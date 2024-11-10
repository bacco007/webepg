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

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
}

interface GroupedSources {
  group: string;
  subgroups: {
    name: string;
    sources: Source[];
  }[];
}

export default function CollapsibleSourceMenu() {
  const [sources, setSources] = React.useState<GroupedSources[]>([]);
  const [selectedSource, setSelectedSource] = React.useState<Source | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const data: Source[] = await response.json();
        const groupedSources = groupSources(data);
        setSources(groupedSources);

        const savedSourceId = await getCookie('xmltvdatasource');
        const savedSource = data.find((source) => source.id === savedSourceId);
        if (savedSource) {
          setSelectedSource(savedSource);
        } else if (data.length > 0) {
          setSelectedSource(data[0]);
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
        setError('Failed to load sources. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, []);

  const groupSources = (data: Source[]): GroupedSources[] => {
    const groupMap = new Map<string, Map<string, Source[]>>();

    data.forEach((source) => {
      if (!groupMap.has(source.group)) {
        groupMap.set(source.group, new Map());
      }
      const subgroupMap = groupMap.get(source.group)!;
      if (!subgroupMap.has(source.subgroup)) {
        subgroupMap.set(source.subgroup, []);
      }
      subgroupMap.get(source.subgroup)!.push(source);
    });

    return Array.from(groupMap.entries())
      .map(([group, subgroupMap]) => ({
        group,
        subgroups: Array.from(subgroupMap.entries())
          .map(([name, sources]) => ({
            name,
            sources: sources.sort((a, b) => a.location.localeCompare(b.location)),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.group.localeCompare(b.group));
  };

  const handleSourceSelect = async (source: Source) => {
    setSelectedSource(source);
    await setCookie('xmltvdatasource', source.id);
    window.location.reload();
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-xs">Select Data Source</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="py-1 text-xs">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading sources...
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  if (error) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-xs">Select Data Source</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="py-1 text-xs text-red-500">{error}</SidebarMenuButton>
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
            Select Guide
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {sources.map((groupData) => (
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
                    {groupData.subgroups.map((subgroup) => (
                      <SidebarMenuItem key={subgroup.name}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton className="justify-between py-0.5 pl-4 text-xs">
                              {subgroup.name}
                              <MoreHorizontal className="size-4" />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            className="min-w-48 rounded-lg"
                          >
                            {subgroup.sources.map((source) => (
                              <DropdownMenuItem
                                key={source.id}
                                onSelect={() => handleSourceSelect(source)}
                              >
                                <span
                                  className={cn(selectedSource?.id === source.id && 'font-medium')}
                                >
                                  {source.location}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
