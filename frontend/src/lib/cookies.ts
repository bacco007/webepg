import { getServerCookie, setServerCookie } from '@/app/actions/cookies';

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

export async function getCookie(name: string): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    // Client-side
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(name))
      ?.split('=')[1];
    return value ? decodeURIComponent(value) : undefined;
  } else {
    // Server-side
    return getServerCookie(name);
  }
}

export async function setCookie(
  name: string,
  value: string,
  options?: CookieOptions
): Promise<void> {
  if (typeof window !== 'undefined') {
    // Client-side
    const encodedValue = encodeURIComponent(value);
    let cookieString = `${name}=${encodedValue}; path=/`;
    if (options) {
      if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
      if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
      if (options.httpOnly) cookieString += '; HttpOnly';
      if (options.secure) cookieString += '; Secure';
      if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
    }
    document.cookie = cookieString;
  } else {
    // Server-side
    await setServerCookie(name, value, options);
  }
}

export async function removeCookie(name: string): Promise<void> {
  await setCookie(name, '', { maxAge: 0 });
}
