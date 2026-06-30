import { ensureSchema, getSql } from './db.js'

export type AppStorageRow = {
  storageKey: string
  data: string
  updatedAt: string
}

export type AppBlobRow = {
  blobKey: string
  fileName: string
  mimeType: string
  base64: string
  updatedAt: string
}

export async function listAppStorage(): Promise<AppStorageRow[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = (await sql`
    SELECT storage_key, data, updated_at
    FROM app_storage
    ORDER BY storage_key ASC
  `) as { storage_key: string; data: string; updated_at: Date | string }[]

  return rows.map((r) => ({
    storageKey: r.storage_key,
    data: r.data,
    updatedAt: new Date(r.updated_at).toISOString(),
  }))
}

export async function upsertAppStorage(
  storageKey: string,
  data: string,
): Promise<AppStorageRow> {
  await ensureSchema()
  const sql = getSql()
  const key = storageKey.trim()
  if (!key) throw new Error('storage_key шаардлагатай')

  const inserted = (await sql`
    INSERT INTO app_storage (storage_key, data, updated_at)
    VALUES (${key}, ${data}, NOW())
    ON CONFLICT (storage_key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING storage_key, data, updated_at
  `) as { storage_key: string; data: string; updated_at: Date | string }[]

  const row = inserted[0]!
  return {
    storageKey: row.storage_key,
    data: row.data,
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function upsertAppStorageBatch(
  items: { storageKey: string; data: string }[],
): Promise<number> {
  let count = 0
  for (const item of items) {
    if (!item.storageKey?.trim()) continue
    await upsertAppStorage(item.storageKey, item.data ?? '')
    count += 1
  }
  return count
}

export async function getAppBlob(blobKey: string): Promise<AppBlobRow | null> {
  await ensureSchema()
  const sql = getSql()
  const key = blobKey.trim()
  if (!key) return null

  const rows = (await sql`
    SELECT blob_key, file_name, mime_type, data, updated_at
    FROM app_blobs
    WHERE blob_key = ${key}
    LIMIT 1
  `) as {
    blob_key: string
    file_name: string
    mime_type: string
    data: Buffer | Uint8Array
    updated_at: Date | string
  }[]

  const row = rows[0]
  if (!row) return null

  const buf = Buffer.from(row.data)
  return {
    blobKey: row.blob_key,
    fileName: row.file_name,
    mimeType: row.mime_type || 'application/octet-stream',
    base64: buf.toString('base64'),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listAppBlobKeys(): Promise<string[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = (await sql`
    SELECT blob_key FROM app_blobs ORDER BY blob_key ASC
  `) as { blob_key: string }[]
  return rows.map((r) => r.blob_key)
}

export async function upsertAppBlob(input: {
  blobKey: string
  fileName: string
  mimeType?: string
  base64: string
}): Promise<AppBlobRow> {
  await ensureSchema()
  const sql = getSql()
  const key = input.blobKey.trim()
  if (!key) throw new Error('blob_key шаардлагатай')

  const buf = Buffer.from(input.base64, 'base64')
  const mime = input.mimeType?.trim() || 'application/octet-stream'
  const fileName = input.fileName?.trim() || 'file'

  const inserted = (await sql`
    INSERT INTO app_blobs (blob_key, file_name, mime_type, data, updated_at)
    VALUES (${key}, ${fileName}, ${mime}, ${buf}, NOW())
    ON CONFLICT (blob_key) DO UPDATE
    SET file_name = EXCLUDED.file_name,
        mime_type = EXCLUDED.mime_type,
        data = EXCLUDED.data,
        updated_at = NOW()
    RETURNING blob_key, file_name, mime_type, data, updated_at
  `) as {
    blob_key: string
    file_name: string
    mime_type: string
    data: Buffer | Uint8Array
    updated_at: Date | string
  }[]

  const row = inserted[0]!
  return {
    blobKey: row.blob_key,
    fileName: row.file_name,
    mimeType: row.mime_type,
    base64: Buffer.from(row.data).toString('base64'),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function deleteAppBlob(blobKey: string): Promise<boolean> {
  await ensureSchema()
  const sql = getSql()
  const key = blobKey.trim()
  if (!key) return false
  const result = await sql`
    DELETE FROM app_blobs WHERE blob_key = ${key}
  `
  return (result as unknown as { count?: number }).count !== 0
}
