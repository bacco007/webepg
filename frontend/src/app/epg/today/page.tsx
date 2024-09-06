// ./src/app/epg/today/page.tsx
import { format } from 'date-fns-tz';
import { redirect } from 'next/navigation';

export default function TodayRedirect() {
  const today = format(new Date(), 'yyyyMMdd');

  const redirectUrl = `/epg/${today}`;

  redirect(redirectUrl);
}
