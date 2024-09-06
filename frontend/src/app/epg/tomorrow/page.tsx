// ./src/app/epg/tomorrow/page.tsx
import { addDays, format } from 'date-fns';
import { redirect } from 'next/navigation';

export default function TomorrowRedirect() {
  const tomorrow = format(addDays(new Date(), 1), 'yyyyMMdd');

  const redirectUrl = `/epg/${tomorrow}`;

  redirect(redirectUrl);
}
