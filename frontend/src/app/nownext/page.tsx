'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import LoadingSpinner from '@/components/snippets/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('xmltvnet-sydney');
  const router = useRouter();

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'xmltvnet-sydney';
    setXmltvDataSource(storedDataSource);

    const fetchChannels = async () => {
      try {
        const response = await fetch(`/api/py/epg/nownext/${storedDataSource}`);
        if (!response.ok) {
          throw new Error('Failed to fetch channel data');
        }
        const data = await response.json();
        const sortedChannels = data.data.sort((a: ChannelData, b: ChannelData) => {
          const aLcn = parseInt(a.channel.lcn) || Infinity;
          const bLcn = parseInt(b.channel.lcn) || Infinity;
          if (aLcn === bLcn) {
            return a.channel.name.localeCompare(b.channel.name);
          }
          return aLcn - bLcn;
        });
        setChannels(sortedChannels);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching channel data:', err);
        setError('Error fetching channel data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const navigateToNext24Hours = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replace(/-/g, '');
    router.push(`/epg/${formattedDate}`);
  };

  const navigateToFullWeek = (channelSlug: string) => {
    router.push(`/channel/${channelSlug}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertCircle className="mb-4 size-12 text-red-500" />
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  const getValidImageSrc = (src: string) => {
    if (src && src !== 'N/A' && (src.startsWith('http://') || src.startsWith('https://'))) {
      return src;
    }
    return '/placeholder.svg?height=40&width=80';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="flex max-h-screen max-w-full flex-col">
      <header className="bg-background flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Now and Next</h1>
        <p className="text-muted-foreground text-sm">Source: {xmltvDataSource}</p>
      </header>
      <div
        className="relative max-h-[calc(100vh-210px)] max-w-full"
        style={{ display: 'flex', overflow: 'scroll' }}
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {channels.map((channelData) => (
            <Card key={channelData.channel.id} className="bg-card flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <Image
                  src={getValidImageSrc(channelData.channel.icon)}
                  alt={`${channelData.channel.name} Logo`}
                  width={80}
                  height={40}
                  className="object-contain"
                />
                <div className="text-right">
                  <h3 className="text-card-foreground text-lg font-semibold">
                    {channelData.channel.name}
                  </h3>
                  {channelData.channel.lcn !== 'N/A' && (
                    <p className="text-gray-500">Channel {channelData.channel.lcn}</p>
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
                  <Button variant="secondary" className="flex-1" onClick={navigateToNext24Hours}>
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
      </div>
    </div>
  );
};

export default ChannelGrid;
