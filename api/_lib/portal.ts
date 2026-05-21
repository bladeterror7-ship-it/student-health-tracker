import bcrypt from 'bcryptjs'
import { ADMIN_INVITE_CODE } from './constants.js'
import { ensureSchema, getSql } from './db.js'

const SALT_ROUNDS = 10

export type PortalRole = 'admin' | 'parent'

export type PortalAccountRecord = {
  id: string
  role: PortalRole
  email: string
  lastName: string
  firstName: string
  displayName: string
  linkedStudentId?: string
  linkedStudentName?: string
  status: 'active' | 'inactive'
  registeredAt: string
}

type PortalRow = {
  id: string
  role: string
  email: string
  last_name: string
  first_name: string
  display_name: string
  linked_student_id: string | null
  linked_student_name: string | null
  status: string
  created_at: Date | string
}

function rowToPortal(row: PortalRow): PortalAccountRecord {
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
    role: row.role === 'admin' ? 'admin' : 'parent',
    email: String(row.email).toLowerCase(),
    lastName: row.last_name,
    firstName: row.first_name,
    displayName: row.display_name,
    ...(row.linked_student_id
      ? { linkedStudentId: String(row.linked_student_id) }
      : {}),
    ...(row.linked_student_name
      ? { linkedStudentName: row.linked_student_name }
      : {}),
    status: row.status === 'inactive' ? 'inactive' : 'active',
    registeredAt,
  }
}

export async function listPortalAccounts(
  role?: PortalRole,
): Promise<PortalAccountRecord[]> {
  await ensureSchema()
  const sql = getSql()

  const rows = role
    ? ((await sql`
        SELECT id, role, email, last_name, first_name, display_name,
          linked_student_id, linked_student_name, status, created_at
        FROM portal_accounts
        WHERE role = ${role}
        ORDER BY created_at DESC
      `) as PortalRow[])
    : ((await sql`
        SELECT id, role, email, last_name, first_name, display_name,
          linked_student_id, linked_student_name, status, created_at
        FROM portal_accounts
        ORDER BY created_at DESC
      `) as PortalRow[])

  return rows.map(rowToPortal)
}

async function findStudentByRef(ref: string) {
  const r = ref.trim().toLowerCase()
  if (!r) return null

  await ensureSchema()
  const sql = getSql()

  const rows = (await sql`
    SELECT id, full_name, email
    FROM students
    WHERE status = 'active'
      AND (
        LOWER(id::text) = ${r}
        OR LOWER(email) = ${r}
        OR LOWER(full_name) LIKE ${'%' + r + '%'}
      )
    LIMIT 1
  `) as { id: string; full_name: string; email: string }[]

  return rows[0] ?? null
}

