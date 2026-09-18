const express = require('express');
const router = express.Router();
const { getDynamicSitemapXml, getRobotsTxt } = require('../controllers/seoController');

// Public dynamic SEO routes
router.get('/sitemap.xml', getDynamicSitemapXml);
router.get('/robots.txt', getRobotsTxt);

module.exports = router;
