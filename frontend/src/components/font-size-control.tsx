"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Text } from "lucide-react";
import { useEffect, useState } from "react";

import { setCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

const fontSizeOptions = [
  { key: "small", icon: Minus, label: "Decrease font size" },
  { key: "normal", icon: Text, label: "Normal font size" },
  { key: "large", icon: Plus, label: "Increase font size" },
];

const fontSizeValues = {
  small: 90,
  normal: 100,
  large: 110,
};

export function FontSizeControl({ className }: { className?: string }) {
  const [fontSize, setFontSize] =
    useState<keyof typeof fontSizeValues>("normal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      const size = Number.parseInt(savedFontSize, 10);
      const key = Object.entries(fontSizeValues).find(
        ([, value]) => value === size
      )?.[0] as keyof typeof fontSizeValues;
      if (key) {
        setFontSize(key);
        document.documentElement.style.fontSize = `${size}%`;
      }
    }
    setMounted(true);
  }, []);

  const changeFontSize = (newSize: keyof typeof fontSizeValues) => {
    setFontSize(newSize);
    const sizeValue = fontSizeValues[newSize];
    document.documentElement.style.fontSize = `${sizeValue}%`;
    localStorage.setItem("fontSize", sizeValue.toString());
    setCookie("fontSize", sizeValue.toString(), 31_536_000); // 1 year
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
        className
      )}
    >
      {fontSizeOptions.map(({ key, icon: Icon, label }) => {
        const isActive = fontSize === key;

        return (
          <button
            aria-label={label}
            className="relative h-6 w-6 rounded-full"
            key={key}
            onClick={() => changeFontSize(key as keyof typeof fontSizeValues)}
            type="button"
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-secondary"
                layoutId="activeFontSize"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <Icon
              className={cn(
                "relative m-auto h-4 w-4",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
