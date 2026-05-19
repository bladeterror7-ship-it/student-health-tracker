import { signOut } from 'firebase/auth'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { auth } from '../firebaseConfig'
import type { Session, UserRole } from '../types'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'pe-session-v1'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Session
    if (!data.role || !data.email) return null
    return data
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    typeof window !== 'undefined' ? readSession() : null,
  )

  const login = useCallback(
    ({
      role,
      email,
      password: _password,
      displayName,
      lastName,
      firstName,
      classGroup,
      linkedStudentId,
      linkedStudentName,
    }: {
      role: UserRole
      email: string
      password: string
      displayName?: string
      lastName?: string
      firstName?: string
      classGroup?: string
      linkedStudentId?: string
      linkedStudentName?: string
    }) => {
      void _password
      const ln = lastName?.trim()
      const fn = firstName?.trim()
      const cg = classGroup?.trim()
      const sid = linkedStudentId?.trim()
      const sname = linkedStudentName?.trim()
      const fallbackName =
        role === 'admin'
          ? 'Админ'
          : role === 'parent'
            ? 'Эцэг эх'
            : 'Сурагч'
      const next: Session = {
        role,
        email: email.trim(),
        displayName:
          displayName?.trim() ||
          (ln && fn ? `${ln} ${fn}` : fallbackName),
        ...(ln ? { lastName: ln } : {}),
        ...(fn ? { firstName: fn } : {}),
        ...(cg ? { classGroup: cg } : {}),
        ...(sid ? { linkedStudentId: sid } : {}),
        ...(sname ? { linkedStudentName: sname } : {}),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSession(next)
    },
    [],
  )

  const logout = useCallback(() => {
    void signOut(auth).catch(() => {
      /* Firebase session байхгүй бол үл тооно */
    })
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
