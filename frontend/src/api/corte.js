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
  openPastRegister: (data) => api.post('/register/open-past', data),
  dayCleanup: () => api.delete('/day-cleanup'),
  getDaySummary: () => api.get('/day-cleanup/summary'),
  resetOperations: () => api.delete('/operations/reset'),
}

