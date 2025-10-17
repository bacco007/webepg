/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
  reactStrictMode: true,
  rewrites() {
    return [
      {
        destination: "/api/:path*", // This will be handled by Traefik
        source: "/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
