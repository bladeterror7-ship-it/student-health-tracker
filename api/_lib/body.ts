import type { VercelRequest } from '@vercel/node'

export function parseJsonBody<T extends Record<string, unknown>>(
  req: VercelRequest,
): T {
  const raw = req.body

  if (raw == null || raw === '') {
    return {} as T
  }

  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) {
    return raw as T
  }

  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)

  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}
