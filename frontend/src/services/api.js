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

// 1. Auth Services
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

// 4. Pincode Services
export const pincodeService = {
  checkPincode: (pincode) => api.post('/pincodes/check', { pincode }),
  getAllAdmin: (params) => api.get('/pincodes/admin/all', { params }),
  create: (data) => api.post('/pincodes/admin', data),
  update: (id, data) => api.put(`/pincodes/admin/${id}`, data),
  delete: (id) => api.delete(`/pincodes/admin/${id}`),
  importBulk: (formData) =>
    api.post('/pincodes/admin/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// 5. Order Services
export const orderService = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  trackOrder: (orderId, phone) => api.get('/orders/track', { params: { orderId, phone } }),
  getByOrderId: (orderId) => api.get(`/orders/${orderId}`),
  getAllAdmin: (params) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status, note) => api.patch(`/orders/admin/${id}/status`, { status, note }),
  cancelOrder: (id, reason) => api.patch(`/orders/admin/${id}/cancel`, { reason }),
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

// 8. Customer Services
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
};

// 11. Setting Services
export const settingService = {
  getPublicSettings: () => api.get('/settings/public'),
  getAdminSettings: () => api.get('/settings/admin'),
  updateSettings: (data) => api.put('/settings/admin', data),
  getBackupUrl: () => `${API_BASE}/settings/admin/backup`,
  getPublic: () => api.get('/settings/public'),
  updateAdmin: (data) => api.put('/settings/admin', data),
  downloadBackup: () => api.get('/settings/admin/backup', { responseType: 'json' }),
};

// 12. User Services (MongoDB Customer Profile Sync)
export const userService = {
  syncUser: (userData) => api.post('/users/sync', userData),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getProfile: (uid) => api.get(`/users/profile/${uid}`),
};

export default api;
