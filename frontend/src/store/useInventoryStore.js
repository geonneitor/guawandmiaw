import { create } from 'zustand'
import { inventoryApi } from '../api/inventory'

export const useInventoryStore = create((set, get) => ({
  products: [],
  categories: [],
  loadingProducts: false,
  lastFetched: null,

  fetchProducts: async (force = false) => {
    const { products, lastFetched, loadingProducts } = get()
    
    // Si ya estamos cargando, no hacemos nada
    if (loadingProducts) return

    // Si tenemos productos y no forzamos recarga y han pasado menos de 5 minutos, usamos caché
    if (!force && products.length > 0 && lastFetched) {
      const now = new Date()
      const diff = now - lastFetched
      if (diff < 1000 * 60 * 5) {
        return // Usar caché
      }
    }

    set({ loadingProducts: true })
    try {
      const res = await inventoryApi.getProducts()
      if (res.success) {
        const cats = ['Todos', ...new Set(res.data.map(p => p.category || 'General').filter(Boolean))]
        set({ 
          products: res.data, 
          categories: cats, 
          lastFetched: new Date(),
          loadingProducts: false
        })
      } else {
        set({ loadingProducts: false })
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      set({ loadingProducts: false })
    }
  },

  forceRefresh: () => get().fetchProducts(true)
}))
