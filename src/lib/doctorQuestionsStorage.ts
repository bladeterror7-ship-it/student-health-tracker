import type { DoctorQuestion } from '../types'
import { uid } from './uid'

const STORAGE_KEY = 'school-doctor-questions-v1'

export const DOCTOR_QUESTIONS_EVENT = 'school-doctor-questions-changed'

const LEGACY_SEED_IDS = new Set(['dq_seed_1', 'dq_seed_2', 'dq_seed_3'])

function stripLegacySeeds(list: DoctorQuestion[]): DoctorQuestion[] {
  return list.filter((q) => !LEGACY_SEED_IDS.has(q.id))
}

function persist(list: DoctorQuestion[]) {
  const clean = stripLegacySeeds(list)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent(DOCTOR_QUESTIONS_EVENT))
}

export function readDoctorQuestions(): DoctorQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DoctorQuestion[]
    if (!Array.isArray(parsed)) return []
    const cleaned = stripLegacySeeds(parsed)
    if (cleaned.length !== parsed.length) persist(cleaned)
    return cleaned
  } catch {
    return []
  }
}

export function writeDoctorQuestions(next: DoctorQuestion[]) {
  persist(next)
}

export function addDoctorQuestion(input: {
  studentEmail: string
  studentDisplayName: string
  anonymous: boolean
  classGroup: string
  body: string
}): DoctorQuestion {
  const row: DoctorQuestion = {
    id: uid('dq'),
    studentEmail: input.studentEmail.trim().toLowerCase(),
    studentDisplayName: input.studentDisplayName.trim(),
    anonymous: input.anonymous,
    classGroup: input.classGroup.trim(),
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    status: 'new',
  }
  const next = [row, ...readDoctorQuestions()]
  writeDoctorQuestions(next)
  return row
}

export function replyToDoctorQuestion(
  id: string,
  replyText: string,
): DoctorQuestion | null {
  const reply = replyText.trim()
  if (!reply) return null
  const list = readDoctorQuestions()
  const idx = list.findIndex((q) => q.id === id)
  if (idx === -1) return null
  const prev = list[idx]
  const updated: DoctorQuestion = {
    ...prev,
    status: 'answered',
    reply,
    repliedAt: new Date().toISOString(),
  }
  const next = [...list]
  next[idx] = updated
  writeDoctorQuestions(next)
  return updated
}
