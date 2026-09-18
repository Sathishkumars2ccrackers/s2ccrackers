const Product = require('../models/Product');
const Category = require('../models/Category');

const SITE_URL = process.env.SITE_URL || 'https://www.s2ccrackers.com';

/**
 * Generates dynamic sitemap.xml with live product and category pages from MongoDB
 */
const getDynamicSitemapXml = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Core static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0', lastmod: todayStr },
      { url: '/products', changefreq: 'daily', priority: '0.9', lastmod: todayStr },
      { url: '/all-crackers', changefreq: 'daily', priority: '0.8', lastmod: todayStr },
      { url: '/track-order', changefreq: 'weekly', priority: '0.7', lastmod: todayStr },
      { url: '/safety', changefreq: 'monthly', priority: '0.7', lastmod: todayStr },
      { url: '/about', changefreq: 'monthly', priority: '0.6', lastmod: todayStr },
      { url: '/contact', changefreq: 'monthly', priority: '0.6', lastmod: todayStr },
    ];

    // Fetch active categories
    const categories = await Category.find({ isActive: { $ne: false } })
      .select('slug name updatedAt')
      .lean();

    const categoryUrls = categories.map((cat) => {
      const lastmod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split('T')[0] : todayStr;
      const slug = cat.slug || cat._id.toString();
      return {
        url: `/products?category=${slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod,
      };
    });

    // Fetch active products
    const products = await Product.find({ isActive: true })
      .select('slug _id updatedAt')
      .lean();

    const productUrls = products.map((prod) => {
      const lastmod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : todayStr;
      const slug = prod.slug || prod._id.toString();
      return {
        url: `/product/${slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod,
      };
    });

    const allUrls = [...staticPages, ...categoryUrls, ...productUrls];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    allUrls.forEach((item) => {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}${item.url}</loc>\n`;
      xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};

/**
 * Returns dynamic robots.txt
 */
const getRobotsTxt = (req, res) => {
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  return res.status(200).send(content);
};

module.exports = {
  getDynamicSitemapXml,
  getRobotsTxt,
};
