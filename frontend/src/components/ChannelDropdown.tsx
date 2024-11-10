'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCookie } from '@/lib/cookies';

type Channel = {
  channel_id: string;
  channel_slug: string;
  channel_names: {
    clean: string;
    location: string;
    real: string;
  };
  channel_number: string;
  chlogo: string;
  channel_logo: {
    light: string;
    dark: string;
  };
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
        const storedDataSource = (await getCookie('xmltvdatasource')) || 'xmlepg_FTASYD';
        const response = await fetch(`/api/py/channels/${storedDataSource}`);
        if (!response.ok) {
          throw new Error('Failed to fetch channels');
        }
        const data: { data: { channels: Channel[] } } = await response.json();
        const filteredChannels = data.data.channels.filter(
          (channel) => channel.channel_id !== 'NOEPG' && channel.channel_slug !== 'NOEPG'
        );
        setChannels(filteredChannels || []);
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
          <SelectItem
            key={`${channel.channel_id}-${channel.channel_slug}-${channel.channel_number}`}
            value={channel.channel_slug}
          >
            {channel.channel_names.real}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ChannelDropdown;
