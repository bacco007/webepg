"use client";

import { Minus, Plus, Text } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { setCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

const fontSizeOptions = [
  {
    key: "small",
    icon: Minus,
    label: "Small",
    description: "90% of normal size",
  },
  { key: "normal", icon: Text, label: "Normal", description: "Default size" },
  {
    key: "large",
    icon: Plus,
    label: "Large",
    description: "110% of normal size",
  },
];

const fontSizeValues = {
  small: 90,
  normal: 100,
  large: 110,
};

export function FontSizeSettings() {
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
        document.documentElement.style.setProperty(
          "--font-scale",
          `${size / 100}`
        );
      }
    }
    setMounted(true);
  }, []);

  const changeFontSize = (newSize: keyof typeof fontSizeValues) => {
    setFontSize(newSize);
    const sizeValue = fontSizeValues[newSize];
    document.documentElement.style.setProperty(
      "--font-scale",
      `${sizeValue / 100}`
    );
    localStorage.setItem("fontSize", sizeValue.toString());
    setCookie("fontSize", sizeValue.toString(), 31_536_000); // 1 year
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        className="grid gap-4"
        onValueChange={(value) =>
          changeFontSize(value as keyof typeof fontSizeValues)
        }
        value={fontSize}
      >
        {fontSizeOptions.map(({ key, icon: Icon, label, description }) => (
          <div
            className={cn(
              "flex items-center space-x-3 rounded-lg border p-4 transition-colors",
              fontSize === key
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            )}
            key={key}
          >
            <RadioGroupItem className="mt-0.5" id={key} value={key} />
            <Label
              className="flex flex-1 cursor-pointer items-center justify-between"
              htmlFor={key}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
