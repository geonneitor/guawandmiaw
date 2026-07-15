import { api } from './client'

export const usersApi = {
  getAll: () => api.get('/auth/users'),
  create: (data) => api.post('/auth/users', data),
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  delete: (id) => api.delete(`/auth/users/${id}`),
}
