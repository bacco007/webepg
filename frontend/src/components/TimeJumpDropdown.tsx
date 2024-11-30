'use client';

import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TimeJumpDropdownProps = {
  onTimeJump: (minutesFromMidnight: number) => void;
};

type TimeOption = {
  label: string;
  value: string;
  minutesFromMidnight: number;
};

const timeOptions: TimeOption[] = [
  { label: 'Now', value: 'now', minutesFromMidnight: -1 },
  { label: 'Early Morning (00:00)', value: 'earlyMorning', minutesFromMidnight: -50 },
  { label: 'Morning (06:00)', value: 'morning', minutesFromMidnight: 310 },
  { label: 'Lunch (12:00)', value: 'lunch', minutesFromMidnight: 670 },
  { label: 'Early Afternoon (15:00)', value: 'earlyAfternoon', minutesFromMidnight: 850 },
  { label: 'Evening (18:00)', value: 'evening', minutesFromMidnight: 1030 },
  { label: 'Late Evening (21:00)', value: 'lateEvening', minutesFromMidnight: 1210 },
];

const TimeJumpDropdown: React.FC<TimeJumpDropdownProps> = ({ onTimeJump }) => {
  const handleValueChange = (selectedValue: string) => {
    const selectedOption = timeOptions.find((option) => option.value === selectedValue);
    if (selectedOption) {
      let minutesFromMidnight = selectedOption.minutesFromMidnight;
      if (selectedOption.value === 'now') {
        // Calculate current time in minutes from midnight
        const now = new Date();
        minutesFromMidnight = now.getHours() * 60 + now.getMinutes() - 50;
      }
      onTimeJump(minutesFromMidnight);
    }
  };

  return (
    <Select onValueChange={handleValueChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Jump to Time" />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimeJumpDropdown;
