'use client';

import React, { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Source {
  id: string;
  location: string;
  url: string;
  group?: string;
  subgroup?: string;
}

interface GroupedSources {
  [key: string]: Source[];
}

export const SourceDropdown: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [groupedSources, setGroupedSources] = useState<GroupedSources>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/py/sources');
        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }
        const sources: Source[] = await response.json();

        const grouped = sources.reduce<GroupedSources>((groups, source) => {
          const combinedGroupName = `${source.group || 'Other'} - ${source.subgroup || 'General'}`;
          if (!groups[combinedGroupName]) {
            groups[combinedGroupName] = [];
          }
          groups[combinedGroupName].push(source);
          return groups;
        }, {});

        setGroupedSources(grouped);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sources:', error);
        setIsLoading(false);
      }
    };

    fetchSources();

    const storedDataSource = localStorage.getItem('xmltvdatasource') || '';
    setSelectedSource(storedDataSource);
  }, []);

  const handleSelectChange = (value: string) => {
    localStorage.setItem('xmltvdatasource', value);
    setSelectedSource(value);
    window.location.reload();
  };

  if (isLoading) {
    return <div>Loading sources...</div>;
  }

  return (
    <Select onValueChange={handleSelectChange} value={selectedSource}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a source" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedSources).map(([combinedGroup, sources]) => (
          <SelectGroup key={combinedGroup}>
            <SelectLabel>{combinedGroup}</SelectLabel>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.location}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SourceDropdown;
