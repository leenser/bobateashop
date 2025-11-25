import axios from 'axios';

// Resolve API base:
// - Prefer VITE_API_BASE_URL (must include protocol if cross-origin)
// - Fallback to same-origin "/api" so static hosting + backend proxy works
const rawBase = import.meta.env?.VITE_API_BASE_URL as string | undefined;
const API_BASE_URL = (rawBase && rawBase.trim().length > 0) ? rawBase.trim() : '/api';

// Helpful one-time log to verify correct target in production builds
console.info('[API] Base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API service functions
export const productsApi = {
  getAll: () => apiClient.get('/products/all'),
  getGrouped: () => apiClient.get('/products/'),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  getCategories: () => apiClient.get('/products/categories'),
  create: (data: unknown) => apiClient.post('/products/', data),
  update: (id: number, data: unknown) => apiClient.put(`/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
};

export const ordersApi = {
  getAll: (params?: { page?: number; page_size?: number; from?: string; to?: string; status?: string }) => 
    apiClient.get('/orders/', { params }),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  getReceipt: (id: number) => apiClient.get(`/orders/${id}/receipt`),
  getRecent: () => apiClient.get('/orders/recent'),
  create: (data: unknown) => apiClient.post('/orders/', data),
  refund: (id: number, data: { amount?: number; method?: string }) => 
    apiClient.post(`/orders/${id}/refund`, data),
};

export const inventoryApi = {
  getAll: () => apiClient.get('/inventory/'),
  getById: (id: number) => apiClient.get(`/inventory/${id}`),
  create: (data: unknown) => apiClient.post('/inventory/', data),
  update: (id: number, data: unknown) => apiClient.put(`/inventory/${id}`, data),
  delete: (id: number) => apiClient.delete(`/inventory/${id}`),
};

export const employeesApi = {
  getAll: () => apiClient.get('/employees/'),
  getById: (id: number) => apiClient.get(`/employees/${id}`),
  create: (data: unknown) => apiClient.post('/employees/', data),
  update: (id: number, data: unknown) => apiClient.put(`/employees/${id}`, data),
  delete: (id: number) => apiClient.delete(`/employees/${id}`),
};

export const reportsApi = {
  getXReport: () => apiClient.get('/reports/x-report'),
  getZReport: (reset: boolean = true) => apiClient.post('/reports/z-report', { reset }),
  getSummary: (params: { from: string; to: string }) => 
    apiClient.get('/reports/summary', { params }),
  getWeeklyItems: () => apiClient.get('/reports/weekly-items'),
  getDailyTop: (days?: number) => apiClient.get('/reports/daily-top', { params: days ? { days } : {} }),
};

export const metaApi = {
  getOptions: () => apiClient.get('/meta/options'),
  getHealth: () => apiClient.get('/meta/health'),
};

