export function detectTimezone(): string {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
    return 'UTC';
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
