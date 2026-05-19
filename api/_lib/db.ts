import { neon } from '@neondatabase/serverless'

function normalizeDatabaseUrl(raw: string): string {
  let url = raw.trim().replace(/^['"]|['"]$/g, '')
  url = url.replace(/([?&])channel_binding=[^&]*&?/g, '$1')
  url = url.replace(/[?&]$/, '')
  return url
}

export function getSql() {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return neon(normalizeDatabaseUrl(raw))
}

let schemaReady: Promise<void> | null = null

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql()
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`
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
    })().catch((error) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await ensureSchema()
    const sql = getSql()
    await sql`SELECT 1 AS ok`
    return true
  } catch {
    return false
  }
}
