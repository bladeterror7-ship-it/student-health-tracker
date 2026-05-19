import bcrypt from 'bcryptjs'
import { ensureSchema, getSql } from './db.js'

const STUDENT_CLASS_OPTIONS = [
  '6-1',
  '7-1',
  '7-2',
  '8-1',
  '9-1',
  '10-1',
  '10-2',
  '11-1',
  '11-2',
  '12-1',
] as const

const SALT_ROUNDS = 10

export type StudentRecord = {
  id: string
  fullName: string
  lastName?: string
  firstName?: string
  classGroup: string
  email: string
  registeredAt: string
  status: 'active' | 'inactive'
}

type StudentRow = {
  id: string
  email: string
  last_name: string
  first_name: string
  full_name: string
  class_group: string
  status: string
  created_at: Date | string
}

function rowToStudent(row: StudentRow): StudentRecord {
  const created = row.created_at
  let registeredAt = new Date().toISOString()
  if (created instanceof Date) {
    registeredAt = created.toISOString()
  } else if (created) {
    const d = new Date(created)
    if (!Number.isNaN(d.getTime())) registeredAt = d.toISOString()
  }

  return {
    id: String(row.id),
    email: String(row.email).toLowerCase(),
    fullName: row.full_name,
    lastName: row.last_name,
    firstName: row.first_name,
    classGroup: row.class_group,
    registeredAt,
    status: row.status === 'inactive' ? 'inactive' : 'active',
  }
}

function isValidClass(c: string) {
  return (STUDENT_CLASS_OPTIONS as readonly string[]).includes(c)
}

export async function listStudents(): Promise<StudentRecord[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = (await sql`
    SELECT id, email, last_name, first_name, full_name, class_group, status, created_at
    FROM students
    ORDER BY created_at DESC
  `) as StudentRow[]
  return rows.map(rowToStudent)
}

export async function registerStudent(input: {
  email: string
  password: string
  lastName: string
  firstName: string
  classGroup: string
}): Promise<{ ok: true; student: StudentRecord } | { ok: false; reason: string }> {
  const email = input.email.trim().toLowerCase()
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  const classGroup = input.classGroup.trim()
  const password = input.password

  if (!email || !lastName || !firstName || !classGroup || !password) {
    return { ok: false, reason: 'Бүх талбарыг бөглөнө үү' }
  }
  if (!isValidClass(classGroup)) {
    return { ok: false, reason: 'Анги буруу байна' }
  }
  if (password.length < 6) {
    return { ok: false, reason: 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой' }
  }

  await ensureSchema()
  const sql = getSql()

  const existing = await sql`
    SELECT id FROM students WHERE LOWER(email) = ${email} LIMIT 1
  `
  if (existing.length > 0) {
    return { ok: false, reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна' }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const fullName = `${lastName} ${firstName}`

  const inserted = (await sql`
    INSERT INTO students (email, password_hash, last_name, first_name, full_name, class_group, status)
    VALUES (${email}, ${passwordHash}, ${lastName}, ${firstName}, ${fullName}, ${classGroup}, 'active')
    RETURNING id, email, last_name, first_name, full_name, class_group, status, created_at
  `) as StudentRow[]

  return { ok: true, student: rowToStudent(inserted[0]!) }
}

export async function loginStudent(
  email: string,
  password: string,
): Promise<{ ok: true; student: StudentRecord } | { ok: false; reason: string }> {
  const id = email.trim().toLowerCase()
  if (!id || !password) {
    return { ok: false, reason: 'И-мэйл болон нууц үгээ оруулна уу' }
  }

  await ensureSchema()
  const sql = getSql()

  const rows = (await sql`
    SELECT id, email, password_hash, last_name, first_name, full_name, class_group, status, created_at
    FROM students
    WHERE LOWER(email) = ${id}
    LIMIT 1
  `) as (StudentRow & { password_hash: string })[]

  const row = rows[0]
  if (!row) {
    return { ok: false, reason: 'Бүртгэл олдсонгүй' }
  }
  if (row.status !== 'active') {
    return { ok: false, reason: 'Бүртгэл идэвхгүй байна' }
  }

  const match = await bcrypt.compare(password, row.password_hash)
  if (!match) {
    return { ok: false, reason: 'Нууц үг буруу байна' }
  }

  return { ok: true, student: rowToStudent(row) }
}

export async function updateStudent(
  id: string,
  patch: Partial<Pick<StudentRecord, 'fullName' | 'classGroup' | 'email' | 'status'>>,
): Promise<void> {
  await ensureSchema()
  const sql = getSql()

  if (patch.email !== undefined) {
    await sql`UPDATE students SET email = ${patch.email.trim().toLowerCase()} WHERE id = ${id}::uuid`
  }
  if (patch.classGroup !== undefined) {
    await sql`UPDATE students SET class_group = ${patch.classGroup.trim()} WHERE id = ${id}::uuid`
  }
  if (patch.status !== undefined) {
    await sql`UPDATE students SET status = ${patch.status} WHERE id = ${id}::uuid`
  }
  if (patch.fullName !== undefined) {
    const fullName = patch.fullName.trim()
    const parts = fullName.split(/\s+/)
    const lastName = parts[0] ?? fullName
    const firstName = parts.slice(1).join(' ') || lastName
    await sql`
      UPDATE students
      SET full_name = ${fullName}, last_name = ${lastName}, first_name = ${firstName}
      WHERE id = ${id}::uuid
    `
  }
}

export async function deleteStudent(id: string): Promise<void> {
  await ensureSchema()
  const sql = getSql()
  await sql`DELETE FROM students WHERE id = ${id}::uuid`
}
