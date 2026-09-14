/**
 * Image URL Utilities for S2C Fireworks & Crackers
 * Provides robust URL normalization, Cloudinary CDN optimization (AVIF, WebP, JPEG),
 * browser preloading, festive SVG fallback generator, and diagnostic logging.
 */

import { trackBrokenImageError } from './imageAnalytics';

// Premium Festive Fireworks SVG Placeholder as Data URI (Zero external dependencies)
export const FESTIVE_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120606"/>
      <stop offset="50%" stop-color="#1e0b0b"/>
      <stop offset="100%" stop-color="#0a0505"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  
  <!-- Dark Festive Background -->
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="180" r="120" fill="url(#sparkGlow)"/>
  <rect x="2" y="2" width="396" height="396" rx="16" fill="none" stroke="#f59e0b" stroke-opacity="0.2" stroke-width="2"/>

  <!-- Festive Cracker / Sparkler Graphics -->
  <g transform="translate(200, 170)">
    <!-- Sparkles radiating -->
    <path d="M0 -70 L0 -50 M0 50 L0 70 M-70 0 L-50 0 M50 0 L70 0" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
    <path d="M-45 -45 L-32 -32 M32 32 L45 45 M45 -45 L32 -32 M-32 32 L-45 45" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Central Rocket / Cracker Silhouette -->
    <path d="M-14 30 L0 -40 L14 30 L0 22 Z" fill="url(#gold)"/>
    <path d="M-10 30 L-14 45 L-4 35 Z" fill="#ef4444"/>
    <path d="M10 30 L14 45 L4 35 Z" fill="#ef4444"/>
    <circle cx="0" cy="-42" r="4" fill="#fff"/>
  </g>

  <!-- Text Label -->
  <text x="200" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#fef08a" text-anchor="middle" letter-spacing="1.5">
    S2C CRACKERS
  </text>
  <text x="200" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#f87171" text-anchor="middle" letter-spacing="0.5">
    Sivakasi Authentic Fireworks
  </text>
</svg>
`)}`;

/**
 * Normalizes an image URL to ensure valid protocol and clean formatting.
 * @param {string|any} url - The raw image URL
 * @returns {string} Sanitized URL or placeholder
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return FESTIVE_PLACEHOLDER_SVG;
  }

  let cleanUrl = url.trim();

  // If empty string
  if (!cleanUrl) {
    return FESTIVE_PLACEHOLDER_SVG;
  }

  // If already a data URI or local blob
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }

  // If protocol-relative URL (e.g. //res.cloudinary.com/...)
  if (cleanUrl.startsWith('//')) {
    cleanUrl = `https:${cleanUrl}`;
  }

  // If HTTP, upgrade to HTTPS for Cloudinary and Unsplash
  if (cleanUrl.startsWith('http://')) {
    if (cleanUrl.includes('cloudinary.com') || cleanUrl.includes('unsplash.com')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }
  }

  return cleanUrl;
};

/**
 * Optimizes a Cloudinary image URL with AVIF preference, WebP and JPEG fallback.
 * Preserves other remote URLs cleanly without breaking them.
 * 
 * @param {string} url - Original image URL
 * @param {object} options - Optimization options
 * @param {number} [options.width] - Target width in px
 * @param {number} [options.height] - Target height in px
 * @param {string} [options.crop='fill'] - Cloudinary crop mode (fill, scale, limit, pad)
 * @param {string} [options.quality='auto'] - Cloudinary quality mode
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const normalized = normalizeImageUrl(url);

  if (!normalized || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  // Only apply Cloudinary transformations to Cloudinary URLs
  if (normalized.includes('cloudinary.com') || normalized.includes('res.cloudinary')) {
    try {
      const uploadIndex = normalized.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const { width, height, crop = 'fill', quality = 'auto' } = options;
        
        // f_auto instructs Cloudinary CDN to serve the best modern format supported
        // (AVIF, WebP, etc.), and fall back to JPG/PNG.
        const transforms = ['f_auto', `q_${quality}`];

        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        if (width || height) transforms.push(`c_${crop}`);

        const transformString = transforms.join(',');
        
        const prefix = normalized.substring(0, uploadIndex + 8);
        const rest = normalized.substring(uploadIndex + 8);

        // If rest already has custom transformation parameters
        if (rest.startsWith('f_auto') || rest.startsWith('w_') || rest.startsWith('c_')) {
          return normalized;
        }

        return `${prefix}${transformString}/${rest}`;
      }
    } catch {
      return normalized;
    }
  }

  // For Unsplash images, optimize width and format
  if (normalized.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(normalized);
      if (options.width) urlObj.searchParams.set('w', options.width.toString());
      if (options.height) urlObj.searchParams.set('h', options.height.toString());
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('q', '80');
      return urlObj.toString();
    } catch {
      return normalized;
    }
  }

  return normalized;
};

/**
 * Returns the highest resolution / pristine original image URL for Lightbox zoom mode.
 * Removes downscaled width/height constraints for maximum crispness.
 * 
 * @param {string} url - Original image URL
 * @returns {string} High-res original URL
 */
