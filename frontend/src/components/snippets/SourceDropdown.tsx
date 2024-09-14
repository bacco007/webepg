'use client';

import * as React from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Source {
  id: string;
  group: string;
  subgroup: string;
  location: string;
  url: string;
}

interface GroupedSources {
  label: string;
  sources: Source[];
}

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface SourceDropdownProps extends PopoverTriggerProps {}

export default function SourceDropdown({ className }: SourceDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [sources, setSources] = React.useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = React.useState<Source | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const data: Source[] = await response.json();
        setSources(data);
        const savedSourceId = localStorage.getItem('xmltvdatasource');
        const savedSource = data.find((source) => source.id === savedSourceId);
        if (savedSource) {
          setSelectedSource(savedSource);
        } else if (data.length > 0) {
          setSelectedSource(data[0]);
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
        setError('Failed to load sources. Please try again later.');
      }
    };

    fetchSources();
  }, []);

  const handleSourceSelect = (source: Source) => {
    setSelectedSource(source);
    localStorage.setItem('xmltvdatasource', source.id);
    setOpen(false);
    window.location.reload();
  };

  const getGroupLabel = (source: Source) => {
    return source.subgroup ? `${source.group} - ${source.subgroup}` : source.group;
  };

  const groupedSources = React.useMemo<GroupedSources[]>(() => {
    const groupMap = new Map<string, Source[]>();
    sources.forEach((source) => {
      const label = getGroupLabel(source);
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
      }
      groupMap.get(label)!.push(source);
    });
    return Array.from(groupMap.entries())
      .map(([label, sources]) => ({
        label,
        sources: sources.sort((a, b) => a.location.localeCompare(b.location)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sources]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a source"
          className={cn(
            'w-full justify-between border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white sm:w-[300px]',
            className
          )}
        >
          {selectedSource
            ? `${selectedSource.location} (${selectedSource.group})`
            : 'Select source...'}
          <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-screen max-w-[300px] border-gray-700 bg-gray-900 p-0 sm:w-[300px] md:w-[350px] lg:w-[400px] xl:w-[450px]">
        <Command className="bg-gray-900">
          <CommandInput placeholder="Search source..." className="text-gray-300" />
          <CommandList>
            <CommandEmpty className="text-gray-400">No source found.</CommandEmpty>
            {groupedSources.map(({ label, sources }) => (
              <CommandGroup
                key={label}
                heading={label}
                className="text-base font-medium text-gray-100"
              >
                {sources.map((source) => (
                  <CommandItem
                    key={source.id}
                    onSelect={() => handleSourceSelect(source)}
                    className="text-sm text-gray-300 hover:bg-gray-800"
                  >
                    <span className="text-xs">{source.location}</span>
                    <CheckIcon
                      className={cn(
                        'ml-auto size-4',
                        selectedSource?.id === source.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
