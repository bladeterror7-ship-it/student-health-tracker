import type { VercelRequest } from '@vercel/node'

function normalizeKeys<T extends Record<string, unknown>>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[key.toLowerCase()] = value
  }
  return out as T
}

export function parseJsonBody<T extends Record<string, unknown>>(
  req: VercelRequest,
): T {
  const raw = req.body

  if (raw == null || raw === '') {
    return {} as T
  }

  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) {
    return normalizeKeys<T>(raw as Record<string, unknown>)
  }

  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw).trim()
  if (!text) return {} as T

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    return normalizeKeys<T>(parsed)
  } catch {
    return {} as T
  }
}
