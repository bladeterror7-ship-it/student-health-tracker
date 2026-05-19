import { neon } from '@neondatabase/serverless'

function normalizeDatabaseUrl(url: string): string {
  // channel_binding serverless дээр заримдаа асуудал үүсгэнэ
  return url.replace(/([?&])channel_binding=[^&]*&?/g, '$1').replace(/[?&]$/, '')
}

export function getSql() {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return neon(normalizeDatabaseUrl(raw))
}

export async function ensureSchema() {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      last_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      class_group TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS students_email_idx ON students (LOWER(email))
  `
}
