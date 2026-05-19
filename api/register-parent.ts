import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import { registerParentAccount } from './_lib/portal.js'

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
      lastname?: string
      firstname?: string
      childstudentref?: string
      lastName?: string
      firstName?: string
      childStudentRef?: string
    }>(req)

    const result = await registerParentAccount({
      email: body.email ?? '',
      password: body.password ?? '',
      lastName: body.lastname ?? body.lastName ?? '',
      firstName: body.firstname ?? body.firstName ?? '',
      childStudentRef: body.childstudentref ?? body.childStudentRef ?? '',
    })

    if (!result.ok) {
      return res.status(400).json({ ok: false, reason: result.reason })
    }

    return res.status(201).json({ ok: true, account: result.account })
  } catch (error) {
    console.error('API register-parent:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return res.status(500).json({ ok: false, reason: message, error: message })
  }
}
