import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      expiresAt: null,

      setAuth: (authData) => set({
        user: authData.user,
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        isAuthenticated: true,
        expiresAt: Date.now() + (authData.expires_in || 3600) * 1000
      }),

      updateAccessToken: (token, expiresIn) => set({
        accessToken: token,
        expiresAt: Date.now() + (expiresIn || 3600) * 1000
      }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        expiresAt: null
      }),

      isTokenExpired: () => {
        const { expiresAt } = get()
        if (!expiresAt) return true
        return Date.now() > expiresAt - 60000 // Expira 1 min antes por seguridad
      }
    }),
    {
      name: '__gm_auth',
    }
  )
)
