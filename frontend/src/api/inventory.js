import { api, getAccessToken } from './client'

export const inventoryApi = {
  getProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  openBulto: (id) => api.post(`/products/${id}/open-bulto`),
  getCategories: () => api.get('/categories'),
  getSuppliers: () => api.get('/suppliers'),
  importExcel: (formData) => api.post('/products/import', formData),
  exportExcel: async () => {
    const token = getAccessToken();
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const res = await fetch(`${baseUrl}/products/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al exportar');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_guaw_miaw_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
  }
}
