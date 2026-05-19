import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import { loginStudent } from '../lib/server/students.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'POST only' })
  }

  try {
    const body = parseJsonBody<{ email?: string; password?: string }>(req)
    const result = await loginStudent(body.email ?? '', body.password ?? '')

    if (!result.ok) {
      return res.status(401).json({ ok: false, reason: result.reason })
    }

    return res.status(200).json({ ok: true, student: result.student })
  } catch (error) {
    console.error('API login-student:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return res.status(500).json({ ok: false, reason: message })
  }
}
