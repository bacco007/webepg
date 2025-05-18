"use client"

import { formatDate } from "@/lib/date-utils"

interface TimeHeaderProps {
  hourWidth: number
}

export function TimeHeader({ hourWidth }: TimeHeaderProps) {
  // Generate 24 hours for the header
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="top-0 z-10 sticky bg-card border-b">
      <div className="flex h-12" style={{ width: `${hourWidth * 24}px` }}>
        {hours.map((hour) => {
          const time = new Date()
          time.setHours(hour, 0, 0, 0)

          return (
            <div
              key={hour}
              className="flex flex-shrink-0 justify-start items-center pl-2 border-r last:border-r-0 font-medium"
              style={{ width: `${hourWidth}px` }}
            >
              {formatDate(time, "HH:mm")}
            </div>
          )
        })}
      </div>
    </div>
  )
}
