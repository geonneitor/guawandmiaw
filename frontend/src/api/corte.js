import { api } from './client'

export const corteApi = {
  getStatus: () => api.get('/register/status'),
  getCorte: () => api.get('/corte'),
  openRegister: (data) => api.post('/register/open', data),
  closeRegister: (data) => api.post('/register/close', data),
  getMovements: () => api.get('/movements'),
  addMovement: (data) => api.post('/movements', data),
  getHistory: () => api.get('/register/history'),
  deleteHistory: () => api.delete('/register/history'),
}

