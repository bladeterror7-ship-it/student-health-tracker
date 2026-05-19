import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { dashboardPathForRole } from '../lib/authRedirect'

/** Хуучин `/dashboard` холбоосыг эрхээр зөв зам руу чиглүүлнэ. */
export default function DashboardPage() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={dashboardPathForRole(session.role)} replace />
}
