/**
 * Client-Side Image Engagement & Broken Image Analytics Tracker
 * Stores events in localStorage for real-time sales insights and admin reporting.
 */

const STORAGE_KEY = 's2c_image_analytics';
const MAX_LOGS = 100;

const getStoredAnalytics = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        imageClicks: {},
        zoomEvents: 0,
        zoomByProduct: {},
        lightboxViews: {},
        brokenImageErrors: [],
        totalClicks: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      imageClicks: {},
      zoomEvents: 0,
      zoomByProduct: {},
      lightboxViews: {},
      brokenImageErrors: [],
      totalClicks: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

const saveAnalytics = (data) => {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Tracks product image clicks
 */
export const trackImageClick = ({ productId, productName, componentName }) => {
  if (!productName && !productId) return;
  const data = getStoredAnalytics();
  const key = productName || productId;

  data.totalClicks = (data.totalClicks || 0) + 1;
  data.imageClicks[key] = (data.imageClicks[key] || 0) + 1;

  saveAnalytics(data);
};

/**
 * Tracks zoom actions inside the Lightbox viewer
 */
export const trackZoomUsage = ({ productId, productName, zoomLevel }) => {
  const data = getStoredAnalytics();
  const key = productName || productId || 'General Preview';

  data.zoomEvents = (data.zoomEvents || 0) + 1;
  data.zoomByProduct[key] = (data.zoomByProduct[key] || 0) + 1;

  saveAnalytics(data);
};

/**
 * Tracks lightbox openings
 */
export const trackLightboxOpen = ({ productId, productName }) => {
  const data = getStoredAnalytics();
  const key = productName || productId || 'Unknown Product';

  data.lightboxViews[key] = (data.lightboxViews[key] || 0) + 1;

  saveAnalytics(data);
};

/**
 * Logs broken image errors for admin monitoring
 */
export const trackBrokenImageError = ({ productId, productName, url, error }) => {
  const data = getStoredAnalytics();
  
  const errorEntry = {
    productId: productId || 'unknown',
    productName: productName || 'Unknown',
    url: url || 'unknown',
    error: error?.message || 'Failed to load',
    timestamp: new Date().toISOString(),
  };

  // Avoid spamming duplicate recent logs
  const isDuplicate = data.brokenImageErrors.some(
    (e) => e.url === url && Date.now() - new Date(e.timestamp).getTime() < 30000
  );

  if (!isDuplicate) {
    data.brokenImageErrors.unshift(errorEntry);
    if (data.brokenImageErrors.length > MAX_LOGS) {
      data.brokenImageErrors = data.brokenImageErrors.slice(0, MAX_LOGS);
    }
    saveAnalytics(data);
  }
};

/**
 * Retrieves full analytics report for admin dashboard
 */
export const getImageAnalyticsSummary = () => {
  const data = getStoredAnalytics();

  const sortedClicks = Object.entries(data.imageClicks || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const sortedZooms = Object.entries(data.zoomByProduct || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalClicks: data.totalClicks || 0,
    totalZooms: data.zoomEvents || 0,
    topClickedProducts: sortedClicks.slice(0, 10),
    topZoomedProducts: sortedZooms.slice(0, 10),
    brokenErrors: data.brokenImageErrors || [],
    lastUpdated: data.lastUpdated,
  };
};

/**
 * Clears stored analytics data
 */
export const clearImageAnalytics = () => {
  localStorage.removeItem(STORAGE_KEY);
};
