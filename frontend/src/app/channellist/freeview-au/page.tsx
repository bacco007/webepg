import type { Metadata } from "next";
import FreeviewAuClient from "./freeview-au-client";

export const metadata: Metadata = {
  description:
    "Browse Freeview Australia channel listings and regional coverage maps for Australian free-to-air television channels.",
  openGraph: {
    description:
      "Browse Freeview Australia channel listings and regional coverage maps for Australian free-to-air television channels.",
    siteName: "webEPG",
    title: "Freeview Australia | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/freeview-au",
  },
  title: "Freeview Australia",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse Freeview Australia channel listings and regional coverage maps for Australian free-to-air television channels.",
    title: "Freeview Australia | webEPG",
  },
};

export default function FreeviewAuPage() {
  return <FreeviewAuClient />;
}
