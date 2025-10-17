"use client";

import { RefreshCw } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChannelWeeklyView } from "@/components/epg/channel-weekly-view";

export default function ChannelSlugClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const channelSlug = params.channelslug as string;
  const dataSource = searchParams.get("source") || undefined;

  return (
    <main className="flex size-full flex-col">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="mr-2 animate-spin">
              <RefreshCw className="h-5 w-5" />
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
