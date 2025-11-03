import type { Metadata } from "next";
import FreeviewNzClient from "./freeview-nz-client";

export const metadata: Metadata = {
  description:
    "Browse Freeview New Zealand channel listings and details for New Zealand free-to-air television channels.",
  openGraph: {
    description:
      "Browse Freeview New Zealand channel listings and details for New Zealand free-to-air television channels.",
    siteName: "webEPG",
    title: "Freeview New Zealand Channels | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/freeview-nz",
  },
  title: "Freeview New Zealand Channels",
  twitter: {
    card: "summary_large_image",
    description:
      "Browse Freeview New Zealand channel listings and details for New Zealand free-to-air television channels.",
    title: "Freeview New Zealand Channels | webEPG",
  },
};

export default function FreeviewNzPage() {
  return <FreeviewNzClient />;
}
