'use client';

import * as React from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Globe } from 'lucide-react';

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

interface Timezone {
  value: string;
  label: string;
  group: string;
}

const timezones: Timezone[] = [
  { value: 'America/New_York', label: 'Eastern Standard Time (EST)', group: 'North America' },
  { value: 'America/Chicago', label: 'Central Standard Time (CST)', group: 'North America' },
  { value: 'America/Denver', label: 'Mountain Standard Time (MST)', group: 'North America' },
  { value: 'America/Los_Angeles', label: 'Pacific Standard Time (PST)', group: 'North America' },
  { value: 'America/Anchorage', label: 'Alaska Standard Time (AKST)', group: 'North America' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Standard Time (HST)', group: 'North America' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', group: 'Europe & Africa' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', group: 'Europe & Africa' },
  { value: 'Europe/Kiev', label: 'Eastern European Time (EET)', group: 'Europe & Africa' },
  {
    value: 'Europe/Lisbon',
    label: 'Western European Summer Time (WEST)',
    group: 'Europe & Africa',
  },
  { value: 'Africa/Johannesburg', label: 'Central Africa Time (CAT)', group: 'Europe & Africa' },
  { value: 'Africa/Nairobi', label: 'East Africa Time (EAT)', group: 'Europe & Africa' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', group: 'Asia' },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)', group: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', group: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', group: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', group: 'Asia' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', group: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Indonesia Western Standard Time (WIB)', group: 'Asia' },
  { value: 'Asia/Makassar', label: 'Indonesia Central Standard Time (WITA)', group: 'Asia' },
  { value: 'Asia/Jayapura', label: 'Indonesia Eastern Standard Time (WIT)', group: 'Asia' },
  {
    value: 'Australia/Perth',
    label: 'Aus Western Standard Time (AWST)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Adelaide',
    label: 'Aus Central Standard Time (ACST)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Sydney',
    label: 'Aus Eastern Standard Time (AEST)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Australia/Brisbane',
    label: 'Aus Eastern Standard Time - Brisbane (AEST)',
    group: 'Australia & Pacific',
  },
  {
    value: 'Pacific/Auckland',
    label: 'New Zealand Standard Time (NZST)',
    group: 'Australia & Pacific',
  },
  { value: 'Pacific/Fiji', label: 'Fiji Time (FJT)', group: 'Australia & Pacific' },
  { value: 'Pacific/Tongatapu', label: 'Tonga Time (TOT)', group: 'Australia & Pacific' },
  {
    value: 'America/Argentina/Buenos_Aires',
    label: 'Argentina Time (ART)',
    group: 'South America',
  },
  { value: 'America/La_Paz', label: 'Bolivia Time (BOT)', group: 'South America' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (BRT)', group: 'South America' },
  { value: 'America/Santiago', label: 'Chile Standard Time (CLT)', group: 'South America' },
];

interface TimezoneSelectorProperties {
  value: string;
  onChange: (timezone: string) => void;
}

export default function TimezoneSelector({ value, onChange }: TimezoneSelectorProperties) {
  const [open, setOpen] = React.useState(false);

  const selectedTimezone = timezones.find((tz) => tz.value === value);

  const groupedTimezones = React.useMemo(() => {
    const groupSet = new Set(timezones.map((tz) => tz.group));
    const groups = Array.from(groupSet).sort();
    return groups.map((group) => ({
      group,
      timezones: timezones.filter((tz) => tz.group === group),
    }));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a timezone"
          className={cn(
            'w-full justify-between border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white sm:w-[300px]'
          )}
        >
          <Globe className="mr-2 size-4" />
          {selectedTimezone ? selectedTimezone.label : 'Select timezone...'}
          <CaretSortIcon className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-screen max-w-[300px] border-gray-700 bg-gray-900 p-0 sm:w-[300px] md:w-[350px] lg:w-[500px] xl:w-[600px]">
        <Command className="bg-gray-900">
          <CommandInput placeholder="Search timezone..." className="text-gray-300" />
          <CommandList>
            <CommandEmpty className="text-gray-400">No timezone found.</CommandEmpty>
            {groupedTimezones.map(({ group, timezones }) => (
              <CommandGroup
                key={group}
                heading={group}
                className="text-base font-medium text-gray-100"
              >
                {timezones.map((timezone) => (
                  <CommandItem
                    key={timezone.value}
                    onSelect={() => {
                      onChange(timezone.value);
                      setOpen(false);
                    }}
                    className="text-sm text-gray-300 hover:bg-gray-800"
                  >
                    <span>{timezone.label}</span>
                    <CheckIcon
                      className={cn(
                        'ml-auto size-4',
                        value === timezone.value ? 'opacity-100' : 'opacity-0'
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
