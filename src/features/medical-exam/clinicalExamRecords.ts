import { uid } from '../../lib/uid'
import {
  DEFAULT_CLINICAL_EXAM,
  type ClinicalExamRecord,
  type ClinicalExamState,
} from './types'

export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatExamDateMn(examDate: string): string {
  const [y, m, d] = examDate.split('-')
  if (!y || !m) return examDate
  const month = String(Number(m))
  return d ? `${y} оны ${month} сарын ${Number(d)}` : `${y} оны ${month} сар`
}

export function sortClinicalExamRecords(
  records: ClinicalExamRecord[],
): ClinicalExamRecord[] {
  return [...records].sort((a, b) => {
    const byDate = b.examDate.localeCompare(a.examDate)
    if (byDate !== 0) return byDate
    return b.savedAt.localeCompare(a.savedAt)
  })
}

export function latestClinicalExamRecord(
  records: ClinicalExamRecord[],
): ClinicalExamRecord | null {
  return sortClinicalExamRecords(records)[0] ?? null
}

function isClinicalExamState(v: unknown): v is ClinicalExamState {
  return (
    !!v &&
    typeof v === 'object' &&
    'visionOD' in v &&
    typeof (v as ClinicalExamState).visionOD === 'number'
  )
}

function isClinicalExamRecord(v: unknown): v is ClinicalExamRecord {
  if (!v || typeof v !== 'object') return false
  const r = v as ClinicalExamRecord
  return (
    typeof r.id === 'string' &&
    typeof r.examDate === 'string' &&
    typeof r.savedAt === 'string' &&
    isClinicalExamState(r.state)
  )
}

export function stateToClinicalRecord(
  state: ClinicalExamState,
  examDate?: string,
  id?: string,
): ClinicalExamRecord {
  return {
    id: id ?? uid('cex'),
    examDate: examDate ?? todayYmd(),
    savedAt: new Date().toISOString(),
    state: { ...DEFAULT_CLINICAL_EXAM, ...state, teeth: { ...state.teeth } },
  }
}

/** localStorage-ийн хуучин / шинэ бүх хэлбэрийг түүх массив болгоно */
export function normalizeClinicalExamsMap(
  raw: unknown,
): Record<string, ClinicalExamRecord[]> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, ClinicalExamRecord[]> = {}

  for (const [studentId, val] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!studentId) continue
    if (Array.isArray(val)) {
      const rows = val.filter(isClinicalExamRecord).map((r) => ({
        ...r,
        state: {
          ...DEFAULT_CLINICAL_EXAM,
          ...r.state,
          teeth: { ...r.state.teeth },
        },
      }))
      if (rows.length > 0) out[studentId] = sortClinicalExamRecords(rows)
    } else if (isClinicalExamState(val)) {
      out[studentId] = [stateToClinicalRecord(val)]
    }
  }
  return out
}

export function mergeLegacyClinicalKeys(
  map: Record<string, ClinicalExamRecord[]>,
  legacyPrefix: string,
): Record<string, ClinicalExamRecord[]> {
  const merged = { ...map }
  let changed = false
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(legacyPrefix)) continue
      const studentId = key.slice(legacyPrefix.length)
      if (!studentId || (merged[studentId]?.length ?? 0) > 0) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown
      if (isClinicalExamState(parsed)) {
        merged[studentId] = [stateToClinicalRecord(parsed)]
        changed = true
      }
    }
  } catch {
    /* ignore */
  }
  if (changed) {
    try {
      localStorage.setItem(
        'pe-shared-clinical-exams-v1',
        JSON.stringify(merged),
      )
    } catch {
      /* quota */
    }
  }
  return merged
}
