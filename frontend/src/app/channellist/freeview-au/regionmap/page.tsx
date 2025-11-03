import type { Metadata } from "next";
import RegionMapClient from "./regionmap-client";

export const metadata: Metadata = {
  description:
    "Interactive channel map showing Freeview channels by region across Australia with VAST satellite coverage for free-to-air TV.",
  openGraph: {
    description:
      "Interactive channel map showing Freeview channels by region across Australia with VAST satellite coverage for free-to-air TV.",
    siteName: "webEPG",
    title: "Freeview AU Region Map | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/channellist/freeview-au/regionmap",
  },
  title: "Freeview AU Region Map",
  twitter: {
    card: "summary_large_image",
    description:
      "Interactive channel map showing Freeview channels by region across Australia with VAST satellite coverage for free-to-air TV.",
    title: "Freeview AU Region Map | webEPG",
  },
};

export default function RegionMapPage() {
  return <RegionMapClient />;
}
