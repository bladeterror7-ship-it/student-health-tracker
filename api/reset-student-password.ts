import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import { resetStudentPassword } from './_lib/students.js'

function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ ok: false, reason: message, error: message })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed')
  }

  try {
    const body = parseJsonBody<{ id?: string; newPassword?: string; newpassword?: string }>(
      req,
    )
    const id = body.id
    const newPassword = body.newPassword ?? body.newpassword ?? ''
    if (!id || !newPassword) {
      return sendError(res, 400, 'id болон newPassword шаардлагатай')
    }

    await resetStudentPassword(id, newPassword)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('API /reset-student-password:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return sendError(res, 500, message)
  }
}
