import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, handleOptions } from './_lib/cors.js'
import { listPortalAccounts, type PortalRole } from './_lib/portal.js'

function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ ok: false, reason: message, error: message })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed')
  }

  try {
    const roleRaw = req.query.role as string | undefined
    const role: PortalRole | undefined =
      roleRaw === 'admin' || roleRaw === 'parent' ? roleRaw : undefined
    const accounts = await listPortalAccounts(role)
    return res.status(200).json({ ok: true, accounts })
  } catch (error) {
    console.error('API /portal-accounts:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return sendError(res, 500, message)
  }
}
