'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ChannelWeeklyView } from '@/components/epg/channel-weekly-view';
import { RefreshCw } from 'lucide-react';

export default function ChannelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const channelSlug = params.channelslug as string;
  const dataSource = searchParams.get('source') || undefined;

  return (
    <main className="flex flex-col size-full">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-full">
            <div className="mr-2 animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span>Loading channel data...</span>
          </div>
        }
      >
        <ChannelWeeklyView channelSlug={channelSlug} dataSource={dataSource} />
      </Suspense>
    </main>
  );
}
