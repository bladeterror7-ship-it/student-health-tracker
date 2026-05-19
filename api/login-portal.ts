import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './_lib/body.js'
import { applyCors, handleOptions } from './_lib/cors.js'
import { loginPortalAccount, type PortalRole } from './_lib/portal.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, reason: 'POST only' })
  }

  try {
    const body = parseJsonBody<{
      email?: string
      identifier?: string
      password?: string
      role?: string
    }>(req)

    const identifier = body.email ?? body.identifier ?? ''
    const roleRaw = (body.role ?? '').toLowerCase()
    const expectedRole: PortalRole | undefined =
      roleRaw === 'admin' || roleRaw === 'parent' ? roleRaw : undefined

    const result = await loginPortalAccount(
      identifier,
      body.password ?? '',
      expectedRole,
    )

    if (!result.ok) {
      return res.status(401).json({ ok: false, reason: result.reason })
    }

    return res.status(200).json({ ok: true, account: result.account })
  } catch (error) {
    console.error('API login-portal:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return res.status(500).json({ ok: false, reason: message, error: message })
  }
}
