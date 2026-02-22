import type { Metadata } from "next";
import AdditionalDataEditClient from "./edit-client";

export const metadata: Metadata = {
  description: "Edit additional data file for a source.",
  openGraph: {
    description: "Edit additional data file for a source.",
    siteName: "webEPG",
    title: "Edit Additional Data | Settings | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/settings/additional-data",
  },
  title: "Edit Additional Data | Settings",
  twitter: {
    card: "summary_large_image",
    description: "Edit additional data file for a source.",
    title: "Edit Additional Data | Settings | webEPG",
  },
};

export default function AdditionalDataEditPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  return <AdditionalDataEditClient params={params} />;
}
