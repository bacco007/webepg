/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Generate additional dynamic routes
  additionalPaths: (_config) => {
    const result = [];

    // Generate dates for the next 14 days
    for (let i = 0; i < 14; i += 1) {
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

    // Add static EPG routes
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/epg",
      priority: 0.9,
    });
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/epg/today",
      priority: 0.9,
    });
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/epg/tomorrow",
      priority: 0.9,
    });

    // Add now/next page
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/nownext",
      priority: 0.9,
    });

    // Add channel pages
    result.push({
      changefreq: "daily",
      lastmod: new Date().toISOString(),
      loc: "/channel",
      priority: 0.8,
    });

    // Add sports and movies pages
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/sports",
      priority: 0.8,
    });
    result.push({
      changefreq: "hourly",
      lastmod: new Date().toISOString(),
      loc: "/movies",
      priority: 0.8,
    });

    // Add channel list pages
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/fetch",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/foxtel",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/freeview-au",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/freeview-au/regionmap",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/freeview-nz",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/hubbl",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/skynz",
      priority: 0.7,
    });
    result.push({
      changefreq: "weekly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/vast",
      priority: 0.7,
    });
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/history",
      priority: 0.6,
    });

    // Add transmitter pages
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/transmitters",
      priority: 0.6,
    });
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/transmitters/radio",
      priority: 0.6,
    });
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/transmitters/television",
      priority: 0.6,
    });

    // Add sources and settings pages
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/sources",
      priority: 0.5,
    });
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/settings",
      priority: 0.5,
    });

    // Add timeline history provider pages
    const timelineProviders = [
      "austar",
      "ectv",
      "fetchtv",
      "foxtelanalogue",
      "foxteldigital",
      "freeview_metro",
      "galaxy",
      "ncable",
      "optus",
      "optusitv",
      "tarbs",
      "transact",
    ];
    for (const provider of timelineProviders) {
      result.push({
        changefreq: "monthly",
        lastmod: new Date().toISOString(),
        loc: `/channellist/history/${provider}`,
        priority: 0.6,
      });
    }

    // Add subscriptiontv history page
    result.push({
      changefreq: "monthly",
      lastmod: new Date().toISOString(),
      loc: "/channellist/history/subscriptiontv",
      priority: 0.6,
    });

    return result;
  },
  // Automatically add lastmod to all URLs
  autoLastmod: true,
  changefreq: "daily",
  exclude: ["/api/*", "/_next/*", "/static/*"],
  generateRobotsTxt: true,
  priority: 0.7,
  robotsTxtOptions: {
    additionalSitemaps: ["https://webepg.xyz/server-sitemap.xml"],
    policies: [
      { allow: "/", userAgent: "*" },
      { disallow: ["/api/*", "/_next/*", "/static/*"], userAgent: "*" },
    ],
  },
  // Split sitemaps if they exceed 50,000 URLs
  sitemapSize: 5000,
  siteUrl: "https://webepg.xyz",
  // Default transformation function
  transform: (config, path) => {
    return {
      alternateRefs: [
        {
          href: "https://webepg.xyz",
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
