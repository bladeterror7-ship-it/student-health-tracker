import type { VercelRequest, VercelResponse } from '@vercel/node'
import { dispatchApiRoute } from './_lib/routes.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await dispatchApiRoute(req, res)
}
