'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Clock, RefreshCw, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Program {
  title: string;
  start: string;
  stop: string;
  desc: string;
  category: string[];
  rating: string;
  lengthstring: string;
}

interface Channel {
  id: string;
  name: string;
  icon: string;
  slug: string;
  lcn: string;
}

interface ChannelData {
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  afterNextProgram: Program | null;
}

const ChannelGrid: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmltvnet-sydney');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
      setXmltvDataSource(storedDataSource);

      const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel data');
      }
      const data = await response.json();
      const sortedChannels = data.data.sort((a: ChannelData, b: ChannelData) => {
        const aLcn = Number.parseInt(a.channel.lcn) || Infinity;
        const bLcn = Number.parseInt(b.channel.lcn) || Infinity;
        if (aLcn === bLcn) {
          return a.channel.name.localeCompare(b.channel.name);
        }
        return aLcn - bLcn;
      });
      setChannels(sortedChannels);
      setFilteredChannels(sortedChannels);
      setIsLoading(false);
    } catch (error_) {
      console.error('Error fetching channel data:', error_);
      setError('Error fetching channel data. Please try again later.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    const filtered = channels.filter(
      (channelData) =>
        channelData.channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channelData.channel.lcn.includes(searchTerm)
    );
    setFilteredChannels(filtered);
  }, [searchTerm, channels]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRefresh = () => {
    fetchChannels();
  };

  const navigateToNext24Hours = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replaceAll('-', '');
    router.push(`/epg/${formattedDate}`);
  };

  const navigateToFullWeek = (channelSlug: string) => {
    router.push(`/channel/${channelSlug}`);
  };

  // const getValidImageSrc = (src: string) => {
  //   if (src && src !== 'N/A' && (src.startsWith('http://') || src.startsWith('https://'))) {
  //     return src;
  //   }
  //   return '/placeholder.svg?height=40&width=80';
  // };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-red-500" />
          <p className="mb-4 text-xl text-red-500">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="bg-background sticky top-0 z-10 w-full border-b p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-2xl font-bold">Now and Next</h1>
          <div className="flex items-center space-x-2">
            <div className="relative grow sm:grow-0">
              <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-8 sm:w-64"
              />
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="w-full grow overflow-auto">
        <div className="max-w-full p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
              {filteredChannels.map((channelData) => (
                <Card key={channelData.channel.id} className="bg-card flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between px-4 py-2">
                    {channelData.channel.icon !== 'N/A' && (
                      <Image
                        src={channelData.channel.icon}
                        alt={`${channelData.channel.name} Logo`}
                        width={80}
                        height={40}
                        className="object-contain"
                      />
                    )}
                    <div className="text-right">
                      <CardTitle className="text-lg">{channelData.channel.name}</CardTitle>
                      {channelData.channel.lcn !== 'N/A' && (
                        <CardDescription>Channel {channelData.channel.lcn}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grow p-4">
                    <div className="text-sm">
                      <p className="font-semibold">
                        Current Program: {channelData.currentProgram?.title || 'N/A'}
                      </p>
                      <p className="text-card-foreground/60">
                        {channelData.currentProgram
                          ? `${formatTime(channelData.currentProgram.start)} - ${formatTime(
                              channelData.currentProgram.stop
                            )}`
                          : ''}{' '}
                        ({channelData.currentProgram?.lengthstring})
                      </p>
                      <p className="mt-2 font-semibold">
                        Next Program: {channelData.nextProgram?.title || 'N/A'}
                      </p>
                      <p className="text-card-foreground/60">
                        {channelData.nextProgram
                          ? `${formatTime(channelData.nextProgram.start)} - ${formatTime(
                              channelData.nextProgram.stop
                            )}`
                          : ''}{' '}
                        ({channelData.nextProgram?.lengthstring})
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4">
                    <div className="flex w-full gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={navigateToNext24Hours}
                      >
                        <Clock className="mr-2 size-4" />
                        Next 24hrs
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigateToFullWeek(channelData.channel.slug)}
                      >
                        <Clock className="mr-2 size-4" />
                        Full Week
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChannelGrid;
