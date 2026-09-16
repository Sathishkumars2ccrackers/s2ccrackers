import axios from 'axios';
import { fetchWithCache, invalidateCatalogCache } from '../utils/apiCache';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Request interceptor: Attach Admin JWT token from localStorage if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('s2c_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && window.location.pathname.startsWith('/admin')) {
      if (!window.location.pathname.includes('/admin/login')) {
        localStorage.removeItem('s2c_admin_token');
        localStorage.removeItem('s2c_admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// === API SERVICE METHODS WITH CLIENT CACHE LAYER ===

// 1. Admin Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// 2. Category Services (Cached for 15 mins)
export const categoryService = {
  getCategories: () =>
    fetchWithCache('categories_public', () => api.get('/categories'), { ttl: 15 * 60 * 1000 }),
  getAllAdmin: () => api.get('/categories/admin/all'),
  create: async (data) => {
    const res = await api.post('/categories', data);
    invalidateCatalogCache('categories');
    invalidateCatalogCache('products');
    return res;
  },
  update: async (id, data) => {
    const res = await api.put(`/categories/${id}`, data);
    invalidateCatalogCache('categories');
    invalidateCatalogCache('products');
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    invalidateCatalogCache('categories');
    invalidateCatalogCache('products');
    return res;
  },
};

// 3. Product Services (Cached for 5-15 mins)
export const productService = {
  getProducts: (params) => {
    // Generate unique key for query params
    const cacheKey = `products_${JSON.stringify(params || {})}`;
    return fetchWithCache(cacheKey, () => api.get('/products', { params }), { ttl: 5 * 60 * 1000 });
  },
  getBrands: () =>
    fetchWithCache('brands_public', () => api.get('/products/meta/brands'), { ttl: 15 * 60 * 1000 }),
  getProductByIdentifier: (identifier) =>
    fetchWithCache(`product_${identifier}`, () => api.get(`/products/${identifier}`), { ttl: 5 * 60 * 1000 }),
  getFeaturedShowcase: () =>
    fetchWithCache('featured_showcase', () => api.get('/products/featured/showcase'), { ttl: 5 * 60 * 1000 }),
  getAllAdmin: (params) => api.get('/products/admin/all', { params }),
  checkDuplicate: (data) => api.post('/products/admin/check-duplicate', data),
  create: async (formData) => {
    const res = await api.post('/products/admin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateCatalogCache('products');
    invalidateCatalogCache('featured_showcase');
    return res;
  },
  update: async (id, formData) => {
    const res = await api.put(`/products/admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateCatalogCache('products');
    invalidateCatalogCache('featured_showcase');
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/products/admin/${id}`);
    invalidateCatalogCache('products');
    invalidateCatalogCache('featured_showcase');
    return res;
  },
  toggleStatus: async (id) => {
    const res = await api.patch(`/products/admin/${id}/toggle-status`);
    invalidateCatalogCache('products');
    invalidateCatalogCache('featured_showcase');
    return res;
  },
  toggleFeatured: async (id) => {
    const res = await api.patch(`/products/admin/${id}/toggle-featured`);
    invalidateCatalogCache('products');
    invalidateCatalogCache('featured_showcase');
    return res;
  },
  bulkUpdateStock: async (updates) => {
    const res = await api.post('/products/admin/bulk-stock-update', { updates });
    invalidateCatalogCache('products');
    return res;
  },
  bulkUpdatePrice: async (data) => {
    const res = await api.post('/products/admin/bulk-price-update', data);
    invalidateCatalogCache('products');
    return res;
  },
  importBulk: async (formData) => {
    const res = await api.post('/products/admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateCatalogCache('products');
    invalidateCatalogCache('categories');
    return res;
  },
};

// 4. Order Services
export const orderService = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  trackOrder: (orderId, phone) => api.post('/orders/track', { orderId, phone }),
  getByOrderId: (orderId) => api.get(`/orders/admin/by-id/${orderId}`),
  getAllAdmin: (params) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status, note, adminNotes) => api.patch(`/orders/admin/${id}/status`, { status, note, adminNotes }),
  cancelOrder: (id, reason) => api.patch(`/orders/admin/${id}/cancel`, { reason }),
  recordWhatsAppConfirmation: (id, data) => api.patch(`/orders/admin/${id}/whatsapp-confirm`, data),
};

// 6. Inventory Services
export const inventoryService = {
  getOverview: () => api.get('/inventory/overview'),
  adjustStock: async (id, stockQuantity, reason) => {
    const res = await api.patch(`/inventory/adjust/${id}`, { stockQuantity, reason });
    invalidateCatalogCache('products');
    return res;
  },
};

// 7. Banner Services (Cached for 10 mins)
export const bannerService = {
  getActive: () =>
    fetchWithCache('banners_active', () => api.get('/banners'), { ttl: 10 * 60 * 1000 }),
  getAllAdmin: () => api.get('/banners/admin/all'),
  create: async (formData) => {
    const res = await api.post('/banners/admin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateCatalogCache('banners');
    return res;
  },
  update: async (id, formData) => {
    const res = await api.put(`/banners/admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateCatalogCache('banners');
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/banners/admin/${id}`);
    invalidateCatalogCache('banners');
    return res;
  },
};

// 8. Customer Services (Admin Directory)
export const customerService = {
  getAllAdmin: (params) => api.get('/customers/admin/all', { params }),
  getDetailsAdmin: (id) => api.get(`/customers/admin/${id}`),
};

// 9. Activity Log Services
export const activityLogService = {
  getLogs: (params) => api.get('/activity-logs/admin', { params }),
};

// 10. Analytics & Export Services
export const analyticsService = {
  getDashboardSummary: () => api.get('/analytics/dashboard-summary'),
  getExportUrl: (type = 'orders', format = 'xlsx') =>
    `${API_BASE}/analytics/export?type=${type}&format=${format}`,
  exportData: (type = 'orders', format = 'xlsx') =>
    api.get('/analytics/export', { params: { type, format }, responseType: 'blob' }),
};

// 11. Setting Services (Cached for 10 mins)
export const settingService = {
  getSettings: () => api.get('/settings'),
  getPublicSettings: () =>
    fetchWithCache('settings_public', () => api.get('/settings/public'), { ttl: 10 * 60 * 1000 }),
  getAdminSettings: () => api.get('/settings/admin'),
  updateSettings: async (data) => {
    const res = await api.put('/settings/admin', data);
    invalidateCatalogCache('settings');
    return res;
  },
  getBackupUrl: () => `${API_BASE}/settings/admin/backup`,
  getPublic: () =>
    fetchWithCache('settings_public', () => api.get('/settings/public'), { ttl: 10 * 60 * 1000 }),
  updateAdmin: async (data) => {
    const res = await api.put('/settings/admin', data);
    invalidateCatalogCache('settings');
    return res;
  },
  downloadBackup: () => api.get('/settings/admin/backup', { responseType: 'json' }),
};

// 12. Push Notification Services (FCM & Device Management)
export const notificationService = {
  getConfig: () => api.get('/notifications/config'),
  getHealth: () => api.get('/notifications/health'),
  getDebug: () => api.get('/notifications/debug'),
  registerToken: (data) => api.post('/notifications/register-token', data),
  unregisterToken: (token) => api.post('/notifications/unregister-token', { token }),
  getDevices: () => api.get('/notifications/devices'),
  updateDevice: (id, data) => api.patch(`/notifications/devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/notifications/devices/${id}`),
  getLogs: (params) => api.get('/notifications/logs', { params }),
  sendTest: (token) => api.post('/notifications/test', { token }),
};

export { invalidateCatalogCache };
export default api;

