'use client';

import {
  RelativeTime,
  RelativeTimeZone,
  RelativeTimeZoneDate,
  RelativeTimeZoneDisplay,
  RelativeTimeZoneLabel,
} from '@/components/RelativeTime';

const timezones = [
  { label: 'Aus - East (DST)', zone: 'Australia/Sydney' },
  { label: 'Aus - East (No DST)', zone: 'Australia/Brisbane' },
  { label: 'Aus - Central', zone: 'Australia/Adelaide' },
  { label: 'Aus - West', zone: 'Australia/Perth' },
];

export default function RelativeTimeExamplePage() {
  return (
    <div className="flex justify-center items-center gap-4 bg-secondary p-4 w-full min-h-screen">
      <div className="bg-background shadow-lg p-6 border rounded-md">
        <h1 className="mb-4 font-bold text-2xl text-center">Relative Time Example</h1>
        <RelativeTime
          dateFormatOptions={{ dateStyle: "full" }}
          timeFormatOptions={{ hour: "2-digit", minute: "2-digit" }}
        >
          {timezones.map(({ zone, label }) => (
            <RelativeTimeZone key={zone} zone={zone}>
              <RelativeTimeZoneLabel>{label}</RelativeTimeZoneLabel>
              <RelativeTimeZoneDate />
              <RelativeTimeZoneDisplay />
            </RelativeTimeZone>
          ))}
        </RelativeTime>
      </div>
    </div>
  )
}
