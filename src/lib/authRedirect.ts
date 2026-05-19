import type { UserRole } from '../types'

export function dashboardPathForRole(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'parent') return '/parent'
  return '/dashboard'
}