export async function registerParentAccount(input: {
  email: string
  password: string
  lastName: string
  firstName: string
  childStudentRef: string
}): Promise<{ ok: true; account: PortalAccountRecord } | { ok: false; reason: string }> {
  const email = input.email.trim().toLowerCase()
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  const password = input.password
  const childRef = input.childStudentRef.trim()

  if (!email || !lastName || !firstName || !password || !childRef) {
    return { ok: false, reason: 'Бүх талбарыг бөглөнө үү' }
  }
  if (password.length < 6) {
    return { ok: false, reason: 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой' }
  }

  const child = await findStudentByRef(childRef)
  if (!child) {
    return {
      ok: false,
      reason: 'Сурагч олдсонгүй — и-мэйл, ID эсвэл нэрийг шалгана уу',
    }
  }

  await ensureSchema()
  const sql = getSql()

  const existing = await sql`
    SELECT id FROM portal_accounts WHERE LOWER(email) = ${email} LIMIT 1
  `
  if (existing.length > 0) {
    return { ok: false, reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна' }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const displayName = `${lastName} ${firstName}`

  const inserted = (await sql`
    INSERT INTO portal_accounts (
      role, email, password_hash, last_name, first_name, display_name,
      linked_student_id, linked_student_name, status
    )
    VALUES (
      'parent', ${email}, ${passwordHash}, ${lastName}, ${firstName}, ${displayName},
      ${child.id}::uuid, ${child.full_name}, 'active'
    )
    RETURNING id, role, email, last_name, first_name, display_name,
      linked_student_id, linked_student_name, status, created_at
  `) as PortalRow[]

  return { ok: true, account: rowToPortal(inserted[0]!) }
}

export async function registerAdminAccount(input: {
  email: string
  password: string
  lastName: string
  firstName: string
  inviteCode: string
}): Promise<{ ok: true; account: PortalAccountRecord } | { ok: false; reason: string }> {
  const email = input.email.trim().toLowerCase()
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  const password = input.password
  const code = input.inviteCode.trim()

  if (!email || !lastName || !firstName || !password) {
    return { ok: false, reason: 'Бүх талбарыг бөглөнө үү' }
  }
  if (code !== ADMIN_INVITE_CODE) {
    return { ok: false, reason: 'Админ баталгаажуулах код буруу байна' }
  }
  if (password.length < 6) {
    return { ok: false, reason: 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой' }
  }

  await ensureSchema()
  const sql = getSql()

  const existing = await sql`
    SELECT id FROM portal_accounts WHERE LOWER(email) = ${email} LIMIT 1
  `
  if (existing.length > 0) {
    return { ok: false, reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна' }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const displayName = `${lastName} ${firstName}`

  const inserted = (await sql`
    INSERT INTO portal_accounts (
      role, email, password_hash, last_name, first_name, display_name, status
    )
    VALUES (
      'admin', ${email}, ${passwordHash}, ${lastName}, ${firstName}, ${displayName}, 'active'
    )
    RETURNING id, role, email, last_name, first_name, display_name,
      linked_student_id, linked_student_name, status, created_at
  `) as PortalRow[]

  return { ok: true, account: rowToPortal(inserted[0]!) }
}

export async function loginPortalAccount(
  identifier: string,
  password: string,
  expectedRole?: PortalRole,
): Promise<{ ok: true; account: PortalAccountRecord } | { ok: false; reason: string }> {
  const id = identifier.trim().toLowerCase()
  if (!id || !password) {
    return { ok: false, reason: 'И-мэйл/нэр болон нууц үгээ оруулна уу' }
  }

  await ensureSchema()
  const sql = getSql()

  const rows = (await sql`
    SELECT id, role, email, password_hash, last_name, first_name, display_name,
      linked_student_id, linked_student_name, status, created_at
    FROM portal_accounts
    WHERE status = 'active'
      AND (
        LOWER(email) = ${id}
        OR LOWER(display_name) LIKE ${'%' + id + '%'}
      )
    LIMIT 1
  `) as (PortalRow & { password_hash: string })[]

  const row = rows[0]
  if (!row) {
    return { ok: false, reason: 'Бүртгэл олдсонгүй' }
  }

  if (expectedRole && row.role !== expectedRole) {
    return {
      ok: false,
      reason:
        expectedRole === 'admin'
          ? 'Энэ и-мэйл админ биш'
          : 'Энэ и-мэйл эцэг эх биш',
    }
  }

  const match = await bcrypt.compare(password, row.password_hash)
  if (!match) {
    return { ok: false, reason: 'Нууц үг буруу байна' }
  }

  return { ok: true, account: rowToPortal(row) }
}

export async function resetPortalPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  const password = newPassword.trim()
  if (password.length < 6) {
    throw new Error('Нууц үг дор хаяж 6 тэмдэгт байх ёстой')
  }

  await ensureSchema()
  const sql = getSql()
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const updated = (await sql`
    UPDATE portal_accounts
    SET password_hash = ${passwordHash}
    WHERE id = ${id}::uuid
    RETURNING id
  `) as { id: string }[]

  if (!updated[0]) {
    throw new Error('Хэрэглэгч олдсонгүй')
  }
}
