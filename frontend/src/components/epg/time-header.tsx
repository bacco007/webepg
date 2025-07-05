"use client";

import { formatDate } from "@/lib/date-utils";

interface TimeHeaderProps {
  hourWidth: number;
}

export function TimeHeader({ hourWidth }: TimeHeaderProps) {
  // Generate 24 hours for the header
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="sticky top-0 z-10 border-b bg-card">
      <div className="flex h-12" style={{ width: `${hourWidth * 24}px` }}>
        {hours.map((hour) => {
          const time = new Date();
          time.setHours(hour, 0, 0, 0);

          return (
            <div
              className="flex flex-shrink-0 items-center justify-start border-r pl-2 font-medium last:border-r-0"
              key={hour}
              style={{ width: `${hourWidth}px` }}
            >
              {formatDate(time, "HH:mm")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
