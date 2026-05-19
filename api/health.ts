import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pingDatabase } from './_lib/db.js'
import { applyCors } from './_lib/cors.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, OPTIONS')
  const databaseConfigured = Boolean(process.env.DATABASE_URL)
  let databaseConnected = false

  if (databaseConfigured) {
    databaseConnected = await pingDatabase()
  }

  res.status(databaseConnected ? 200 : 503).json({
    ok: databaseConnected,
    api: true,
    databaseConfigured,
    databaseConnected,
  })
}
