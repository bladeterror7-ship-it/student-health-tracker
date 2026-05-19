import { uid } from './uid'
import { ADMIN_INVITE_CODE } from './authConfig'
import {
  setStudentPassword,
  verifyStudentPassword,
} from './studentPasswordStorage'
import type { RegisteredStudent, UserRole } from '../types'

const STORAGE_KEY = 'pe-portal-accounts-v1'
export const PORTAL_ACCOUNTS_EVENT = 'pe-portal-accounts-changed'

export interface PortalAccount {
  id: string
  role: Exclude<UserRole, 'student'>
  email: string
  lastName: string
  firstName: string
  displayName: string
  /** Эцэг эх: холбогдсон сурагчийн ID */
  linkedStudentId?: string
  /** Эцэг эх: харуулах нэр */
  linkedStudentName?: string
  registeredAt: string
}

export type RegisterParentInput = {
  role: 'parent'
  email: string
  password: string
  lastName: string
  firstName: string
  childStudentRef: string
}

export type RegisterAdminInput = {
  role: 'admin'
  email: string
  password: string
  lastName: string
  firstName: string
  inviteCode: string
}

function dispatch() {
  window.dispatchEvent(new CustomEvent(PORTAL_ACCOUNTS_EVENT))
}

export function readPortalAccounts(): PortalAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PortalAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(list: PortalAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  dispatch()
}

export function resolveStudentRef(
  ref: string,
  students: readonly RegisteredStudent[],
): RegisteredStudent | null {
  const r = ref.trim().toLowerCase()
  if (!r) return null
  return (
    students.find((s) => {
      if (s.status !== 'active') return false
      if (s.id.toLowerCase() === r) return true
      if (s.email.toLowerCase() === r) return true
      if (s.fullName.toLowerCase().includes(r)) return true
      const compact = s.fullName.toLowerCase().replace(/\s+/g, '')
      return compact.includes(r.replace(/\s+/g, ''))
    }) ?? null
  )
}

export function registerParentAccount(
  input: RegisterParentInput,
  students: readonly RegisteredStudent[],
): { ok: true } | { ok: false; reason: string } {
  const email = input.email.trim().toLowerCase()
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  const password = input.password

  if (!email || !lastName || !firstName || !password) {
    return { ok: false, reason: 'Бүх талбарыг бөглөнө үү' }
  }

  const child = resolveStudentRef(input.childStudentRef, students)
  if (!child) {
    return {
      ok: false,
      reason: 'Сурагч олдсонгүй — ID эсвэл нэрийг шалгана уу',
    }
  }

  const accounts = readPortalAccounts()
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { ok: false, reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна' }
  }

  const row: PortalAccount = {
    id: uid('par'),
    role: 'parent',
    email,
    lastName,
    firstName,
    displayName: `${lastName} ${firstName}`,
    linkedStudentId: child.id,
    linkedStudentName: child.fullName,
    registeredAt: new Date().toISOString(),
  }

  persist([row, ...accounts])
  setStudentPassword(email, password)
  return { ok: true }
}

export function registerAdminAccount(
  input: RegisterAdminInput,
): { ok: true } | { ok: false; reason: string } {
  const email = input.email.trim().toLowerCase()
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  const password = input.password
  const code = input.inviteCode.trim()

  if (!email || !lastName || !firstName || !password) {
    return { ok: false, reason: 'Бүх талбарыг бөглөнө үү' }
  }

  if (code !== ADMIN_INVITE_CODE) {
    return { ok: false, reason: 'Админ баталгаажуулах код буруу байна' }
  }

  const accounts = readPortalAccounts()
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { ok: false, reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна' }
  }

  const row: PortalAccount = {
    id: uid('adm'),
    role: 'admin',
    email,
    lastName,
    firstName,
    displayName: `${lastName} ${firstName}`,
    registeredAt: new Date().toISOString(),
  }

  persist([row, ...accounts])
  setStudentPassword(email, password)
  return { ok: true }
}

export type AuthenticatedPortalUser = {
  account: PortalAccount
  lastName: string
  firstName: string
}

export function authenticatePortalAccount(
  identifier: string,
  password: string,
): { ok: true; data: AuthenticatedPortalUser } | { ok: false; reason: string } {
  const id = identifier.trim().toLowerCase()
  if (!id || !password) {
    return { ok: false, reason: 'И-мэйл/нэр болон нууц үгээ оруулна уу' }
  }

  const match = readPortalAccounts().find((a) => {
    const emailMatch = a.email.toLowerCase() === id
    const nameMatch = a.displayName.toLowerCase().includes(id)
    return emailMatch || nameMatch
  })

  if (!match) {
    return { ok: false, reason: 'Бүртгэл олдсонгүй' }
  }

  if (!verifyStudentPassword(match.email, password)) {
    return { ok: false, reason: 'Нууц үг буруу байна' }
  }

  return {
    ok: true,
    data: {
      account: match,
      lastName: match.lastName,
      firstName: match.firstName,
    },
  }
}
