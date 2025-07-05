"use client";

import { format } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getCookie } from "@/lib/cookies";

// Regex to validate date format (YYYYMMDD)
const DATE_FORMAT_REGEX = /^\d{8}$/;

export default function TodayRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const now = new Date();
        if (Number.isNaN(now.getTime())) {
          throw new TypeError("Invalid date");
        }

        let userTimezone = "UTC";
        try {
          const storedTimezone = await getCookie("userTimezone");
          if (storedTimezone) {
            userTimezone = storedTimezone;
          }
        } catch (_error) {
          // Ignore timezone cookie errors, use UTC as fallback
        }

        const today = format(now, "yyyyMMdd", { timeZone: userTimezone });

        if (!DATE_FORMAT_REGEX.test(today)) {
          throw new Error("Invalid date format");
        }

        const redirectUrl = `/epg/${today}`;

        router.push(redirectUrl);
      } catch (_error) {
        router.push("/epg/error");
      }
    };

    redirect();
  }, [router]);

  return null;
}
