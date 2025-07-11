"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import LoadingState from "@/components/loading-state";

const TVTransmitterMap = dynamic(
  () => import("@/components/tv-transmitter-map"),
  {
    loading: () => <LoadingState />,
    ssr: false,
  }
);

export default function TransmittersPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingState />;
  }

  return (
    <div className="flex size-full flex-col">
      <TVTransmitterMap />
    </div>
  );
}
