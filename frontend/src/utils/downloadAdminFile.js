import api from '../services/api';

/**
 * Downloads a protected file from the admin backend with JWT authentication.
 * 
 * @param {string} endpoint - API endpoint or full relative URL (e.g. '/analytics/export?type=orders&format=xlsx')
 * @param {string} [defaultFilename] - Fallback filename if Content-Disposition header is missing
 * @param {object} [options] - Additional Axios config (params, headers, etc.)
 * @returns {Promise<{ filename: string, size: number }>}
 */
export const downloadAdminFile = async (endpoint, defaultFilename = 'download', options = {}) => {
  try {
    const token = localStorage.getItem('s2c_admin_token');
    
    // Perform request expecting binary Blob
    const response = await api.get(endpoint, {
      responseType: 'blob',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    // Check if the response is actually an error payload in JSON format (received as blob)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await response.data.text();
      try {
        const errorJson = JSON.parse(text);
        if (errorJson && errorJson.success === false) {
          throw new Error(errorJson.message || 'Export failed on server.');
        }
      } catch (jsonErr) {
        if (jsonErr.message && !jsonErr.message.includes('Unexpected token')) {
          throw jsonErr;
        }
      }
    }

    // Extract filename from Content-Disposition header if present
    let filename = defaultFilename;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '').trim();
      }
    }

    // Create a temporary object URL for the received blob
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
    const blobUrl = window.URL.createObjectURL(blob);

    // Create invisible anchor tag to trigger browser download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Clean up DOM and revoke Blob URL
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

    return { filename, size: blob.size };
  } catch (error) {
    // If error response is a blob, decode the JSON error message
    if (error.response && error.response.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const parsed = JSON.parse(errorText);
        if (parsed?.message) {
          throw new Error(parsed.message);
        }
      } catch (parseErr) {
        if (parseErr.message && parseErr !== error) {
          throw parseErr;
        }
      }
    }
    throw error;
  }
};

/**
 * Helper to download analytics dataset exports (xlsx, csv)
 * @param {'orders'|'products'|'inventory'|'customers'|'activity-logs'|'pincodes'} type
 * @param {'xlsx'|'csv'} [format='xlsx']
 * @param {string} [customFilename]
 */
export const downloadExport = async (type, format = 'xlsx', customFilename = null) => {
  const fallback = customFilename || `s2c-${type}-${new Date().toISOString().slice(0, 10)}.${format}`;
  return downloadAdminFile(`/analytics/export?type=${encodeURIComponent(type)}&format=${encodeURIComponent(format)}`, fallback);
};

export default downloadAdminFile;
