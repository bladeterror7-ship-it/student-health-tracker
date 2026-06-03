import { sortClinicalExamRecords } from '../features/medical-exam/clinicalExamRecords'
import type {
  ClinicalExamRecord,
  ClinicalExamState,
} from '../features/medical-exam/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type ClinicalExamDto = ClinicalExamRecord & { studentId: string }

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
    throw new Error(`Серверийн алдаа (${res.status})`)
  }
}

function reasonFromPayload(data: ApiPayload, fallback: string): string {
  const reason = data.reason
  const error = data.error
  if (typeof reason === 'string' && reason) return reason
  if (typeof error === 'string' && error) return error
  return fallback
}

function parseExam(raw: unknown): ClinicalExamDto | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as ClinicalExamDto
  if (!o.id || !o.studentId || !o.examDate || !o.state) return null
  return {
    id: String(o.id),
    studentId: String(o.studentId),
    examDate: String(o.examDate).slice(0, 10),
    savedAt: String(o.savedAt ?? new Date().toISOString()),
    state: o.state,
  }
}

export function isNeonClinicalExamId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
}

export function groupClinicalExamsByStudent(
  exams: ClinicalExamDto[],
): Record<string, ClinicalExamRecord[]> {
  const out: Record<string, ClinicalExamRecord[]> = {}
  for (const e of exams) {
    const { studentId, ...record } = e
    if (!out[studentId]) out[studentId] = []
    out[studentId].push(record)
  }
  for (const sid of Object.keys(out)) {
    out[sid] = sortClinicalExamRecords(out[sid])
  }
  return out
}

export async function fetchClinicalExamsFromNeon(
  studentId?: string,
): Promise<ClinicalExamDto[]> {
  const q = studentId
    ? `?studentId=${encodeURIComponent(studentId)}`
    : ''
  const res = await fetch(`${API_BASE}/api/clinical-exams${q}`)
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Үзлэг татахад алдаа'))
  }
  const raw = data.exams
  if (!Array.isArray(raw)) return []
  return raw.map(parseExam).filter((x): x is ClinicalExamDto => x !== null)
}

export async function createClinicalExamInNeon(input: {
  studentId: string
  examDate: string
  state?: ClinicalExamState
}): Promise<ClinicalExamDto> {
  const res = await fetch(`${API_BASE}/api/clinical-exams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Үзлэг үүсгэхэд алдаа'))
  }
  const exam = parseExam(data.exam)
  if (!exam) throw new Error('Серверийн хариу буруу')
  return exam
}

export async function updateClinicalExamInNeon(input: {
  id: string
  state?: ClinicalExamState
  examDate?: string
}): Promise<ClinicalExamDto> {
  const res = await fetch(`${API_BASE}/api/clinical-exams`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Үзлэг шинэчлэхэд алдаа'))
  }
  const exam = parseExam(data.exam)
  if (!exam) throw new Error('Серверийн хариу буруу')
  return exam
}

/** Локал түүхийг Neon руу нэг удаа илгээнэ */
export function replaceExamInStudentList(
  list: ClinicalExamRecord[],
  tempId: string,
  server: ClinicalExamDto,
): ClinicalExamRecord[] {
  return sortClinicalExamRecords(
    list.map((r) =>
      r.id === tempId
        ? {
            id: server.id,
            examDate: server.examDate,
            savedAt: server.savedAt,
            state: server.state,
          }
        : r,
    ),
  )
}

export async function migrateLocalClinicalExamsToNeon(
  local: Record<string, ClinicalExamRecord[]>,
  remote: ClinicalExamDto[],
): Promise<Record<string, ClinicalExamRecord[]>> {
  const remoteIds = new Set(remote.map((r) => r.id))
  const created: ClinicalExamDto[] = []

  for (const [studentId, rows] of Object.entries(local)) {
    for (const row of rows) {
      if (remoteIds.has(row.id) && isNeonClinicalExamId(row.id)) continue
      try {
        const saved = await createClinicalExamInNeon({
          studentId,
          examDate: row.examDate,
          state: row.state,
        })
        created.push(saved)
        remoteIds.add(saved.id)
      } catch {
        /* offline эсвэл сурагч олдсонгүй */
      }
    }
  }

  const all = [...remote, ...created]
  return groupClinicalExamsByStudent(all)
}
