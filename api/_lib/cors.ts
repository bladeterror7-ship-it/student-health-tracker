import type { VercelRequest, VercelResponse } from '@vercel/node'

export function applyCors(res: VercelResponse, methods: string) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
