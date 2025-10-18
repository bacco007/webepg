"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import LoadingState from "@/components/loading-state";

const RadioTransmitterMap = dynamic(
  () => import("@/components/radio-transmitter-map"),
  {
    loading: () => <LoadingState />,
    ssr: false,
  }
);

export default function RadioTransmittersClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingState />;
  }

  return (
    <div className="flex size-full flex-col">
      <RadioTransmitterMap />
    </div>
  );
}
