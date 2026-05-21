import type { UserRole } from '../types'

export type PortalAccount = {
  id: string
  role: Exclude<UserRole, 'student'>
  email: string
  lastName: string
  firstName: string
  displayName: string
  linkedStudentId?: string
  linkedStudentName?: string
  status?: 'active' | 'inactive'
  registeredAt: string
}

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

type ApiPayload = Record<string, unknown>

async function readApiJson(res: Response): Promise<ApiPayload> {
  const text = await res.text()
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error(`Сервер хоосон хариу (HTTP ${res.status})`)
  }
  try {
    return JSON.parse(trimmed) as ApiPayload
  } catch {
    if (trimmed.startsWith('<')) {
      throw new Error('API олдсонгүй — deploy шалгана уу')
    }
    throw new Error(`Серверийн алдаа (${res.status})`)
  }
}

function reasonFromPayload(data: ApiPayload, fallback: string): string {
  if (typeof data.reason === 'string' && data.reason) return data.reason
  if (typeof data.error === 'string' && data.error) return data.error
  return fallback
}

function accountFromPayload(data: ApiPayload): PortalAccount | null {
  const raw = data.account
  if (!raw || typeof raw !== 'object') return null
  const a = raw as PortalAccount
  if (!a.id || !a.email || !a.role) return null
  return a
}

export async function registerParentWithNeon(input: {
  email: string
  password: string
  lastName: string
  firstName: string
  childStudentRef: string
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/register-parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        lastName: input.lastName.trim(),
        firstName: input.firstName.trim(),
        childStudentRef: input.childStudentRef.trim(),
      }),
    })
    const data = await readApiJson(res)
    if (!res.ok || data.ok !== true) {
      return { ok: false, reason: reasonFromPayload(data, 'Бүртгэл амжилтгүй') }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Серверт холбогдож чадсангүй',
    }
  }
}

export async function registerAdminWithNeon(input: {
  email: string
  password: string
  lastName: string
  firstName: string
  inviteCode: string
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        lastName: input.lastName.trim(),
        firstName: input.firstName.trim(),
        inviteCode: input.inviteCode.trim(),
      }),
    })
    const data = await readApiJson(res)
    if (!res.ok || data.ok !== true) {
      return { ok: false, reason: reasonFromPayload(data, 'Бүртгэл амжилтгүй') }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Серверт холбогдож чадсангүй',
    }
  }
}

function accountFromListItem(raw: unknown): PortalAccount | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as PortalAccount
  if (!a.id || !a.email || !a.role) return null
  return a
}

export async function fetchPortalAccountsFromApi(
  role?: 'parent' | 'admin',
): Promise<PortalAccount[]> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : ''
  const res = await fetch(`${API_BASE}/api/portal-accounts${qs}`, {
    headers: { Accept: 'application/json' },
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Эцэг эхийн жагсаалт ачаалахад алдаа'))
  }
  const raw = data.accounts
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => accountFromListItem(item))
    .filter((a): a is PortalAccount => a !== null)
}

export async function resetPortalPasswordInNeon(
  id: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reset-portal-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id, newPassword }),
  })
  const data = await readApiJson(res)
  if (!res.ok || data.ok !== true) {
    throw new Error(reasonFromPayload(data, 'Нууц үг сэргээхэд алдаа'))
  }
}

export async function signInPortalWithNeon(
  identifier: string,
  password: string,
  role: Exclude<UserRole, 'student'>,
): Promise<
  | {
      ok: true
      account: PortalAccount
      lastName: string
      firstName: string
    }
  | { ok: false; reason: string }
> {
  try {
    const res = await fetch(`${API_BASE}/api/login-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
        role,
      }),
    })
    const data = await readApiJson(res)
    const account = accountFromPayload(data)

    if (account && (data.ok === true || res.ok)) {
      return {
        ok: true,
        account,
        lastName: account.lastName,
        firstName: account.firstName,
      }
    }

    if (!res.ok || data.ok === false) {
      return { ok: false, reason: reasonFromPayload(data, 'Нэвтрэлт амжилтгүй') }
    }

    return { ok: false, reason: 'Серверээс бүртгэлийн мэдээлэл ирээгүй' }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Серверт холбогдож чадсангүй',
    }
  }
}
