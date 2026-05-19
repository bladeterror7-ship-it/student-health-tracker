import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import { registerAdminAccount } from './_lib/portal.js'

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
      invitecode?: string
      lastName?: string
      firstName?: string
      inviteCode?: string
    }>(req)

    const result = await registerAdminAccount({
      email: body.email ?? '',
      password: body.password ?? '',
      lastName: body.lastname ?? body.lastName ?? '',
      firstName: body.firstname ?? body.firstName ?? '',
      inviteCode: body.invitecode ?? body.inviteCode ?? '',
    })

    if (!result.ok) {
      return res.status(400).json({ ok: false, reason: result.reason })
    }

    return res.status(201).json({ ok: true, account: result.account })
  } catch (error) {
    console.error('API register-admin:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return res.status(500).json({ ok: false, reason: message, error: message })
  }
}
