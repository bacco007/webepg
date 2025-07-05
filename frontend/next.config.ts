import path from "node:path";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
export default bundleAnalyzer({
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    viewTransition: true,
  },
  headers: async () => [
    {
      headers: [
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "origin-when-cross-origin",
        },
      ],
      source: "/:path*",
    },
  ],
  images: {
    domains: ["i.imgur.com"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        hostname: "**",
        protocol: "https",
      },
      {
        hostname: "**",
        protocol: "http",
      },
    ],
  },
  output: "standalone",
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  rewrites: async () => [
    {
      destination:
        process.env.NODE_ENV === "development"
          ? "http://127.0.0.1:8000/api/py/:path*"
          : "/api/",
      source: "/api/py/:path*",
    },
    {
      destination:
        process.env.NODE_ENV === "development"
          ? "http://127.0.0.1:8000/py/docs"
          : "/api/py/docs",
      source: "/docs",
    },
    {
      destination:
        process.env.NODE_ENV === "development"
          ? "http://127.0.0.1:8000/py/openapi.json"
          : "/api/py/openapi.json",
      source: "/openapi.json",
    },
  ],
  // Add this to ensure Tailwind CSS v4 is properly transpiled
  transpilePackages: ["tailwindcss"],
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname);
    config.plugins.push(new (require("case-sensitive-paths-webpack-plugin"))());
    return config;
  },
});
