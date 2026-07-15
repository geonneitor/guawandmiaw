import React from 'react'
import { useAuthStore } from '../store/useAuthStore'

const RoleGuard = ({ children, roles = [], fallback = null }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) return fallback
  
  if (roles.length > 0 && !roles.includes(user.role)) {
    return fallback
  }

  return <>{children}</>
}

export default RoleGuard
