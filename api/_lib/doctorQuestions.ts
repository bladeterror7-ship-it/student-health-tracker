import { ensureSchema, getSql } from './db.js'

export type DoctorQuestionRow = {
  id: string
  studentEmail: string
  studentDisplayName: string
  anonymous: boolean
  classGroup: string
  body: string
  createdAt: string
  status: 'new' | 'answered'
  reply?: string
  repliedAt?: string
}

type DbRow = {
  id: string
  student_email: string
  student_display_name: string
  anonymous: boolean
  class_group: string
  body: string
  status: string
  reply: string | null
  replied_at: Date | string | null
  created_at: Date | string
}

function toIso(v: Date | string | null | undefined): string | undefined {
  if (v == null) return undefined
  if (v instanceof Date) return v.toISOString()
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function rowToQuestion(row: DbRow): DoctorQuestionRow {
  return {
    id: String(row.id),
    studentEmail: row.student_email.toLowerCase(),
    studentDisplayName: row.student_display_name,
    anonymous: Boolean(row.anonymous),
    classGroup: row.class_group,
    body: row.body,
    status: row.status === 'answered' ? 'answered' : 'new',
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    ...(row.reply ? { reply: row.reply } : {}),
    ...(toIso(row.replied_at) ? { repliedAt: toIso(row.replied_at) } : {}),
  }
}

export async function listDoctorQuestions(): Promise<DoctorQuestionRow[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = (await sql`
    SELECT id, student_email, student_display_name, anonymous, class_group, body,
      status, reply, replied_at, created_at
    FROM doctor_questions
    ORDER BY created_at DESC
  `) as DbRow[]
  return rows.map(rowToQuestion)
}

export async function addDoctorQuestion(input: {
  studentEmail: string
  studentDisplayName: string
  anonymous: boolean
  classGroup: string
  body: string
}): Promise<DoctorQuestionRow> {
  const email = input.studentEmail.trim().toLowerCase()
  const body = input.body.trim()
  const classGroup = input.classGroup.trim()
  const displayName = input.studentDisplayName.trim()

  if (!email || !body || !classGroup) {
    throw new Error('Бүх талбарыг бөглөнө үү')
  }

  await ensureSchema()
  const sql = getSql()

  const inserted = (await sql`
    INSERT INTO doctor_questions (
      student_email, student_display_name, anonymous, class_group, body, status
    )
    VALUES (
      ${email},
      ${displayName || 'Сурагч'},
      ${input.anonymous},
      ${classGroup},
      ${body},
      'new'
    )
    RETURNING id, student_email, student_display_name, anonymous, class_group, body,
      status, reply, replied_at, created_at
  `) as DbRow[]

  return rowToQuestion(inserted[0]!)
}

export async function replyToDoctorQuestion(
  id: string,
  replyText: string,
): Promise<DoctorQuestionRow | null> {
  const reply = replyText.trim()
  if (!reply) return null

  await ensureSchema()
  const sql = getSql()

  const updated = (await sql`
    UPDATE doctor_questions
    SET status = 'answered', reply = ${reply}, replied_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING id, student_email, student_display_name, anonymous, class_group, body,
      status, reply, replied_at, created_at
  `) as DbRow[]

  if (!updated[0]) return null
  return rowToQuestion(updated[0])
}
