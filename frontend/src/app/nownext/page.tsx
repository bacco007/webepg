import type { Metadata } from "next";
import NowNextClient from "./nownext-client";

export const metadata: Metadata = {
  description:
    "See what's currently on and what's coming up next on your favorite channels.",
  openGraph: {
    description:
      "See what's currently on and what's coming up next on your favorite channels.",
    siteName: "webEPG",
    title: "Now and Next | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/nownext",
  },
  title: "Now and Next",
  twitter: {
    card: "summary_large_image",
    description:
      "See what's currently on and what's coming up next on your favorite channels.",
    title: "Now and Next | webEPG",
  },
};

export default function NowNextPage() {
  return <NowNextClient />;
}
