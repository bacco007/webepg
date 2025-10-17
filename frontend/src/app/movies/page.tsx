import type { Metadata } from "next";
import MoviesPageClient from "./movies-client";

export const metadata: Metadata = {
  description: "Browse upcoming movies and films on TV channels.",
  title: "Upcoming Movies",
};

export default function MoviesPage() {
  return <MoviesPageClient />;
}
