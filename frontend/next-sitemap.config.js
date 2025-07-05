/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "http://webepg.xyz",
  changefreq: "daily",
  priority: 0.7,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/api/*", "/_next/*", "/static/*"] },
    ],
    additionalSitemaps: ["http://webepg.xyz/server-sitemap.xml"],
  },
  exclude: ["/api/*", "/_next/*", "/static/*"],
  // Default transformation function
  transform: (config, path) => {
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: [
        {
          href: "http://webepg.xyz",
          hreflang: "en",
        },
      ],
    };
  },
  // Generate additional dynamic routes
  additionalPaths: (_config) => {
    const result = [];

    // Generate dates for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      result.push({
        loc: `/epg/${dateStr}`,
        changefreq: "daily",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    }

    // Add now/next page
    result.push({
      loc: "/nownext",
      changefreq: "hourly",
      priority: 0.9,
      lastmod: new Date().toISOString(),
    });

    return result;
  },
};
