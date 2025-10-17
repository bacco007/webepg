import type { Metadata } from "next";
import FreeviewNzClient from "./freeview-nz-client";

export const metadata: Metadata = {
  description: "Browse Freeview New Zealand channel listings and details.",
  title: "Freeview New Zealand Channels",
};

export default function FreeviewNzPage() {
  return <FreeviewNzClient />;
}
