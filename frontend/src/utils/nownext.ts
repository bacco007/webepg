import { differenceInMinutes } from "@/lib/date-utils";
import { decodeHtml } from "@/lib/html-utils";
import type { ChannelData, Program } from "@/lib/nownext-types";
import { compareLCN } from "@/utils/sort";

/**
 * Format time from date string to HH:mm format
 * @param dateString - ISO date string to format
 * @returns Time string in 24-hour format (e.g., "14:30")
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
}

/**
 * Calculate progress percentage for a program based on current time
 * @param start - Program start time as ISO string
 * @param end - Program end time as ISO string
 * @returns Progress percentage (0-100) where 0 = not started, 100 = finished
 */
export function calculateProgress(start: string, end: string): number {
  const now = new Date();
  const startTime = new Date(start);
  const endTime = new Date(end);
  const totalDuration = endTime.getTime() - startTime.getTime();
  const elapsed = now.getTime() - startTime.getTime();
  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
}

/**
 * Check if a channel should be greyed out due to missing or invalid program data
 * @param channelData - Channel data containing current and next program information
 * @returns True if both current and next programs are invalid/missing
 */
export function isChannelGreyedOut(channelData: ChannelData): boolean {
  const isProgramInvalid = (program: Program | null): boolean =>
    !program?.title ||
    program.title === "N/A" ||
    program.title === "No Data Available" ||
    program.title.trim() === "";

  return (
    isProgramInvalid(channelData.currentProgram) &&
    isProgramInvalid(channelData.nextProgram)
  );
}

/**
 * Sort channels by their Logical Channel Number (LCN) in ascending order
 * @param channels - Array of channel data to sort
 * @returns Sorted array of channels
 */
export function sortChannelsByLCN(channels: ChannelData[]): ChannelData[] {
  return channels.sort((a, b) => compareLCN(a.channel.lcn, b.channel.lcn));
}

/**
 * Decode HTML entities in channel names (e.g., "&amp;" becomes "&")
 * @param name - Channel name that may contain HTML entities
 * @returns Decoded channel name
 */
export function decodeChannelName(name: string): string {
  return decodeHtml(name);
}

/**
 * Calculate time display for program (starts in X minutes, X minutes remaining, etc.)
 * @param program - Program object containing start and stop times
 * @returns Formatted time string or empty string if program has ended
 */
export function getTimeDisplay(program: Program): string {
  if (!program) {
    return "";
  }

  const now = new Date();
  const startTime = new Date(program.start);
  const endTime = new Date(program.stop);

  if (now < startTime) {
    return formatTimeUntilStart(startTime, now);
  }

  if (now < endTime) {
    return formatTimeRemaining(endTime, now);
  }

  return "";
}

/**
 * Format time display for a program that hasn't started yet
 * @param startTime - The program's start time
 * @param now - Current time
 * @returns Formatted string like "Starts in 30 minutes" or "Starts in 2 hours and 15 minutes"
 */
function formatTimeUntilStart(startTime: Date, now: Date): string {
  const minutesUntilStart = Math.floor(differenceInMinutes(startTime, now));

  if (minutesUntilStart < 60) {
    return `Starts in ${minutesUntilStart} minute${minutesUntilStart === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutesUntilStart / 60);
  const minutes = minutesUntilStart % 60;
  return `Starts in ${hours} hour${hours === 1 ? "" : "s"} and ${minutes} minute${
    minutes === 1 ? "" : "s"
  }`;
}

/**
 * Format time display for a program that is currently airing
 * @param endTime - The program's end time
 * @param now - Current time
 * @returns Formatted string like "30 minutes remaining" or "2 hours and 15 minutes remaining"
 */
function formatTimeRemaining(endTime: Date, now: Date): string {
  const remainingMinutes = Math.floor(differenceInMinutes(endTime, now));

  if (remainingMinutes < 60) {
    return `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} remaining`;
  }

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  return `${hours} hour${hours === 1 ? "" : "s"} and ${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
}
