import type { Metadata } from "next";
import AdditionalDataClient from "./additional-data-client";

export const metadata: Metadata = {
  description: "Manage additional data files that override channel data.",
  openGraph: {
    description: "Manage additional data files that override channel data.",
    siteName: "webEPG",
    title: "Additional Data | Settings | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/settings/additional-data",
  },
  title: "Additional Data | Settings",
  twitter: {
    card: "summary_large_image",
    description: "Manage additional data files that override channel data.",
    title: "Additional Data | Settings | webEPG",
  },
};

export default function AdditionalDataPage() {
  return <AdditionalDataClient />;
}
