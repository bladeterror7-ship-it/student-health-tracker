import {
  mergeLegacyClinicalKeys,
  normalizeClinicalExamsMap,
} from '../features/medical-exam/clinicalExamRecords'
import type { ClinicalExamRecord } from '../features/medical-exam/types'
import type {
  MedicalRecord,
  StudentHealthAlert,
  StudentHealthProfile,
} from '../types'
import { uid } from './uid'

export const MEDICAL_CHANGED_EVENT = 'pe-medical-shared-changed'

const LS_RECORDS = 'pe-shared-medical-records-v1'
const LS_ALERTS = 'pe-shared-medical-alerts-v1'
const LS_PROFILES = 'pe-shared-medical-profiles-v1'
const LS_CLINICAL = 'pe-shared-clinical-exams-v1'

export const MEDICAL_STORAGE_KEYS = [
  LS_RECORDS,
  LS_ALERTS,
  LS_PROFILES,
  LS_CLINICAL,
] as const

const LEGACY_SEED_STUDENT_IDS = new Set(['seed_demo', 'seed_1', 'seed_2'])
const LEGACY_SEED_RECORD_IDS = new Set(['m1', 'm2', 'md_demo_hist_1', 'md_demo_hist_2', 'md_demo_hist_3'])
const LEGACY_SEED_ALERT_IDS = new Set(['seed_alert_m2', 'demo_sa_1', 'demo_sa_2'])

export type MedicalBundle = {
  records: MedicalRecord[]
  alerts: StudentHealthAlert[]
  profiles: Record<string, StudentHealthProfile>
  clinicalExams: Record<string, ClinicalExamRecord[]>
}

export function emptyMedicalBundle(): MedicalBundle {
  return { records: [], alerts: [], profiles: {}, clinicalExams: {} }
}

function isLegacySeedRecord(row: MedicalRecord): boolean {
  if (LEGACY_SEED_RECORD_IDS.has(row.id)) return true
  if (LEGACY_SEED_STUDENT_IDS.has(row.studentId)) return true
  return false
}

function isLegacySeedAlert(row: StudentHealthAlert): boolean {
  if (LEGACY_SEED_ALERT_IDS.has(row.id)) return true
  if (LEGACY_SEED_STUDENT_IDS.has(row.studentId)) return true
  return false
}

function stripLegacyProfiles(
  profiles: Record<string, StudentHealthProfile>,
): Record<string, StudentHealthProfile> {
  const out: Record<string, StudentHealthProfile> = {}
  for (const [k, v] of Object.entries(profiles)) {
    if (LEGACY_SEED_STUDENT_IDS.has(k) || LEGACY_SEED_STUDENT_IDS.has(v.studentId)) {
      continue
    }
    out[k] = v
  }
  return out
}

function parseProfiles(raw: unknown): Record<string, StudentHealthProfile> {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const out: Record<string, StudentHealthProfile> = {}
  for (const [k, v] of Object.entries(o)) {
    const p = v as StudentHealthProfile
    if (p?.studentId && p.vitals && p.overallStatus) out[k] = p
  }
  return stripLegacyProfiles(out)
}

function sanitizeBundle(bundle: MedicalBundle): MedicalBundle {
  return {
    records: bundle.records.filter(
      (row) =>
        row.studentId &&
        typeof row.recordType === 'string' &&
        row.recordType.length > 0 &&
        !isLegacySeedRecord(row),
    ),
    alerts: bundle.alerts.filter(
      (x) => x.studentId && x.text && !isLegacySeedAlert(x),
    ),
    profiles: stripLegacyProfiles(bundle.profiles),
    clinicalExams: bundle.clinicalExams ?? {},
  }
}

const LEGACY_CLINICAL_PREFIX = 'medical-clinical-exam-v1:'

export function loadMedicalBundle(): MedicalBundle {
  try {
    const rRaw = localStorage.getItem(LS_RECORDS)
    const aRaw = localStorage.getItem(LS_ALERTS)
    const pRaw = localStorage.getItem(LS_PROFILES)
    const cRaw = localStorage.getItem(LS_CLINICAL)
    if (!rRaw && !aRaw && !pRaw && !cRaw) {
      return emptyMedicalBundle()
    }

    const records = rRaw ? (JSON.parse(rRaw) as MedicalRecord[]) : []
    const alerts = aRaw ? (JSON.parse(aRaw) as StudentHealthAlert[]) : []
    const profiles = pRaw ? parseProfiles(JSON.parse(pRaw)) : {}
    const clinicalRaw = cRaw ? JSON.parse(cRaw) : {}
    let clinicalExams = normalizeClinicalExamsMap(clinicalRaw)
    clinicalExams = mergeLegacyClinicalKeys(
      clinicalExams,
      LEGACY_CLINICAL_PREFIX,
    )

    const bundle = sanitizeBundle({
      records: Array.isArray(records) ? records : [],
      alerts: Array.isArray(alerts) ? alerts : [],
      profiles,
      clinicalExams,
    })

    return bundle
  } catch {
    return emptyMedicalBundle()
  }
}

export function persistMedicalBundle(bundle: MedicalBundle) {
  const clean = sanitizeBundle(bundle)
  try {
    localStorage.setItem(LS_RECORDS, JSON.stringify(clean.records))
    localStorage.setItem(LS_ALERTS, JSON.stringify(clean.alerts))
    localStorage.setItem(LS_PROFILES, JSON.stringify(clean.profiles))
    localStorage.setItem(LS_CLINICAL, JSON.stringify(clean.clinicalExams))
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent(MEDICAL_CHANGED_EVENT))
}

export function bumpLastCheckup(
  profiles: Record<string, StudentHealthProfile>,
  studentId: string,
  dateIsoYmd: string,
): Record<string, StudentHealthProfile> {
  const prev = profiles[studentId]
  const base =
    prev ??
    ({
      studentId,
      overallStatus: 'Хяналтад байна',
      lastCheckup: dateIsoYmd,
      vitals: { pulse: '—', pressure: '—', vision: '—' },
    } satisfies StudentHealthProfile)
  const cur = prev?.lastCheckup ?? ''
  const nextLc =
    dateIsoYmd.localeCompare(cur) > 0 || !cur ? dateIsoYmd : base.lastCheckup
  return {
    ...profiles,
    [studentId]: { ...base, lastCheckup: nextLc },
  }
}

export function resolvedProfileFallback(
  studentId: string,
  profiles: Record<string, StudentHealthProfile>,
  records: MedicalRecord[],
): StudentHealthProfile {
  const mine = profiles[studentId]
  const dated = [...records.filter((r) => r.studentId === studentId)].sort(
    (a, b) => b.date.localeCompare(a.date),
  )
  const lastFromRecords = dated[0]?.date ?? ''

  if (mine) {
    const lc =
      lastFromRecords.localeCompare(mine.lastCheckup) > 0
        ? lastFromRecords
        : mine.lastCheckup
    return { ...mine, lastCheckup: lc || mine.lastCheckup }
  }
  const lastCheckup =
    lastFromRecords || new Date().toISOString().slice(0, 10)
  return {
    studentId,
    overallStatus:
      dated.length > 0 ? 'Хяналтад байна' : 'Өгөгдөл бүртгэгдээгүй байна',
    lastCheckup,
    vitals: { pulse: '—', pressure: '—', vision: '—' },
  }
}

export function newMedicalRow(input: Omit<MedicalRecord, 'id'>): MedicalRecord {
  return { ...input, id: uid('md') }
}

export function newHealthAlert(input: Omit<StudentHealthAlert, 'id'>): StudentHealthAlert {
  return { ...input, id: uid('al') }
}
