"use client";

import { useEffect, useMemo, useState } from "react";
import { getCookie } from "@/lib/cookies";
import { handleError } from "@/lib/error-handling";
import { SidebarFooterContent } from "./sidebar-footer-content";

export default function SidebarFooter() {
  const [timezone, setTimezone] = useState<string | undefined>();
  const [xmltvdatasource, setXmltvdatasource] = useState<string | undefined>();

  // Memoize cookie reading to avoid unnecessary re-computations
  const cookieData = useMemo(() => {
    try {
      return {
        timezone: getCookie("timezone"),
        xmltvdatasource: getCookie("xmltvdatasource"),
      };
    } catch (error) {
      // Handle cookie reading errors gracefully
      handleError(error);
      // In a real app, you might want to log this to an error reporting service
      // For now, we'll silently handle the error and return undefined values
      return { timezone: undefined, xmltvdatasource: undefined };
    }
  }, []);

  useEffect(() => {
    setTimezone(cookieData.timezone);
    setXmltvdatasource(cookieData.xmltvdatasource);
  }, [cookieData]);

  return (
    <SidebarFooterContent
      timezone={timezone}
      xmltvdatasource={xmltvdatasource}
    />
  );
}
