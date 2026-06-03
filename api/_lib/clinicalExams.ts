import { ensureSchema, getSql } from './db.js'

export type ClinicalExamState = {
  teeth: Record<string, 'healthy' | 'caries' | 'filled'>
  visionOD: number
  visionOS: number
  bpSystolic: number
  bpDiastolic: number
  pulseBpm: number
  cough: boolean
  breathAbnormal: boolean
}

export type ClinicalExamRecord = {
  id: string
  examDate: string
  savedAt: string
  state: ClinicalExamState
}

export type ClinicalExamDto = ClinicalExamRecord & { studentId: string }

const DEFAULT_STATE: ClinicalExamState = {
  teeth: {},
  visionOD: 1.0,
  visionOS: 1.0,
  bpSystolic: 0,
  bpDiastolic: 0,
  pulseBpm: 0,
  cough: false,
  breathAbnormal: false,
}

type DbRow = {
  id: string
  student_id: string
  exam_date: Date | string
  state: unknown
  saved_at: Date | string
}

function toIso(v: Date | string | null | undefined): string {
  if (v == null) return new Date().toISOString()
  if (v instanceof Date) return v.toISOString()
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function toYmd(v: Date | string): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const s = String(v)
  return s.length >= 10 ? s.slice(0, 10) : s
}

function normalizeState(raw: unknown): ClinicalExamState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_STATE, teeth: {} }
  }
  const o = raw as Partial<ClinicalExamState>
  return {
    teeth:
      o.teeth && typeof o.teeth === 'object'
        ? (o.teeth as ClinicalExamState['teeth'])
        : {},
    visionOD:
      typeof o.visionOD === 'number' && Number.isFinite(o.visionOD)
        ? o.visionOD
        : DEFAULT_STATE.visionOD,
    visionOS:
      typeof o.visionOS === 'number' && Number.isFinite(o.visionOS)
        ? o.visionOS
        : DEFAULT_STATE.visionOS,
    bpSystolic:
      typeof o.bpSystolic === 'number' && Number.isFinite(o.bpSystolic)
        ? o.bpSystolic
        : DEFAULT_STATE.bpSystolic,
    bpDiastolic:
      typeof o.bpDiastolic === 'number' && Number.isFinite(o.bpDiastolic)
        ? o.bpDiastolic
        : DEFAULT_STATE.bpDiastolic,
    pulseBpm:
      typeof o.pulseBpm === 'number' && Number.isFinite(o.pulseBpm)
        ? o.pulseBpm
        : DEFAULT_STATE.pulseBpm,
    cough: Boolean(o.cough),
    breathAbnormal: Boolean(o.breathAbnormal),
  }
}

function rowToDto(row: DbRow): ClinicalExamDto {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    examDate: toYmd(row.exam_date),
    savedAt: toIso(row.saved_at),
    state: normalizeState(row.state),
  }
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
  return out
}

export async function listClinicalExams(
  studentId?: string,
): Promise<ClinicalExamDto[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = studentId
    ? ((await sql`
        SELECT id, student_id, exam_date, state, saved_at
        FROM clinical_exams
        WHERE student_id = ${studentId}::uuid
        ORDER BY exam_date DESC, saved_at DESC
      `) as DbRow[])
    : ((await sql`
        SELECT id, student_id, exam_date, state, saved_at
        FROM clinical_exams
        ORDER BY exam_date DESC, saved_at DESC
      `) as DbRow[])
  return rows.map(rowToDto)
}

export async function createClinicalExam(input: {
  studentId: string
  examDate: string
  state?: ClinicalExamState
}): Promise<ClinicalExamDto | { ok: false; reason: string }> {
  await ensureSchema()
  const sql = getSql()
  const studentId = input.studentId.trim()
  const examDate = input.examDate.trim().slice(0, 10)
  if (!studentId || !examDate) {
    return { ok: false, reason: 'studentId болон examDate шаардлагатай' }
  }

  const exists = await sql`
    SELECT id FROM students WHERE id = ${studentId}::uuid LIMIT 1
  `
  if (!Array.isArray(exists) || exists.length === 0) {
    return { ok: false, reason: 'Сурагч олдсонгүй' }
  }

  const state = normalizeState(input.state ?? DEFAULT_STATE)
  const rows = (await sql`
    INSERT INTO clinical_exams (student_id, exam_date, state)
    VALUES (${studentId}::uuid, ${examDate}::date, ${JSON.stringify(state)}::jsonb)
    RETURNING id, student_id, exam_date, state, saved_at
  `) as DbRow[]

  const row = rows[0]
  if (!row) return { ok: false, reason: 'Үзлэг үүсгэж чадсангүй' }
  return rowToDto(row)
}

export async function updateClinicalExam(input: {
  id: string
  state?: ClinicalExamState
  examDate?: string
}): Promise<ClinicalExamDto | null> {
  await ensureSchema()
  const sql = getSql()
  const id = input.id.trim()
  if (!id) return null

  const current = (await sql`
    SELECT id, student_id, exam_date, state, saved_at
    FROM clinical_exams
    WHERE id = ${id}::uuid
    LIMIT 1
  `) as DbRow[]
  const row = current[0]
  if (!row) return null

  const nextState =
    input.state !== undefined ? normalizeState(input.state) : normalizeState(row.state)
  const nextDate =
    input.examDate !== undefined ? input.examDate.trim().slice(0, 10) : toYmd(row.exam_date)

  const updated = (await sql`
    UPDATE clinical_exams
    SET
      state = ${JSON.stringify(nextState)}::jsonb,
      exam_date = ${nextDate}::date,
      saved_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING id, student_id, exam_date, state, saved_at
  `) as DbRow[]

  return updated[0] ? rowToDto(updated[0]) : null
}
