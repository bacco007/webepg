"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/lib/cookies";

const validateCookie = (value: string | undefined): string => {
  if (!value || value === "undefined" || value === "null") {
    return "100";
  }
  return value;
};

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState("100%");

  useEffect(() => {
    const cookieFontSize = getCookie("fontSize");
    const validatedFontSize = validateCookie(cookieFontSize);
    setFontSize(`${validatedFontSize}%`);
  }, []);

  return (
    <div style={{ fontSize }}>
      {children}
    </div>
  );
} 