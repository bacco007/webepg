import type { Metadata } from "next";
import RegionMapClient from "./regionmap-client";

export const metadata: Metadata = {
  description:
    "Interactive channel map showing Freeview channels by region across Australia with VAST satellite coverage.",
  title: "Freeview AU Region Map",
};

export default function RegionMapPage() {
  return <RegionMapClient />;
}
