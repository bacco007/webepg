import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "webEPG - Electronic Program Guide",
    short_name: "webEPG",
    description:
      "Free and open-source Electronic Program Guide for TV and Radio channels",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    dir: "ltr",
    categories: ["entertainment", "tv", "radio"],
    icons: [
      {
        src: "/favicon/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
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
        name: "TV Guide",
        short_name: "TV",
        description: "View TV program guide",
        url: "/tv",
        icons: [
          { src: "/favicon/android-chrome-192x192.png", sizes: "192x192" },
        ],
      },
      {
        name: "Radio Guide",
        short_name: "Radio",
        description: "View radio program guide",
        url: "/radio",
        icons: [
          { src: "/favicon/android-chrome-192x192.png", sizes: "192x192" },
        ],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
