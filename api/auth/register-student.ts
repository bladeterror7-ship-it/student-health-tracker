import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerStudent } from '../../lib/server/students.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  try {
    const body = req.body as {
      email?: string
      password?: string
      lastName?: string
      firstName?: string
      classGroup?: string
    }

    const result = await registerStudent({
      email: body.email ?? '',
      password: body.password ?? '',
      lastName: body.lastName ?? '',
      firstName: body.firstName ?? '',
      classGroup: body.classGroup ?? '',
    })

    if (!result.ok) {
      return res.status(400).json({ ok: false, reason: result.reason })
    }

    return res.status(201).json({ ok: true, student: result.student })
  } catch (error) {
    console.error('API register-student:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return res.status(500).json({ ok: false, reason: message })
  }
}
