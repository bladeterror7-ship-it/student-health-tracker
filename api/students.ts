import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import {
  deleteStudent,
  listStudents,
  updateStudent,
} from './_lib/students.js'

function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ ok: false, reason: message, error: message })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, PATCH, DELETE, OPTIONS')
  if (handleOptions(req, res)) return

  try {
    if (req.method === 'GET') {
      const students = await listStudents()
      return res.status(200).json({ ok: true, students })
    }

    if (req.method === 'PATCH') {
      const body = parseJsonBody<{ id?: string; patch?: Record<string, unknown> }>(req)
      if (!body.id || !body.patch) {
        return sendError(res, 400, 'id болон patch шаардлагатай')
      }
      await updateStudent(body.id, body.patch)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id =
        (req.query.id as string) ||
        parseJsonBody<{ id?: string }>(req).id
      if (!id) return sendError(res, 400, 'id шаардлагатай')
      await deleteStudent(id)
      return res.status(200).json({ ok: true })
    }

    return sendError(res, 405, 'Method not allowed')
  } catch (error) {
    console.error('API /students:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return sendError(res, 500, message)
  }
}
