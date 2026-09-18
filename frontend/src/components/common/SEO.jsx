import React, { useEffect } from 'react';

const SITE_URL = 'https://www.s2ccrackers.com';
const DEFAULT_IMAGE = `${SITE_URL}/logo.svg`;
const DEFAULT_TITLE = 'S2C Crackers | Buy Sivakasi Crackers Online | Factory Direct Price';
const DEFAULT_DESCRIPTION =
  'Shop authentic Sivakasi crackers online at factory direct price from S2C Crackers. Buy sparklers, sky shots, flower pots & gift boxes with Door Delivery in India.';

/**
 * Universal Dynamic SEO Component for S2C Crackers
 * Updates document.title, meta tags, canonical link, Open Graph, Twitter Cards,
 * and structured JSON-LD schemas on client route transitions.
 */
const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  structuredData,
  noindex = false,
}) => {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title.includes('S2C Crackers') ? title : `${title} | S2C Crackers Sivakasi`;
    document.title = formattedTitle;

    // Helper to create or update meta tag
    const setMetaTag = (attributeName, attributeValue, content) => {
      if (!content && content !== '') return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to create or update link tag
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Meta Description & Keywords
    setMetaTag('name', 'description', description);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 3. Robots / Indexing Directives
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow, noarchive');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // 4. Canonical URL
    let absoluteCanonical = canonical;
    if (!absoluteCanonical) {
      const pathname = window.location.pathname === '/' ? '' : window.location.pathname;
      absoluteCanonical = `${SITE_URL}${pathname}`;
    } else if (absoluteCanonical.startsWith('/')) {
      absoluteCanonical = `${SITE_URL}${absoluteCanonical}`;
    }
    setLinkTag('canonical', absoluteCanonical);

    // 5. Open Graph Meta Tags
    setMetaTag('property', 'og:site_name', 'S2C Crackers');
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', absoluteCanonical);

    const absoluteOgImage = ogImage.startsWith('http')
      ? ogImage
      : ogImage.startsWith('/')
      ? `${SITE_URL}${ogImage}`
      : `${SITE_URL}/${ogImage}`;
    setMetaTag('property', 'og:image', absoluteOgImage);
    setMetaTag('property', 'og:image:alt', formattedTitle);

    // 6. Twitter Card Meta Tags
    setMetaTag('property', 'twitter:card', 'summary_large_image');
    setMetaTag('property', 'twitter:site', '@S2CCrackers');
    setMetaTag('property', 'twitter:title', formattedTitle);
    setMetaTag('property', 'twitter:description', description);
    setMetaTag('property', 'twitter:image', absoluteOgImage);
    setMetaTag('property', 'twitter:url', absoluteCanonical);

    // 7. Dynamic JSON-LD Structured Data
    const scriptId = 'seo-dynamic-jsonld';
    let scriptElement = document.getElementById(scriptId);

    if (structuredData) {
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      try {
        scriptElement.textContent = JSON.stringify(structuredData);
      } catch {
        // Ignore json formatting errors
      }
    } else if (scriptElement) {
      scriptElement.remove();
    }

    return () => {
      // Clean up dynamic script on unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, canonical, ogImage, ogType, structuredData, noindex]);

  return null;
};

export default SEO;
