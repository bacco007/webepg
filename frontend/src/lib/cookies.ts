import type { CookieOptions } from "./cookie-options";

// Helper function to safely set cookies
const setCookieSafely = (
  name: string,
  value: string,
  options?: CookieOptions
): void => {
  if (typeof document === "undefined") {
    return;
  }

  const cookieParts: string[] = [`${name}=${encodeURIComponent(value)}`];

  if (options?.maxAge) {
    cookieParts.push(`max-age=${options.maxAge}`);
  }

  if (options?.expires) {
    cookieParts.push(`expires=${options.expires.toUTCString()}`);
  }

  if (options?.path) {
    cookieParts.push(`path=${options.path}`);
  } else {
    cookieParts.push("path=/");
  }

  if (options?.secure) {
    cookieParts.push("secure");
  }

  if (options?.sameSite) {
    cookieParts.push(`samesite=${options.sameSite}`);
  }

  const cookieString = cookieParts.join("; ");

  // Set cookie using the standard approach with error handling
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Standard browser API for setting cookies
    document.cookie = cookieString;
  } catch {
    // Fallback: try setting a basic cookie
    // biome-ignore lint/suspicious/noDocumentCookie: Standard browser API for setting cookies
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
  }
};

export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return;
  }

  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue ? decodeURIComponent(cookieValue) : undefined;
    }
    return;
  } catch {
    return;
  }
}

export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") {
    return;
  }

  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

  setCookieSafely(name, value, { expires: date });
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }

  setCookieSafely(name, "", { expires: new Date(0) });
}

// Enhanced setCookie with options
export function setCookieWithOptions(
  name: string,
  value: string,
  options?: CookieOptions
): void {
  if (typeof document === "undefined") {
    return;
  }

  setCookieSafely(name, value, options);
}
