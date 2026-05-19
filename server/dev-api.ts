/**
 * Локал хөгжүүлэлт: Vite proxy → энэ сервер (/api/*)
 * Production: Vercel serverless (api/ folder)
 */
import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  loginPortalAccount,
  registerAdminAccount,
  registerParentAccount,
} from '../api/_lib/portal.js'
import {
  addDoctorQuestion,
  listDoctorQuestions,
  replyToDoctorQuestion,
} from '../api/_lib/doctorQuestions.js'
import {
  deleteStudent,
  listStudents,
  loginStudent,
  registerStudent,
  updateStudent,
} from '../api/_lib/students.js'

const app = express()
const PORT = Number(process.env.API_PORT) || 3001

app.use(cors())
app.use(express.json())

app.get('/api/students', async (_req, res) => {
  try {
    const students = await listStudents()
    res.json({ students })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.patch('/api/students', async (req, res) => {
  try {
    const { id, patch } = req.body as { id?: string; patch?: Record<string, unknown> }
    if (!id || !patch) {
      res.status(400).json({ error: 'id болон patch шаардлагатай' })
      return
    }
    await updateStudent(id, patch)
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.delete('/api/students', async (req, res) => {
  try {
    const id = (req.query.id as string) || (req.body as { id?: string })?.id
    if (!id) {
      res.status(400).json({ error: 'id шаардлагатай' })
      return
    }
    await deleteStudent(id)
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Server error',
    })
  }
})

async function handleRegister(req: express.Request, res: express.Response) {
  try {
    const result = await registerStudent(req.body)
    if (!result.ok) {
      res.status(400).json({ ok: false, reason: result.reason })
      return
    }
    res.status(201).json({ ok: true, student: result.student })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
}

async function handleLogin(req: express.Request, res: express.Response) {
  try {
    const result = await loginStudent(req.body.email ?? '', req.body.password ?? '')
    if (!result.ok) {
      res.status(401).json({ ok: false, reason: result.reason })
      return
    }
    res.json({ ok: true, student: result.student })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
}

app.post('/api/register-student', handleRegister)
app.post('/api/auth/register-student', handleRegister)
app.post('/api/login-student', handleLogin)
app.post('/api/auth/login-student', handleLogin)

app.post('/api/register-parent', async (req, res) => {
  try {
    const result = await registerParentAccount(req.body)
    if (!result.ok) {
      res.status(400).json({ ok: false, reason: result.reason })
      return
    }
    res.status(201).json({ ok: true, account: result.account })
  } catch (error) {
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.post('/api/register-admin', async (req, res) => {
  try {
    const result = await registerAdminAccount(req.body)
    if (!result.ok) {
      res.status(400).json({ ok: false, reason: result.reason })
      return
    }
    res.status(201).json({ ok: true, account: result.account })
  } catch (error) {
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.get('/api/doctor-questions', async (_req, res) => {
  try {
    const questions = await listDoctorQuestions()
    res.json({ ok: true, questions })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.post('/api/doctor-questions', async (req, res) => {
  try {
    const question = await addDoctorQuestion({
      studentEmail: req.body.studentEmail ?? req.body.studentemail ?? '',
      studentDisplayName:
        req.body.studentDisplayName ?? req.body.studentdisplayname ?? 'Сурагч',
      anonymous: Boolean(req.body.anonymous),
      classGroup: req.body.classGroup ?? req.body.classgroup ?? '',
      body: req.body.body ?? '',
    })
    res.status(201).json({ ok: true, question })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.patch('/api/doctor-questions', async (req, res) => {
  try {
    const { id, reply } = req.body as { id?: string; reply?: string }
    if (!id || !reply) {
      res.status(400).json({ ok: false, reason: 'id болон reply шаардлагатай' })
      return
    }
    const question = await replyToDoctorQuestion(id, reply)
    if (!question) {
      res.status(404).json({ ok: false, reason: 'Асуулт олдсонгүй' })
      return
    }
    res.json({ ok: true, question })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.post('/api/login-portal', async (req, res) => {
  try {
    const result = await loginPortalAccount(
      req.body.identifier ?? req.body.email ?? '',
      req.body.password ?? '',
      req.body.role,
    )
    if (!result.ok) {
      res.status(401).json({ ok: false, reason: result.reason })
      return
    }
    res.json({ ok: true, account: result.account })
  } catch (error) {
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`)
})
