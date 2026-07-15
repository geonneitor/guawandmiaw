import { api } from './client'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  refresh: (token) => api.post('/auth/refresh', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getUsersList: () => api.get('/auth/users-list'),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  updatePreferences: (data) => api.put('/auth/preferences', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.delete('/auth/logout'),
}
