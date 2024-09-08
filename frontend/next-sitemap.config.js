/** @type {import('next-sitemap').IConfig} */

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  siteUrl: dev ? 'http://webepg.xyz' : 'YOUR_DEPLOYED_SITE_URL',
};
