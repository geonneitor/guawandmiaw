import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDashboardStore = create(
  persist(
    (set) => ({
      // Configuración de widgets: { id, visible, order }
      layout: [
        { id: 'stats', visible: true, order: 0 },
        { id: 'salesChart', visible: true, order: 1 },
        { id: 'topProducts', visible: true, order: 2 },
        { id: 'lowStock', visible: true, order: 3 },
        { id: 'recentSales', visible: true, order: 4 },
      ],

      reorder: (newLayout) => set({ layout: newLayout }),
      
      toggleVisibility: (id) => set((state) => ({
        layout: state.layout.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
      })),

      resetLayout: () => set({
        layout: [
          { id: 'stats', visible: true, order: 0 },
          { id: 'salesChart', visible: true, order: 1 },
          { id: 'topProducts', visible: true, order: 2 },
          { id: 'lowStock', visible: true, order: 3 },
          { id: 'recentSales', visible: true, order: 4 },
        ]
      })
    }),
    {
      name: '__gm_dashboard_config',
    }
  )
)
