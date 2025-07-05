"use client";

import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FontSizeSettings } from "@/components/font-size-settings";
import { ThemeSelector } from "@/components/theme-selector";
import { TimezoneSelector } from "@/components/timezone-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { getCookie, setCookie } from "@/lib/cookies";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = (await getCookie("theme")) || "system";
        const savedFontScale = (await getCookie("fontSize")) || "100";

        setTheme(savedTheme);

        document.documentElement.style.setProperty(
          "--font-scale",
          `${Number.parseInt(savedFontScale, 10) / 100}`
        );
      } catch (_error) {
        // Error handling for settings loading
      }
    };

    loadSettings();
  }, [setTheme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (theme) {
        await setCookie("theme", theme);
      }
      router.refresh();

      toast({
        description: "Your display preferences have been updated.",
        title: "Settings saved",
      });
    } catch (_error) {
      toast({
        description: "Failed to save settings. Please try again.",
        title: "Error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex size-full flex-col">
      <div className="flex flex-col items-start justify-between gap-4 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:flex-row sm:items-center sm:gap-0">
        <div>
          <h1 className="font-bold text-xl sm:text-2xl">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your application preferences
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          disabled={isSaving}
          onClick={handleSave}
        >
          <Settings2 className="mr-2 size-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
      <ScrollArea className="grow">
        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Display Mode</CardTitle>
                <CardDescription>
                  Choose your preferred color scheme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelector />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Font Size</CardTitle>
                <CardDescription>
                  Adjust the text size for better readability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FontSizeSettings />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Timezone</CardTitle>
                <CardDescription>
                  Set your preferred timezone for accurate scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimezoneSelector />
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
