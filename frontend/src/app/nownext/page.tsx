import type { Metadata } from "next";
import NowNextClient from "./nownext-client";

export const metadata: Metadata = {
  description:
    "See what's currently on and what's coming up next on your favorite channels.",
  title: "Now and Next",
};

export default function NowNextPage() {
  return <NowNextClient />;
}
