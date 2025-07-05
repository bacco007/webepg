"use server";

import { cookies } from "next/headers";

export async function setTimezone(timezone: string) {
  (await cookies()).set("timezone", timezone, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "strict",
    httpOnly: true,
  });
  return { success: true, timezone };
}

export async function getTimezone() {
  const cookieStore = await cookies();
  return cookieStore.get("timezone")?.value || "";
}
