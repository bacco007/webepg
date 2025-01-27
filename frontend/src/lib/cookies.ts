import { CookieOptions } from './CookieOptions';

const getServerCookie: (name: string) => Promise<string | undefined> = (
  name: string,
) => Promise.resolve('serverValue');
const setServerCookie: (
  name: string,
  value: string,
  options?: CookieOptions,
) => Promise<void> = async (
  _name: string,
  value: string,
  options?: CookieOptions,
) => {
  console.log(`Setting server cookie: ${_name}=${value}, options:`, options);
};

const getCookieClient = (name: string): string | undefined => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name))
    ?.split('=')[1];
};

const setCookieClient = (cookieString: string): void => {
  document.cookie = cookieString;
};

export async function getCookie(name: string): Promise<string | undefined> {
  if (typeof window === 'undefined') {
    // Server-side
    return getServerCookie(name);
  } else {
    // Client-side
    const value = getCookieClient(name);
    return value ? decodeURIComponent(value) : undefined;
  }
}

export async function setCookie(
  name: string,
  value: string,
  options?: CookieOptions,
): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side
    await setServerCookie(name, value, options);
  } else {
    // Client-side
    const encodedValue = encodeURIComponent(value);
    let cookieString = `${name}=${encodedValue}; path=/`;
    if (options) {
      if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
      if (options.expires)
        cookieString += `; expires=${options.expires.toUTCString()}`;
      if (options.httpOnly) cookieString += '; HttpOnly';
      if (options.secure) cookieString += '; Secure';
      if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
    }
    setCookieClient(cookieString);
  }
}

export async function removeCookie(name: string): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side
    await setServerCookie(name, '', { maxAge: 0 });
  } else {
    // Client-side
    setCookieClient(`${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  }
}

async function main() {
  await setCookie('testCookie', 'testValue', { maxAge: 60 });
  const cookieValue = await getCookie('testCookie');
  console.log('Cookie value:', cookieValue);
  await removeCookie('testCookie');
  const cookieValueAfterRemove = await getCookie('testCookie');
  console.log('Cookie value after remove:', cookieValueAfterRemove);
}

main();
