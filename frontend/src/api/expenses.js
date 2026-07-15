import { api } from './client'

export const expensesApi = {
  getExpenses: () => api.get('/expenses'),
  createExpense: (data) => api.post('/expenses', data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
}
