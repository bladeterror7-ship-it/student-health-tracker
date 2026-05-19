import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  deleteStudent,
  listStudents,
  updateStudent,
} from '../lib/server/students.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    if (req.method === 'GET') {
      const students = await listStudents()
      return res.status(200).json({ students })
    }

    if (req.method === 'PATCH') {
      const { id, patch } = req.body as {
        id?: string
        patch?: Record<string, unknown>
      }
      if (!id || !patch) {
        return res.status(400).json({ error: 'id болон patch шаардлагатай' })
      }
      await updateStudent(id, patch)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const id = (req.query.id as string) || (req.body as { id?: string })?.id
      if (!id) return res.status(400).json({ error: 'id шаардлагатай' })
      await deleteStudent(id)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API /students:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return res.status(500).json({ error: message })
  }
}
