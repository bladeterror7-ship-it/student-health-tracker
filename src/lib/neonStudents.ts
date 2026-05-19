import type { RegisteredStudent } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const LOGIN_URLS = ['/api/login-student', '/api/auth/login-student']
const REGISTER_URLS = ['/api/register-student', '/api/auth/register-student']

export const STUDENT_REGISTRY_EVENT = 'pe-student-registry-changed'

type ApiPayload = Record<string, unknown>

async function readApiJson(res: Response): Promise<ApiPayload> {
  const text = await res.text()
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error(`Сервер хоосон хариу буцаалаа (HTTP ${res.status})`)
  }

  try {
    return JSON.parse(trimmed) as ApiPayload
  } catch {
    if (trimmed.startsWith('<')) {
      throw new Error(
        'API олдсонгүй. Vercel deploy дахин хийгээд /api/health шалгана уу.',
      )
    }
    if (trimmed.includes('NOT_FOUND') || trimmed.includes('DEPLOYMENT_NOT_FOUND')) {
      throw new Error('API олдсонгүй — сайтаа дахин deploy хийнэ үү')
    }
    const preview = trimmed.slice(0, 80).replace(/\s+/g, ' ')
    throw new Error(`Серверийн алдаа (${res.status}): ${preview}`)
  }
}

function reasonFromPayload(data: ApiPayload, fallback: string): string {
  const reason = data.reason
  const error = data.error
  if (typeof reason === 'string' && reason) return reason
  if (typeof error === 'string' && error) return error
  return fallback
}

function studentFromPayload(data: ApiPayload): RegisteredStudent | null {
  const raw = data.student ?? data.profile
  if (!raw || typeof raw !== 'object') return null
  const s = raw as RegisteredStudent
  if (!s.id || !s.email) return null
  return s
}

async function postJson(url: string, body: unknown): Promise<{ res: Response; data: ApiPayload }> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await readApiJson(res)
  return { res, data }
}

async function postWithFallback(
  urls: string[],
  body: unknown,
): Promise<{ res: Response; data: ApiPayload }> {
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      return await postJson(url, body)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }
  throw lastError ?? new Error('Серверт холбогдож чадсангүй')
}

export async function fetchStudentsFromApi(): Promise<RegisteredStudent[]> {
  const res = await fetch(`${API_BASE}/api/students`, {
    headers: { Accept: 'application/json' },
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, `HTTP ${res.status}`))
  }
  return (data.students as RegisteredStudent[]) ?? []
}

export async function registerStudentWithNeon(input: {
  email: string
  password: string
  lastName: string
  firstName: string
  classGroup: string
}): Promise<{ ok: true; student: RegisteredStudent } | { ok: false; reason: string }> {
  try {
    const payload = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      lastName: input.lastName.trim(),
      firstName: input.firstName.trim(),
      classGroup: input.classGroup.trim(),
    }
    const { res, data } = await postWithFallback(REGISTER_URLS, payload)
    const student = studentFromPayload(data)

    if (!res.ok || (!student && data.ok !== true)) {
      return {
        ok: false,
        reason: reasonFromPayload(data, 'Бүртгэл амжилтгүй'),
      }
    }
    if (!student) {
      return { ok: false, reason: 'Серверээс сурагчийн мэдээлэл ирээгүй' }
    }
    window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
    return { ok: true, student }
  } catch (error) {
    console.error('Neon register:', error)
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Серверт холбогдож чадсангүй',
    }
  }
}

export async function signInStudentWithNeon(
  email: string,
  password: string,
): Promise<
  { ok: true; profile: RegisteredStudent } | { ok: false; reason: string }
> {
  try {
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    }
    const { res, data } = await postWithFallback(LOGIN_URLS, payload)
    const student = studentFromPayload(data)

    if (student && (data.ok === true || res.ok)) {
      return { ok: true, profile: student }
    }

    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        reason: reasonFromPayload(data, 'Нэвтрэлт амжилтгүй'),
      }
    }

    return { ok: false, reason: 'Серверээс сурагчийн мэдээлэл ирээгүй' }
  } catch (error) {
    console.error('Neon login:', error)
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Серверт холбогдож чадсангүй',
    }
  }
}

export async function updateStudentInNeon(
  id: string,
  patch: Partial<
    Pick<RegisteredStudent, 'fullName' | 'classGroup' | 'email' | 'status'>
  >,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/students`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ id, patch }),
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, `HTTP ${res.status}`))
  }
  window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
}

export async function deleteStudentFromNeon(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/students?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, `HTTP ${res.status}`))
  }
  window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
}
