import type { Metadata } from "next";
import MoviesPageClient from "./movies-client";

export const metadata: Metadata = {
  description: "Browse upcoming movies and films on TV channels.",
  openGraph: {
    description: "Browse upcoming movies and films on TV channels.",
    siteName: "webEPG",
    title: "Upcoming Movies | webEPG",
    type: "website",
    url: "https://www.webepg.xyz/movies",
  },
  title: "Upcoming Movies",
  twitter: {
    card: "summary_large_image",
    description: "Browse upcoming movies and films on TV channels.",
    title: "Upcoming Movies | webEPG",
  },
};

export default function MoviesPage() {
  return <MoviesPageClient />;
}
