'use client';

import React, { useEffect, useState } from 'react';

import { getTimezone, setTimezone } from '@/app/actions/timezone';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { detectTimezone } from '@/lib/timezone';

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function TimezoneSelector() {
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [browserTimezone, setBrowserTimezone] = useState<string>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTimezone = async () => {
      const storedTimezone = await getTimezone();
      const detectedTimezone = detectTimezone();
      setBrowserTimezone(detectedTimezone);

      if (storedTimezone) {
        setSelectedTimezone(storedTimezone);
      } else {
        setSelectedTimezone(detectedTimezone);
        await setTimezone(detectedTimezone);
      }
    };
    fetchTimezone();
  }, []);

  const handleTimezoneChange = (value: string) => {
    console.log('Timezone changed to:', value);
    setSelectedTimezone(value);
  };

  const handleSave = async () => {
    console.log('Saving timezone:', selectedTimezone);
    try {
      const result = await setTimezone(selectedTimezone);
      if (result.success) {
        setMessage('Timezone updated successfully!');
        console.log('Timezone update success:', result.timezone);
      } else {
        setMessage('Failed to update timezone. Please try again.');
        console.error('Timezone update failed');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error('Error updating timezone:', error);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Browser Timezone:</label>
        <span className="text-sm">{browserTimezone}</span>
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor="timezone-select" className="text-sm font-medium">
          Selected Timezone:
        </label>
        <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger id="timezone-select" className="w-[180px]">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map(tz => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave}>Save Timezone</Button>
      {message && (
        <p
          className={
            message.includes('success') ? 'text-green-600' : 'text-red-600'
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
