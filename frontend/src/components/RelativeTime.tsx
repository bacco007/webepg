"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, createContext, useContext, type HTMLAttributes } from "react"

const formatDateTime = (
  date: Date,
  timeZone: string,
  format: "date" | "time",
  options?: Intl.DateTimeFormatOptions,
) => {
  const defaultOptions =
    format === "date" ? { dateStyle: "long" } : { hour: "2-digit", minute: "2-digit" }

  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options, timeZone }).format(date)
}

const useTime = (initialTime: Date, controlled: boolean) => {
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    if (controlled) return

    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [controlled])

  return time
}

type RelativeTimeContextType = {
  time: Date
  dateFormatOptions?: Intl.DateTimeFormatOptions
  timeFormatOptions?: Intl.DateTimeFormatOptions
}

const RelativeTimeContext = createContext<RelativeTimeContextType>({
  time: new Date(),
  dateFormatOptions: { dateStyle: "long" },
  timeFormatOptions: { hour: "2-digit", minute: "2-digit" },
})

export type RelativeTimeProps = HTMLAttributes<HTMLDivElement> & {
  time?: Date
  defaultTime?: Date
  onTimeChange?: (time: Date) => void
  dateFormatOptions?: Intl.DateTimeFormatOptions
  timeFormatOptions?: Intl.DateTimeFormatOptions
}

export const RelativeTime = ({
  time: controlledTime,
  defaultTime = new Date(),
  onTimeChange,
  dateFormatOptions,
  timeFormatOptions,
  className,
  ...props
}: RelativeTimeProps) => {
  const time = useTime(controlledTime || defaultTime, !!controlledTime)

  useEffect(() => {
    if (onTimeChange) onTimeChange(time)
  }, [time, onTimeChange])

  return (
    <RelativeTimeContext.Provider value={{ time, dateFormatOptions, timeFormatOptions }}>
      <div className={cn("grid gap-2", className)} {...props} />
    </RelativeTimeContext.Provider>
  )
}

type RelativeTimeZoneContextType = {
  zone: string
}

const RelativeTimeZoneContext = createContext<RelativeTimeZoneContextType>({
  zone: "UTC",
})

export type RelativeTimeZoneProps = HTMLAttributes<HTMLDivElement> & {
  zone: string
}

export const RelativeTimeZone = ({ zone, className, ...props }: RelativeTimeZoneProps) => (
  <RelativeTimeZoneContext.Provider value={{ zone }}>
    <div className={cn("flex items-center justify-between gap-1.5 text-xs", className)} {...props} />
  </RelativeTimeZoneContext.Provider>
)

export const RelativeTimeZoneDisplay = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { time, timeFormatOptions } = useContext(RelativeTimeContext)
  const { zone } = useContext(RelativeTimeZoneContext)
  const display = formatDateTime(time, zone, "time", timeFormatOptions)

  return (
    <div className={cn("pl-8 text-muted-foreground tabular-nums", className)} {...props}>
      {display}
    </div>
  )
}

export const RelativeTimeZoneDate = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { time, dateFormatOptions } = useContext(RelativeTimeContext)
  const { zone } = useContext(RelativeTimeZoneContext)
  const display = formatDateTime(time, zone, "date", dateFormatOptions)

  return <div {...props}>{display}</div>
}

export const RelativeTimeZoneLabel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex h-4 items-center justify-center rounded-xs bg-secondary px-1.5 font-mono", className)}
    {...props}
  />
)

