import { useAuthStore } from '../store/useAuthStore'

// Use VITE_API_URL if defined, otherwise fallback to local /api/v1 (useful for local testing)
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

async function request(method, path, body = null) {
  const { accessToken, logout } = useAuthStore.getState()

  const headers = {}
  
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    })

    if (response.status === 401) {
      logout()
      window.location.href = '/login'
      return { success: false, error: 'Sesión expirada' }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    return { success: false, error: 'Error de conexión con el servidor' }
  }
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
}

export const getAccessToken = () => useAuthStore.getState().accessToken;
