'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Channel = {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_number: string;
  chlogo: string;
};

interface ChannelDropdownProperties {
  channelslug: string;
}

const ChannelDropdown: React.FC<ChannelDropdownProperties> = ({ channelslug }) => {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>(channelslug);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
        const response = await fetch(`/api/py/channels/${storedDataSource}`);
        if (!response.ok) {
          throw new Error('Failed to fetch channels');
        }
        const data: { data: { channels: Channel[] } } = await response.json();
        setChannels(data.data.channels || []);
      } catch (error_) {
        console.error('Error fetching channels:', error_);
        setError('Failed to fetch channels');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  useEffect(() => {
    setSelectedValue(channelslug);
  }, [channelslug]);

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    router.push(`/channel/${value}`);
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading channels...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px] md:w-[280px]">
        <SelectValue placeholder="Select a Channel..." />
      </SelectTrigger>
      <SelectContent>
        {channels.map((channel) => (
          <SelectItem key={channel.channel_slug} value={channel.channel_slug}>
            {channel.channel_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ChannelDropdown;
