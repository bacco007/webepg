import { Globe } from 'lucide-react';
import React from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export default function Component({ value, onChange }: TimezoneSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[280px]">
        <Globe className="mr-2 size-4" />
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="America/New_York">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="America/Chicago">Central Standard Time (CST)</SelectItem>
          <SelectItem value="America/Denver">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="America/Los_Angeles">Pacific Standard Time (PST)</SelectItem>
          <SelectItem value="America/Anchorage">Alaska Standard Time (AKST)</SelectItem>
          <SelectItem value="Pacific/Honolulu">Hawaii Standard Time (HST)</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
          <SelectItem value="Europe/Kiev">Eastern European Time (EET)</SelectItem>
          <SelectItem value="Europe/Lisbon">Western European Summer Time (WEST)</SelectItem>
          <SelectItem value="Africa/Johannesburg">Central Africa Time (CAT)</SelectItem>
          <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="Asia/Dubai">Gulf Standard Time (GST)</SelectItem>
          <SelectItem value="Europe/Moscow">Moscow Time (MSK)</SelectItem>
          <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
          <SelectItem value="Asia/Shanghai">China Standard Time (CST)</SelectItem>
          <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
          <SelectItem value="Asia/Seoul">Korea Standard Time (KST)</SelectItem>
          <SelectItem value="Asia/Jakarta">Indonesia Western Standard Time (WIB)</SelectItem>
          <SelectItem value="Asia/Makassar">Indonesia Central Standard Time (WITA)</SelectItem>
          <SelectItem value="Asia/Jayapura">Indonesia Eastern Standard Time (WIT)</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Australia & Pacific</SelectLabel>
          <SelectItem value="Australia/Perth">Australian Western Standard Time (AWST)</SelectItem>
          <SelectItem value="Australia/Adelaide">
            Australian Central Standard Time (ACST)
          </SelectItem>
          <SelectItem value="Australia/Sydney">Australian Eastern Standard Time (AEST)</SelectItem>
          <SelectItem value="Australia/Brisbane">
            Australian Eastern Standard Time - Brisbane (AEST)
          </SelectItem>
          <SelectItem value="Pacific/Auckland">New Zealand Standard Time (NZST)</SelectItem>
          <SelectItem value="Pacific/Fiji">Fiji Time (FJT)</SelectItem>
          <SelectItem value="Pacific/Tongatapu">Tonga Time (TOT)</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>South America</SelectLabel>
          <SelectItem value="America/Argentina/Buenos_Aires">Argentina Time (ART)</SelectItem>
          <SelectItem value="America/La_Paz">Bolivia Time (BOT)</SelectItem>
          <SelectItem value="America/Sao_Paulo">Brasilia Time (BRT)</SelectItem>
          <SelectItem value="America/Santiago">Chile Standard Time (CLT)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
