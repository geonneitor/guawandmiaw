import { create } from 'zustand'

const calculateSubtotal = (item, qty) => {
  const now = new Date()
  let hasValidPromo = false
  if (item.promo_active) {
    const start = item.promo_start_date ? new Date(item.promo_start_date + 'T00:00:00') : null
    const end = item.expiry_date ? new Date(item.expiry_date + 'T23:59:59') : null
    if ((!start || now >= start) && (!end || now <= end)) {
      hasValidPromo = true
    }
  }

  const originalSubtotal = item.price * qty

  if (hasValidPromo) {
    if (item.promo_type === 'bundle' && item.promo_min_quantity > 0) {
      const minQty = parseInt(item.promo_min_quantity, 10)
      const bundlePrice = parseFloat(item.promo_discount)
      const bundles = Math.floor(qty / minQty)
      const remainder = qty % minQty
      return { 
        subtotal: Math.round(((bundles * bundlePrice) + (remainder * item.price)) * 100) / 100, 
        hasPromo: bundles > 0 
      }
    } else if (item.promo_type === 'percent') {
      const discount = parseFloat(item.promo_discount)
      const discountedPrice = item.price * (1 - (discount / 100))
      return { subtotal: Math.round(discountedPrice * qty * 100) / 100, hasPromo: true }
    } else if (item.promo_type === 'fixed') {
      const discount = parseFloat(item.promo_discount)
      const discountedPrice = Math.max(0, item.price - discount)
      return { subtotal: Math.round(discountedPrice * qty * 100) / 100, hasPromo: true }
    }
  }
  return { subtotal: Math.round(originalSubtotal * 100) / 100, hasPromo: false }
}

export const useCartStore = create((set, get) => ({
  items: [], // [{ id, name, price, quantity, is_bulk, unit, subtotal, promo }]
  paymentMethod: 'cash',
  clientId: null,
  discount: 0,

  addItem: (product, quantity = 1) => {
    const { items } = get()
    const existing = items.find(i => i.id === product.id)
    
    if (existing) {
      get().updateQuantity(product.id, existing.quantity + quantity)
    } else {
      const safeQty = product.is_bulk ? Math.round(Number(quantity) * 100000) / 100000 : Math.round(Number(quantity) * 1000) / 1000
      const { subtotal, hasPromo } = calculateSubtotal(product, safeQty)
      set({ 
        items: [...items, { 
          ...product, 
          quantity: safeQty, 
          subtotal,
          hasPromo,
          originalPrice: product.price 
        }] 
      })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(i => i.id !== productId) })
  },

  updateQuantity: (productId, qty) => {
    const { items } = get()
    const updated = items.map(item => {
      if (item.id === productId) {
        const newQty = item.is_bulk ? Math.round(Math.max(0, qty) * 100000) / 100000 : Math.round(Math.max(0, qty) * 1000) / 1000
        const { subtotal, hasPromo } = calculateSubtotal(item, newQty)
        return { ...item, quantity: newQty, subtotal, hasPromo }
      }
      return item
    }).filter(i => i.quantity > 0)
    
    set({ items: updated })
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  
  setClient: (clientId) => set({ clientId }),

  clear: () => set({ items: [], paymentMethod: 'cash', clientId: null, discount: 0 }),

  getTotal: () => {
    const total = get().items.reduce((acc, item) => acc + item.subtotal, 0)
    return Math.round(total * 100) / 100
  },

  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0)
  }
}))
