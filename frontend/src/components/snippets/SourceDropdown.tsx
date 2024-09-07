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

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface SourceDropdownProps extends PopoverTriggerProps {}

export function SourceDropdown({ className }: SourceDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [sources, setSources] = React.useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = React.useState<Source | null>(null);

  React.useEffect(() => {
    fetch('/api/py/sources')
      .then((response) => response.json())
      .then((data) => {
        setSources(data);
        const savedSourceId = localStorage.getItem('xmltvdatasource');
        const savedSource = data.find(
          (source: { id: string | null }) => source.id === savedSourceId
        );
        if (savedSource) {
          setSelectedSource(savedSource);
        } else if (data.length > 0) {
          setSelectedSource(data[0]);
        }
      })
      .catch((error) => console.error('Error fetching sources:', error));
  }, []);

  const handleSourceSelect = (source: Source) => {
    setSelectedSource(source);
    localStorage.setItem('xmltvdatasource', source.id);
    setOpen(false);
    // Refresh the page
    window.location.reload();
  };

  const getGroupLabel = (source: Source) => {
    return source.subgroup ? `${source.group} - ${source.subgroup}` : source.group;
  };

  const groupedSources = React.useMemo(() => {
    const groups = Array.from(new Set(sources.map(getGroupLabel))).sort((a, b) =>
      a.localeCompare(b)
    );
    return groups.map((groupLabel) => ({
      label: groupLabel,
      sources: sources.filter((source) => getGroupLabel(source) === groupLabel),
    }));
  }, [sources]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a source"
          className={cn(
            'w-[300px] justify-between border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white',
            className
          )}
        >
          {selectedSource
            ? `${selectedSource.location} (${selectedSource.group})`
            : 'Select source...'}
          <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] border-gray-700 bg-gray-900 p-0">
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
