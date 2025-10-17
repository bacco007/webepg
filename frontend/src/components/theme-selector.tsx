"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { setCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";

const themeOptions = [
  {
    description: "Use light theme",
    icon: Sun,
    key: "light",
    label: "Light Mode",
  },
  {
    description: "Use dark theme",
    icon: Moon,
    key: "dark",
    label: "Dark Mode",
  },
  {
    description: "Use system preferences",
    icon: Monitor,
    key: "system",
    label: "System",
  },
];

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleThemeChange = (value: string) => {
    setTheme(value);
    setCookie("theme", value);
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        className="grid gap-4"
        onValueChange={handleThemeChange}
        value={theme}
      >
        {themeOptions.map(({ key, icon: Icon, label, description }) => (
          <div
            className={cn(
              "flex items-center space-x-3 rounded-lg border p-4 transition-colors",
              theme === key
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
