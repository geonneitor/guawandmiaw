import { api } from './client'

export const reportsApi = {
  getSales: (params = '') => api.get(`/reports/sales${params ? '?' + params : ''}`),
  getAdvanced: (period = 'month') => api.get(`/reports/advanced?period=${period}`),
}
