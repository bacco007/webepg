/**
 * Date utility abstraction layer
 *
 * This file provides a unified API for date operations using either date-fns or dayjs.
 * Set USE_DAYJS to true to use dayjs, or false to use date-fns.
 */

import {
  differenceInMinutes as dateFnsDifferenceInMinutes,
  format as dateFnsFormat,
  isAfter as dateFnsIsAfter,
  isBefore as dateFnsIsBefore,
  isToday as dateFnsIsToday,
  parseISO as dateFnsParseISO,
} from "date-fns";

// In v0, these imports will be ignored but won't cause errors
// In production, they will be used if USE_DAYJS is true
import dayjs from "dayjs";
import dayjsAdvancedFormat from "dayjs/plugin/advancedFormat";
import dayjsCustomParseFormat from "dayjs/plugin/customParseFormat";
import dayjsIsToday from "dayjs/plugin/isToday";

// Configuration flag - set to false for v0, true for production with dayjs
const USE_DAYJS = true;

// Initialize dayjs plugins if we're using dayjs
if (typeof dayjs === "function") {
  dayjs.extend(dayjsIsToday);
  dayjs.extend(dayjsCustomParseFormat);
  dayjs.extend(dayjsAdvancedFormat);
}

/**
 * Format a date string according to the specified format
 */
export function formatDate(date: Date | string, formatStr: string): string {
  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(date).format(convertFormatToDayjs(formatStr));
  }
  const dateObj = typeof date === "string" ? dateFnsParseISO(date) : date;
  return dateFnsFormat(dateObj, formatStr);
}

/**
 * Parse an ISO date string into a Date object
 */
export function parseISODate(dateStr: string): Date {
  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(dateStr).toDate();
  }
  return dateFnsParseISO(dateStr);
}

/**
 * Check if a date is today
 */
export function isDateToday(date: Date | string): boolean {
  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(date).isToday();
  }
  const dateObj = typeof date === "string" ? dateFnsParseISO(date) : date;
  return dateFnsIsToday(dateObj);
}

/**
 * Format a date from YYYYMMDD string format
 */
export function formatDateFromYYYYMMDD(
  dateStr: string,
  formatStr: string
): string {
  if (!dateStr) {
    return "";
  }

  const formattedDateStr = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(formattedDateStr).format(convertFormatToDayjs(formatStr));
  }
  const dateObj = dateFnsParseISO(formattedDateStr);
  return dateFnsFormat(dateObj, formatStr);
}

/**
 * Check if date1 is after date2
 */
export function isAfter(date1: Date | string, date2: Date | string): boolean {
  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(date1).isAfter(dayjs(date2));
  }
  const dateObj1 = typeof date1 === "string" ? dateFnsParseISO(date1) : date1;
  const dateObj2 = typeof date2 === "string" ? dateFnsParseISO(date2) : date2;
  return dateFnsIsAfter(dateObj1, dateObj2);
}

/**
 * Check if date1 is before date2
 */
export function isBefore(date1: Date | string, date2: Date | string): boolean {
  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(date1).isBefore(dayjs(date2));
  }
  const dateObj1 = typeof date1 === "string" ? dateFnsParseISO(date1) : date1;
  const dateObj2 = typeof date2 === "string" ? dateFnsParseISO(date2) : date2;
  return dateFnsIsBefore(dateObj1, dateObj2);
}

/**
 * Calculate the difference between two dates in minutes
 */
export function differenceInMinutes(
  date1: Date | string,
  date2: Date | string
): number {
  if (USE_DAYJS && typeof dayjs === "function") {
    return dayjs(date1).diff(dayjs(date2), "minute");
  }
  const dateObj1 = typeof date1 === "string" ? dateFnsParseISO(date1) : date1;
  const dateObj2 = typeof date2 === "string" ? dateFnsParseISO(date2) : date2;
  return dateFnsDifferenceInMinutes(dateObj1, dateObj2);
}

/**
 * Helper function to convert date-fns format strings to dayjs format strings
 * This is a simplified conversion and may need to be expanded for more complex formats
 */
function convertFormatToDayjs(dateFnsFormatStr: string): string {
  const formatMap: Record<string, string> = {
    // Day of month
    d: "D", // Day of month, no leading zero
    dd: "DD", // Day of month, leading zero
    do: "Do", // Day of month with ordinal (1st, 2nd)

    // Day of week
    E: "ddd", // Abbreviated day name
    EE: "ddd", // Abbreviated day name
    EEE: "ddd", // Abbreviated day name
    EEEE: "dddd", // Full day name
    EEEEE: "dd", // Narrow day name

    // Month
    M: "M", // Month number, no leading zero
    MM: "MM", // Month number, leading zero
    MMM: "MMM", // Abbreviated month name
    MMMM: "MMMM", // Full month name

    // Year
    yy: "YY", // 2-digit year
    yyyy: "YYYY", // 4-digit year

    // Hour
    H: "H", // 24-hour, no leading zero
    HH: "HH", // 24-hour, leading zero
    h: "h", // 12-hour, no leading zero
    hh: "hh", // 12-hour, leading zero

    // Minute, Second
    m: "m", // Minute, no leading zero
    mm: "mm", // Minute, leading zero
    s: "s", // Second, no leading zero
    ss: "ss", // Second, leading zero

    // AM/PM
    a: "A", // AM/PM
    aa: "A", // AM/PM

    // Timezone
    z: "z", // Timezone abbreviation
    zzz: "z", // Timezone abbreviation
  };

  // Replace tokens in the format string
  let dayjsFormat = dateFnsFormatStr;

  // Sort keys by length (descending) to avoid partial replacements
  // For example, replace 'MMMM' before 'MMM' to avoid 'MMMM' becoming 'MMMm'
  const sortedKeys = Object.keys(formatMap).sort((a, b) => b.length - a.length);

  for (const token of sortedKeys) {
    // Use a regex with word boundaries to avoid partial replacements
    const regex = new RegExp(`\\b${token}\\b`, "g");
    dayjsFormat = dayjsFormat.replace(regex, formatMap[token]);
  }

  return dayjsFormat;
}
