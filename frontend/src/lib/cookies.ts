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

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// async function main() {
//   await setCookie('testCookie', 'testValue', { maxAge: 60 });
//   const cookieValue = await getCookie('testCookie');
//   //console.log('Cookie value:', cookieValue);
//   await deleteCookie('testCookie');
//   const cookieValueAfterDelete = await getCookie('testCookie');
//   //console.log('Cookie value after delete:', cookieValueAfterDelete);
// }

// main();
