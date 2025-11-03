import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/constants";
import { formatDateFromYYYYMMDD } from "@/lib/date-utils";
import EPGDateClient from "./epg-date-client";

type EPGDatePageProps = {
  params: Promise<{
    date: string;
  }>;
};

export async function generateMetadata({
  params,
}: EPGDatePageProps): Promise<Metadata> {
  const { date } = await params;

  // Format the date for display
  const formattedDate = formatDateFromYYYYMMDD(date, "EEEE, do MMMM yyyy");
  const shortDate = formatDateFromYYYYMMDD(date, "EEEE do MMM yyyy");
  const _isoDate = formatDateFromYYYYMMDD(date, "yyyy-MM-dd");

  const title = `${shortDate} TV Guide | ${SITE_CONFIG.name}`;
  const description = `Browse Electronic Program Guide and TV listings for ${formattedDate}. Find what's on TV with comprehensive program schedules.`;

  return {
    alternates: {
      canonical: `${SITE_CONFIG.url}/epg/${date}`,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: `${shortDate} TV Guide on webEPG`,
          height: 1200,
          url: "/favicon/android-chrome-512x512.png",
          width: 1200,
        },
      ],
      siteName: SITE_CONFIG.name,
      title,
      type: "website",
      url: `${SITE_CONFIG.url}/epg/${date}`,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: ["/favicon/android-chrome-512x512.png"],
      title,
    },
  };
}

export default function EPGDatePage({ params }: EPGDatePageProps) {
  return <EPGDateClient params={params} />;
}
