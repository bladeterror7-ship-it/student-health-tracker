import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import { registerStudent } from '../lib/server/students.js'

export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'POST only' })
  }

  try {
    const body = parseJsonBody<{
      email?: string
      password?: string
      lastName?: string
      firstName?: string
      classGroup?: string
    }>(req)

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
