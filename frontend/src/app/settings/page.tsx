import type { Metadata } from "next";
import SettingsPageClient from "./settings-client";

export const metadata: Metadata = {
  description: "Manage your application preferences and display settings.",
  openGraph: {
    description: "Manage your application preferences and display settings.",
    siteName: "webEPG",
    title: "Settings | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/settings",
  },
  title: "Settings",
  twitter: {
    card: "summary_large_image",
    description: "Manage your application preferences and display settings.",
    title: "Settings | webEPG",
  },
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
