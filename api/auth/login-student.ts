import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loginStudent } from '../../lib/server/students.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  try {
    const body = req.body as { email?: string; password?: string }
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