export const getHighResImageUrl = (url) => {
  const normalized = normalizeImageUrl(url);

  if (!normalized || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  // Cloudinary high-res original
  if (normalized.includes('cloudinary.com') || normalized.includes('res.cloudinary')) {
    try {
      const uploadIndex = normalized.indexOf('/upload/');
      if (uploadIndex !== -1) {
        // Keep auto format (f_auto) and high quality (q_auto:best) for zoom
        const prefix = normalized.substring(0, uploadIndex + 8);
        const rest = normalized.substring(uploadIndex + 8);
        
        // Strip previous small size transformations
        const cleanRest = rest.replace(/^(w_\d+,|h_\d+,|c_[a-z]+,|q_[a-z0-9:]+,|f_[a-z0-9:]+,)+/, '');
        return `${prefix}f_auto,q_auto:best/${cleanRest}`;
      }
    } catch {
      return normalized;
    }
  }

  // Unsplash high-res original
  if (normalized.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(normalized);
      urlObj.searchParams.set('w', '2000');
      urlObj.searchParams.set('q', '95');
      urlObj.searchParams.set('auto', 'format');
      return urlObj.toString();
    } catch {
      return normalized;
    }
  }

  return normalized;
};

/**
 * Preload an image URL into browser cache for instant rendering
 * @param {string} url
 */
export const preloadImage = (url) => {
  if (!url || typeof url !== 'string' || url.startsWith('data:')) return;
  const img = new Image();
  img.src = normalizeImageUrl(url);
};

/**
 * Preload multiple image URLs
 * @param {string[]} urls
 */
export const preloadImages = (urls = []) => {
  if (!Array.isArray(urls)) return;
  urls.filter(Boolean).forEach(preloadImage);
};

/**
 * Canonical Product Image Resolver
 * Guarantees that every single component across the entire application resolves
 * the exact same canonical image URL for a given product or cart item.
 * 
 * Strict Canonical Priority:
 * 1. product.images[0] (Canonical Schema field)
 * 2. product.imageUrl (Legacy / Alias field)
 * 3. product.image (Cart / Flattened field)
 * 4. Raw URL string if passed directly
 * 5. Fallback: FESTIVE_PLACEHOLDER_SVG
 * 
 * @param {object|string} product - Product object, cart item, or direct URL string
 * @param {object} [options] - Optional transformation options (width, height, crop, quality, cacheBust)
 * @returns {string} Fully resolved, optimized canonical image URL
 */
export const getProductImage = (product, options = {}) => {
  if (!product) return FESTIVE_PLACEHOLDER_SVG;

  let rawUrl = '';

  if (typeof product === 'string') {
    rawUrl = product.trim();
  } else if (typeof product === 'object') {
    if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string' && product.images[0].trim()) {
      rawUrl = product.images[0].trim();
    } else if (typeof product.imageUrl === 'string' && product.imageUrl.trim()) {
      rawUrl = product.imageUrl.trim();
    } else if (typeof product.image === 'string' && product.image.trim()) {
      rawUrl = product.image.trim();
    } else if (typeof product.images === 'string' && product.images.trim()) {
      rawUrl = product.images.trim();
    }
  }

  const normalized = normalizeImageUrl(rawUrl);

  if (!normalized || normalized === FESTIVE_PLACEHOLDER_SVG) {
    return FESTIVE_PLACEHOLDER_SVG;
  }

  // Apply optimizations if specified
  let finalUrl = normalized;
  if (options.width || options.height || options.quality || options.crop) {
    finalUrl = getOptimizedImageUrl(normalized, options);
  }

  // Cache-busting support (?v=<version>) to prevent stale caches
  if (options.cacheBust) {
    const version = typeof options.cacheBust === 'string' || typeof options.cacheBust === 'number'
      ? options.cacheBust
      : product?.updatedAt || Date.now();
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}v=${encodeURIComponent(version)}`;
  }

  return finalUrl;
};

/**
 * Canonical Gallery Images Resolver
 * Returns an array of valid image URLs for galleries / Lightbox
 * @param {object} product
 * @returns {string[]}
 */
export const getProductImages = (product) => {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    const valid = product.images
      .filter((u) => typeof u === 'string' && u.trim())
      .map(normalizeImageUrl)
      .filter((u) => u && u !== FESTIVE_PLACEHOLDER_SVG);
    if (valid.length > 0) return valid;
  }
  const single = getProductImage(product);
  return single && single !== FESTIVE_PLACEHOLDER_SVG ? [single] : [];
};

/**
 * Diagnostic logger for product image errors
 */
export const logImageError = ({ url, productId, productName, componentName, error }) => {
  console.warn(
    `%c[ProductImage Error]%c Failed to load image in <${componentName || 'Component'}>:\n` +
    `  • Product ID:   ${productId || 'N/A'}\n` +
    `  • Product Name: ${productName || 'N/A'}\n` +
    `  • Image URL:    ${url || 'N/A'}\n` +
    `  • Error:        ${error?.message || 'Network / Resource Failed'}\n` +
    `  • Fallback:     Applied Festive SVG Placeholder`,
    'color: #ef4444; font-weight: bold; background: #200; padding: 2px 6px; border-radius: 4px;',
    'color: #fca5a5;'
  );

  // Track in client analytics for admin broken image reports
  trackBrokenImageError({ productId, productName, url, error });
};

