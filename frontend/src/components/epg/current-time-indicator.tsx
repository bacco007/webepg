"use client"

import { useEffect, useState } from "react"

interface CurrentTimeIndicatorProps {
  hourWidth: number
}

export function CurrentTimeIndicator({ hourWidth }: CurrentTimeIndicatorProps) {
  const [position, setPosition] = useState(0)

  useEffect(() => {
    const calculatePosition = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const totalHours = hours + minutes / 60

      // Each hour is hourWidth pixels
      return totalHours * hourWidth
    }

    setPosition(calculatePosition())

    const interval = setInterval(() => {
      setPosition(calculatePosition())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [hourWidth])

  return (
    <div className="top-0 z-20 absolute h-full pointer-events-none" style={{ left: `${position}px` }}>
      <div className="bg-[hsl(var(--time-indicator))] shadow-[0_0_8px_rgba(var(--time-indicator),0.5)] w-1 h-full"></div>
      <div className="-top-3 absolute bg-[hsl(var(--time-indicator))] shadow-[0_0_8px_rgba(var(--time-indicator),0.5)] rounded-full w-4 h-4 -translate-x-1/2"></div>
    </div>
  )
}
