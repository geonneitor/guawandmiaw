import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  notifications: [],
  
  addNotification: (message, type = 'info') => {
    const id = Date.now()
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }))
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }))
    }, 4000)
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}))
