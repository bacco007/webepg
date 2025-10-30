"use client";

import { useEffect, useState } from "react";

export function SkipLink() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !event.shiftKey) {
        setIsVisible(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <a
      className="skip-link"
      href="#main-content"
      onBlur={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
    >
      Skip to main content
    </a>
  );
}
