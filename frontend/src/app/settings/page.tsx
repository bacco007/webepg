import type { Metadata } from "next";
import SettingsPageClient from "./settings-client";

export const metadata: Metadata = {
  description: "Manage your application preferences and display settings.",
  title: "Settings",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
