import type { Metadata } from "next";
import FreeviewAuClient from "./freeview-au-client";

export const metadata: Metadata = {
  description:
    "Browse Freeview Australia channel listings and regional coverage maps.",
  title: "Freeview Australia",
};

export default function FreeviewAuPage() {
  return <FreeviewAuClient />;
}
