'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type Channel = {
  channel_id: string;
  channel_slug: string;
  channel_name: string;
  channel_number: string;
  chlogo: string;
};

type ApiResponse = {
  date_pulled: string;
  query: string;
  source: string;
  data: {
    channels: Channel[];
  };
};

const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const ChannelList: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmltvnet-sydney');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/channels/${storedDataSource}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      const sortedChannels = data.data.channels.sort((a, b) => {
        const aNumber = parseInt(a.channel_number) || Infinity;
        const bNumber = parseInt(b.channel_number) || Infinity;
        if (aNumber === bNumber) {
          return a.channel_name.localeCompare(b.channel_name);
        }
        return aNumber - bNumber;
      });
      setChannels(sortedChannels);
      setFilteredChannels(sortedChannels);
    } catch (error) {
      setError('Failed to fetch channels');
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    const filtered = channels.filter(
      (channel) =>
        channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.channel_number.includes(searchTerm)
    );
    setFilteredChannels(filtered);
  }, [searchTerm, channels]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    fetchChannels();
  };

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-xl text-red-500">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="bg-background sticky top-0 z-10 w-full border-b p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl font-bold">Weekly EPG (by Channel)</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-64 px-8"
            />
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="size-4" />
          </Button>
          </div>
        </div>
      </header>
      <ScrollArea className="grow">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
            {filteredChannels.map((channel) => (
              <Link
                key={channel.channel_slug}
                href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
                passHref
              >
                <Card className="w-[300px] overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col items-center justify-center p-4">
                    {channel.chlogo !== 'N/A' && (
                      <div className="mb-2 flex h-20 items-center justify-center">
                        <Image
                          src={channel.chlogo}
                          height={96}
                          width={96}
                          className="max-h-full w-auto object-contain"
                          alt={channel.channel_name}
                        />
                      </div>
                    )}
                    <h3 className="text-center text-lg font-bold">
                      {decodeHtml(channel.channel_name)}
                    </h3>
                    {channel.channel_number !== 'N/A' && (
                      <p className="text-center text-sm text-gray-500">
                        Channel {channel.channel_number}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChannelList;
