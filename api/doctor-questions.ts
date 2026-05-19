import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import {
  addDoctorQuestion,
  listDoctorQuestions,
  replyToDoctorQuestion,
} from './_lib/doctorQuestions.js'

function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ ok: false, reason: message, error: message })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, POST, PATCH, OPTIONS')
  if (handleOptions(req, res)) return

  try {
    if (req.method === 'GET') {
      const questions = await listDoctorQuestions()
      return res.status(200).json({ ok: true, questions })
    }

    if (req.method === 'POST') {
      const body = parseJsonBody<{
        studentemail?: string
        studentdisplayname?: string
        anonymous?: boolean
        classgroup?: string
        body?: string
        studentEmail?: string
        studentDisplayName?: string
        classGroup?: string
      }>(req)

      const question = await addDoctorQuestion({
        studentEmail: body.studentemail ?? body.studentEmail ?? '',
        studentDisplayName:
          body.studentdisplayname ?? body.studentDisplayName ?? 'Сурагч',
        anonymous: Boolean(body.anonymous),
        classGroup: body.classgroup ?? body.classGroup ?? '',
        body: body.body ?? '',
      })
      return res.status(201).json({ ok: true, question })
    }

    if (req.method === 'PATCH') {
      const body = parseJsonBody<{ id?: string; reply?: string }>(req)
      if (!body.id || !body.reply) {
        return sendError(res, 400, 'id болон reply шаардлагатай')
      }
      const updated = await replyToDoctorQuestion(body.id, body.reply)
      if (!updated) {
        return sendError(res, 404, 'Асуулт олдсонгүй')
      }
      return res.status(200).json({ ok: true, question: updated })
    }

    return sendError(res, 405, 'Method not allowed')
  } catch (error) {
    console.error('API /doctor-questions:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return sendError(res, 500, message)
  }
}
