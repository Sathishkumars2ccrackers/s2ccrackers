/**
 * Fast Client-Side API Response Cache
 * Provides high-speed in-memory & sessionStorage caching with TTL and
 * Stale-While-Revalidate support for public catalog endpoints.
 * 
 * Target endpoints:
 * - /products (Wholesale Catalog) -> 5 mins
 * - /categories (Categories List) -> 15 mins
 * - /products/meta/brands -> 15 mins
 * - /products/featured/showcase -> 5 mins
 * - /banners -> 10 mins
 * - /settings/public -> 10 mins
 */

const memoryCache = new Map();
const STORAGE_PREFIX = 's2c_cache_';

/**
 * Get cached entry from Memory or SessionStorage
 */
export const getCachedData = (key) => {
  // 1. Check memory cache first
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (Date.now() < entry.expiry) {
      return { data: entry.data, isStale: false };
    }
    // Stale entry in memory
    return { data: entry.data, isStale: true };
  }

  // 2. Check sessionStorage
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw) {
      const entry = JSON.parse(raw);
      // Promote to memory cache
      memoryCache.set(key, entry);
      if (Date.now() < entry.expiry) {
        return { data: entry.data, isStale: false };
      }
      return { data: entry.data, isStale: true };
    }
  } catch {
    // sessionStorage unavailable or quota exceeded
  }

  return null;
};

/**
 * Store data into Memory and SessionStorage cache
 */
export const setCachedData = (key, data, ttlMs = 5 * 60 * 1000) => {
  const entry = {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + ttlMs,
  };

  memoryCache.set(key, entry);

  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Execute request with automatic cache lookup and background refresh
 * 
 * @param {string} cacheKey - Unique identifier for the cached response
 * @param {Function} fetcher - Async Axios or Fetch request function
 * @param {object} options - Caching options
 * @param {number} [options.ttl=300000] - Time to live in ms (default: 5 mins)
 * @param {boolean} [options.staleWhileRevalidate=true] - Return stale cache while fetching fresh in background
 * @returns {Promise<any>} Axios response-like object { data, status, fromCache: boolean }
 */
export const fetchWithCache = async (cacheKey, fetcher, options = {}) => {
  const ttl = options.ttl || 5 * 60 * 1000;
  const staleWhileRevalidate = options.staleWhileRevalidate !== false;

  const cached = getCachedData(cacheKey);

  // 1. Fresh cache hit -> return immediately
  if (cached && !cached.isStale) {
    return { data: cached.data, status: 200, fromCache: true };
  }

  // 2. Stale cache hit with SWR enabled -> start background update, return stale now
  if (cached && cached.isStale && staleWhileRevalidate) {
    // Trigger background fetch to update cache silently
    fetcher()
      .then((res) => {
        if (res?.data) {
          setCachedData(cacheKey, res.data, ttl);
        }
      })
      .catch(() => {});

    return { data: cached.data, status: 200, fromCache: true, isStale: true };
  }

  // 3. Cache miss -> perform actual network request
  const response = await fetcher();
  if (response?.data) {
    setCachedData(cacheKey, response.data, ttl);
  }

  return response;
};

/**
 * Invalidate specific or all catalog cache keys
 * @param {string} [prefix] - Specific key or prefix to invalidate, or null to clear all
 */
export const invalidateCatalogCache = (prefix = null) => {
  if (!prefix) {
    memoryCache.clear();
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(`${STORAGE_PREFIX}${prefix}`)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
};
