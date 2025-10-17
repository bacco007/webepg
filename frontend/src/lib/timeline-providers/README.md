# Timeline Providers

This directory contains individual provider data files for the timeline feature.

## File Structure

Each provider has its own TypeScript file:

- `austar.ts` - Austar Analogue Service (1995-2007)
- `foxtelanalogue.ts` - Foxtel Analogue Service (1995-2007)
- `foxteldigital.ts` - Foxtel Digital Service (2004-2025)
- `galaxy.ts` - Galaxy Service (1995-1999)
- `optus.ts` - Optus Analogue Service (1995-2007)

## Date Format

**Important**: Use strings for dates where the month is 10, 11, or 12 to prevent JavaScript from converting decimals.

### Examples

- ✅ `"2010.10"` for October 2010 (use string)
- ✅ `"2010.11"` for November 2010 (use string)
- ✅ `"2010.12"` for December 2010 (use string)
- ✅ `2010.3` for March 2010 (number is fine, months 1-9)
- ❌ `2010.10` as a number - JavaScript converts this to `2010.1` (January)

### Why strings for months 10-12

JavaScript treats `2010.10` as a decimal number equal to `2010.1`. To preserve October (month 10), use the string `"2010.10"` instead.

## Usage

All provider files are imported and exported in `/src/lib/timeline-data.ts`.
