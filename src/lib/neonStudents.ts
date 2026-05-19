import type { RegisteredStudent } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

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
    const res = await fetch(`${API_BASE}/api/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        lastName: input.lastName.trim(),
        firstName: input.firstName.trim(),
        classGroup: input.classGroup.trim(),
      }),
    })
    const data = await readApiJson(res)
    if (!res.ok || data.ok !== true) {
      return {
        ok: false,
        reason: reasonFromPayload(data, 'Бүртгэл амжилтгүй'),
      }
    }
    window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
    return { ok: true, student: data.student as RegisteredStudent }
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
    const res = await fetch(`${API_BASE}/api/login-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    })
    const data = await readApiJson(res)
    if (!res.ok || data.ok !== true) {
      return {
        ok: false,
        reason: reasonFromPayload(data, 'Нэвтрэлт амжилтгүй'),
      }
    }
    return { ok: true, profile: data.student as RegisteredStudent }
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
