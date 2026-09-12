import axios from 'axios';

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

// === API SERVICE METHODS ===

// 1. Admin Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// 2. Category Services
export const categoryService = {
  getCategories: () => api.get('/categories'),
  getAllAdmin: () => api.get('/categories/admin/all'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// 3. Product Services
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getBrands: () => api.get('/products/meta/brands'),
  getProductByIdentifier: (identifier) => api.get(`/products/${identifier}`),
  getFeaturedShowcase: () => api.get('/products/featured/showcase'),
  getAllAdmin: (params) => api.get('/products/admin/all', { params }),
  checkDuplicate: (data) => api.post('/products/admin/check-duplicate', data),
  create: (formData) =>
    api.post('/products/admin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    api.put(`/products/admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/products/admin/${id}`),
  toggleStatus: (id) => api.patch(`/products/admin/${id}/toggle-status`),
  toggleFeatured: (id) => api.patch(`/products/admin/${id}/toggle-featured`),
  bulkUpdateStock: (updates) => api.post('/products/admin/bulk-stock-update', { updates }),
  bulkUpdatePrice: (data) => api.post('/products/admin/bulk-price-update', data),
  importBulk: (formData) =>
    api.post('/products/admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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
  adjustStock: (id, stockQuantity, reason) =>
    api.patch(`/inventory/adjust/${id}`, { stockQuantity, reason }),
};

// 7. Banner Services
export const bannerService = {
  getActive: () => api.get('/banners'),
  getAllAdmin: () => api.get('/banners/admin/all'),
  create: (formData) =>
    api.post('/banners/admin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    api.put(`/banners/admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/banners/admin/${id}`),
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

// 11. Setting Services
export const settingService = {
  getSettings: () => api.get('/settings'),
  getPublicSettings: () => api.get('/settings/public'),
  getAdminSettings: () => api.get('/settings/admin'),
  updateSettings: (data) => api.put('/settings/admin', data),
  getBackupUrl: () => `${API_BASE}/settings/admin/backup`,
  getPublic: () => api.get('/settings/public'),
  updateAdmin: (data) => api.put('/settings/admin', data),
  downloadBackup: () => api.get('/settings/admin/backup', { responseType: 'json' }),
};

export default api;
