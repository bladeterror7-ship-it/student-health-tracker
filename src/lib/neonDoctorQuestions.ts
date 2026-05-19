import type { DoctorQuestion } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const DOCTOR_QUESTIONS_EVENT = 'school-doctor-questions-changed'

type ApiPayload = Record<string, unknown>

async function readApiJson(res: Response): Promise<ApiPayload> {
  const text = await res.text()
  const trimmed = text.trim()
  if (!trimmed) throw new Error(`Сервер хоосон хариу (HTTP ${res.status})`)
  try {
    return JSON.parse(trimmed) as ApiPayload
  } catch {
    throw new Error(`Серверийн алдаа (${res.status})`)
  }
}

function reasonFrom(data: ApiPayload, fallback: string): string {
  if (typeof data.reason === 'string' && data.reason) return data.reason
  if (typeof data.error === 'string' && data.error) return data.error
  return fallback
}

export async function fetchDoctorQuestions(): Promise<DoctorQuestion[]> {
  const res = await fetch(`${API_BASE}/api/doctor-questions`, {
    headers: { Accept: 'application/json' },
  })
  const data = await readApiJson(res)
  if (!res.ok) throw new Error(reasonFrom(data, `HTTP ${res.status}`))
  return (data.questions as DoctorQuestion[]) ?? []
}

export async function postDoctorQuestion(input: {
  studentEmail: string
  studentDisplayName: string
  anonymous: boolean
  classGroup: string
  body: string
}): Promise<DoctorQuestion> {
  const res = await fetch(`${API_BASE}/api/doctor-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      studentEmail: input.studentEmail.trim().toLowerCase(),
      studentDisplayName: input.studentDisplayName.trim(),
      anonymous: input.anonymous,
      classGroup: input.classGroup.trim(),
      body: input.body.trim(),
    }),
  })
  const data = await readApiJson(res)
  if (!res.ok || data.ok !== true) {
    throw new Error(reasonFrom(data, 'Асуулт илгээхэд алдаа гарлаа'))
  }
  window.dispatchEvent(new CustomEvent(DOCTOR_QUESTIONS_EVENT))
  return data.question as DoctorQuestion
}

export async function patchDoctorReply(
  id: string,
  reply: string,
): Promise<DoctorQuestion> {
  const res = await fetch(`${API_BASE}/api/doctor-questions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id, reply }),
  })
  const data = await readApiJson(res)
  if (!res.ok || data.ok !== true) {
    throw new Error(reasonFrom(data, 'Хариу хадгалахад алдаа гарлаа'))
  }
  window.dispatchEvent(new CustomEvent(DOCTOR_QUESTIONS_EVENT))
  return data.question as DoctorQuestion
}
