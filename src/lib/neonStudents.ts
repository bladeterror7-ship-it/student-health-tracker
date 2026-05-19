import type { RegisteredStudent } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const STUDENT_REGISTRY_EVENT = 'pe-student-registry-changed'

type ApiPayload = Record<string, unknown>

async function readApiJson(res: Response): Promise<ApiPayload> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error('Сервер хоосон хариу буцаалаа')
  }
  try {
    return JSON.parse(text) as ApiPayload
  } catch {
    if (text.trimStart().startsWith('<')) {
      throw new Error(
        'API ажиллахгүй байна. Vercel дээр DATABASE_URL тохируулсан эсэхээ шалгана уу.',
      )
    }
    throw new Error('Серверийн хариу буруу байна')
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
  const res = await fetch(`${API_BASE}/api/students`)
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
    const res = await fetch(`${API_BASE}/api/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
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
    const res = await fetch(`${API_BASE}/api/auth/login-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
    headers: { 'Content-Type': 'application/json' },
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
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, `HTTP ${res.status}`))
  }
  window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
}
