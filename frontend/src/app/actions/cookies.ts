'use server';

import { cookies } from 'next/headers';

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

export async function getServerCookie(
  name: string,
): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);
  const decodedValue = cookie?.value
    ? decodeURIComponent(cookie.value)
    : undefined;
  return decodedValue;
}

export async function setServerCookie(
  name: string,
  value: string,
  options?: CookieOptions,
): Promise<void> {
  const encodedValue = encodeURIComponent(value);
  (await cookies()).set(name, encodedValue, options);
}
