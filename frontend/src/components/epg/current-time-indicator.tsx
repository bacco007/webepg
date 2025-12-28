"use client";

import { useEffect, useState } from "react";

interface CurrentTimeIndicatorProps {
  hourWidth: number;
}

export function CurrentTimeIndicator({ hourWidth }: CurrentTimeIndicatorProps) {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalHours = hours + minutes / 60;

      // Each hour is hourWidth pixels
      return totalHours * hourWidth;
    };

    setPosition(calculatePosition());

    const interval = setInterval(() => {
      setPosition(calculatePosition());
    }, 60_000); // Update every minute

    return () => clearInterval(interval);
  }, [hourWidth]);

  return (
    <div
      className="pointer-events-none absolute top-0 z-20 h-full"
      style={{ left: `${position}px` }}
    >
      <div className="h-full w-1 bg-[hsl(var(--time-indicator))] shadow-[0_0_8px_rgba(var(--time-indicator),0.5)]" />
      <div className="absolute -top-3 h-4 w-4 -translate-x-1/2 rounded-full bg-[hsl(var(--time-indicator))] shadow-[0_0_8px_rgba(var(--time-indicator),0.5)]" />
    </div>
  );
}
