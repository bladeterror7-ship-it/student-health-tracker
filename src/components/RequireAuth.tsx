import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { dashboardPathForRole } from '../lib/authRedirect'
import type { UserRole } from '../types'

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode
  roles?: UserRole[]
}) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(session.role)) {
    return <Navigate to={dashboardPathForRole(session.role)} replace />
  }

  return children
}
