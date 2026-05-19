import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from './_lib/cors.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, OPTIONS')
  res.status(200).json({
    ok: true,
    api: true,
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  })
}
