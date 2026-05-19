import type { RegisteredStudent } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const STUDENT_REGISTRY_EVENT = 'pe-student-registry-changed'

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string; reason?: string }
  if (!res.ok) {
    const msg =
      (data as { reason?: string }).reason ??
      (data as { error?: string }).error ??
      `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

export async function fetchStudentsFromApi(): Promise<RegisteredStudent[]> {
  const res = await fetch(`${API_BASE}/api/students`)
  const data = await parseJson<{ students: RegisteredStudent[] }>(res)
  return data.students
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
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        reason: data.reason ?? data.error ?? 'Бүртгэл амжилтгүй',
      }
    }
    window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
    return { ok: true, student: data.student }
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
    const data = await res.json()
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        reason: data.reason ?? data.error ?? 'Нэвтрэлт амжилтгүй',
      }
    }
    return { ok: true, profile: data.student }
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
  await parseJson(res)
  window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
}

export async function deleteStudentFromNeon(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/students?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await parseJson(res)
  window.dispatchEvent(new CustomEvent(STUDENT_REGISTRY_EVENT))
}
