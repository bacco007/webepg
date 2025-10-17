import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    categories: ["entertainment", "tv", "radio"],
    description:
      "Free and open-source Electronic Program Guide for TV and Radio channels",
    dir: "ltr",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "16x16",
        src: "/favicon/favicon-16x16.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "32x32",
        src: "/favicon/favicon-32x32.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "192x192",
        src: "/favicon/android-chrome-192x192.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "512x512",
        src: "/favicon/android-chrome-512x512.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "180x180",
        src: "/favicon/apple-touch-icon.png",
        type: "image/png",
      },
    ],
    lang: "en",
    name: "webEPG - Electronic Program Guide",
    orientation: "portrait",
    prefer_related_applications: false,
    related_applications: [],
    scope: "/",
    short_name: "webEPG",
    // screenshots: [
    //   {
    //     src: '/screenshots/home.png',
    //     sizes: '1280x720',
    //     type: 'image/png',
    //     form_factor: 'wide',
    //     label: 'Home screen of webEPG',
    //   },
    //   {
    //     src: '/screenshots/mobile.png',
    //     sizes: '750x1334',
    //     type: 'image/png',
    //     form_factor: 'narrow',
    //     label: 'Mobile view of webEPG',
    //   },
    // ],
    shortcuts: [
      {
        description: "View TV program guide",
        icons: [
          { sizes: "192x192", src: "/favicon/android-chrome-192x192.png" },
        ],
        name: "TV Guide",
        short_name: "TV",
        url: "/tv",
      },
      {
        description: "View radio program guide",
        icons: [
          { sizes: "192x192", src: "/favicon/android-chrome-192x192.png" },
        ],
        name: "Radio Guide",
        short_name: "Radio",
        url: "/radio",
      },
    ],
    start_url: "/",
    theme_color: "#0f172a",
  };
}
