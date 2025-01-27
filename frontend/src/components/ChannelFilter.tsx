import React from 'react';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChannelFilterProperties {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export default function ChannelFilter({
  value,
  onChange,
  id = 'channel-filter',
}: ChannelFilterProperties) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative w-64">
      <Label htmlFor={id} className="sr-only">
        Filter channels
      </Label>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          id={id}
          type="text"
          placeholder="Filter channels..."
          value={value}
          onChange={(e: { target: { value: string } }) =>
            onChange(e.target.value)
          }
          className="w-full px-8"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Clear filter"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
