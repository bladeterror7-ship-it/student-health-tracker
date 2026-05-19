import { createContext } from 'react'
import type { Session, UserRole } from '../types'

export interface AuthContextValue {
  session: Session | null
  login: (params: {
    role: UserRole
    email: string
    password: string
    displayName?: string
    lastName?: string
    firstName?: string
    classGroup?: string
    linkedStudentId?: string
    linkedStudentName?: string
  }) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
