/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Generate additional dynamic routes
  additionalPaths: (_config) => {
    const result = [];

    // Generate dates for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      result.push({
        changefreq: "daily",
        lastmod: new Date().toISOString(),
        loc: `/epg/${dateStr}`,
        priority: 0.8,
      });
    }

    // Add now/next page
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/nownext",
      priority: 0.9,
    });

    return result;
  },
  changefreq: "daily",
  exclude: ["/api/*", "/_next/*", "/static/*"],
  generateRobotsTxt: true,
  priority: 0.7,
  robotsTxtOptions: {
    additionalSitemaps: ["http://webepg.xyz/server-sitemap.xml"],
    policies: [
      { allow: "/", userAgent: "*" },
      { disallow: ["/api/*", "/_next/*", "/static/*"], userAgent: "*" },
    ],
  },
  siteUrl: "http://webepg.xyz",
  // Default transformation function
  transform: (config, path) => {
    return {
      alternateRefs: [
        {
          href: "http://webepg.xyz",
          hreflang: "en",
        },
      ],
      changefreq: config.changefreq,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      priority: config.priority,
    };
  },
};
