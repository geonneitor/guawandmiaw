import { api } from './client'

export const salesApi = {
  getSales: () => api.get('/sales'),
  getSale: (id) => api.get(`/sales/${id}`),
  createSale: (data) => api.post('/sales', data),
  getStats: () => api.get('/stats'),
  getSalesReport: (params) => api.get('/reports/sales', params),
  getAdvancedReports: (params) => api.get('/reports/advanced', params),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  clearAll: () => api.delete('/sales/all'),
}
