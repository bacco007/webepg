'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmltvnet-sydney');

  useEffect(() => {
    const fetchChannels = async () => {
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
      } catch (error) {
        setError('Failed to fetch channels');
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Weekly EPG (by Channel)</h1>
      </header>
      <ScrollArea className="grow">
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {channels.map((channel) => (
            <Link
              key={channel.channel_slug}
              href={`/channel/${channel.channel_slug}?source=${xmltvDataSource}`}
              passHref
            >
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
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
      </ScrollArea>
    </div>
  );
};

export default ChannelList;
