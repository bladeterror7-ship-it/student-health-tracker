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
  createClinicalExam,
  listClinicalExams,
  updateClinicalExam,
} from '../api/_lib/clinicalExams.js'
import {
  deleteStudent,
  listStudents,
  loginStudent,
  registerStudent,
  resetStudentPassword,
  updateStudent,
} from '../api/_lib/students.js'
import {
  listPortalAccounts,
  resetPortalPassword,
} from '../api/_lib/portal.js'
import {
  deleteAppBlob,
  getAppBlob,
  listAppBlobKeys,
  listAppStorage,
  upsertAppBlob,
  upsertAppStorage,
  upsertAppStorageBatch,
} from '../api/_lib/appStorage.js'
import { pingDatabase } from '../api/_lib/db.js'

const app = express()
const PORT = Number(process.env.API_PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '20mb' }))

app.get('/api/portal-accounts', async (req, res) => {
  try {
    const roleRaw = req.query.role as string | undefined
    const role =
      roleRaw === 'admin' || roleRaw === 'parent' ? roleRaw : undefined
    const accounts = await listPortalAccounts(role)
    res.json({ ok: true, accounts })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

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

app.post('/api/reset-student-password', async (req, res) => {
  try {
    const { id, newPassword } = req.body as { id?: string; newPassword?: string }
    if (!id || !newPassword) {
      res.status(400).json({ ok: false, reason: 'id болон newPassword шаардлагатай' })
      return
    }
    await resetStudentPassword(id, newPassword)
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.post('/api/reset-portal-password', async (req, res) => {
  try {
    const { id, newPassword } = req.body as { id?: string; newPassword?: string }
    if (!id || !newPassword) {
      res.status(400).json({ ok: false, reason: 'id болон newPassword шаардлагатай' })
      return
    }
    await resetPortalPassword(id, newPassword)
    res.json({ ok: true })
  } catch (error) {
    console.error(error)
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

app.get('/api/clinical-exams', async (req, res) => {
  try {
    const studentId =
      typeof req.query.studentId === 'string' ? req.query.studentId : undefined
    const exams = await listClinicalExams(studentId)
    res.json({ ok: true, exams })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.post('/api/clinical-exams', async (req, res) => {
  try {
    const result = await createClinicalExam(req.body)
    if ('ok' in result && result.ok === false) {
      res.status(400).json({ ok: false, reason: result.reason })
      return
    }
    res.status(201).json({ ok: true, exam: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.patch('/api/clinical-exams', async (req, res) => {
  try {
    const { id, state, examDate } = req.body as {
      id?: string
      state?: unknown
      examDate?: string
    }
    if (!id) {
      res.status(400).json({ ok: false, reason: 'id шаардлагатай' })
      return
    }
    const exam = await updateClinicalExam({ id, state: state as never, examDate })
    if (!exam) {
      res.status(404).json({ ok: false, reason: 'Үзлэг олдсонгүй' })
      return
    }
    res.json({ ok: true, exam })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.get('/api/health', async (_req, res) => {
  try {
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
  } catch (error) {
    console.error(error)
    res.status(503).json({
      ok: false,
      api: true,
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      databaseConnected: false,
    })
  }
})

app.get('/api/app-storage', async (_req, res) => {
  try {
    const items = await listAppStorage()
    res.json({ ok: true, items })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.put('/api/app-storage', async (req, res) => {
  try {
    const { key, storageKey, data } = req.body as {
      key?: string
      storageKey?: string
      data?: string
    }
    const k = storageKey ?? key ?? ''
    if (!k.trim()) {
      res.status(400).json({ ok: false, reason: 'key шаардлагатай' })
      return
    }
    const item = await upsertAppStorage(k, data ?? '')
    res.json({ ok: true, item })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.post('/api/app-storage', async (req, res) => {
  try {
    const { items } = req.body as {
      items?: { storageKey?: string; key?: string; data?: string }[]
    }
    const count = await upsertAppStorageBatch(
      (items ?? []).map((i) => ({
        storageKey: i.storageKey ?? i.key ?? '',
        data: i.data ?? '',
      })),
    )
    res.json({ ok: true, count })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.get('/api/app-blobs', async (req, res) => {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key.trim() : ''
    if (key) {
      const blob = await getAppBlob(key)
      if (!blob) {
        res.status(404).json({ ok: false, reason: 'Blob олдсонгүй' })
        return
      }
      res.json({ ok: true, blob })
      return
    }
    const keys = await listAppBlobKeys()
    res.json({ ok: true, keys })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.get('/api/app-blobs/:key', async (req, res) => {
  try {
    const blob = await getAppBlob(decodeURIComponent(req.params.key))
    if (!blob) {
      res.status(404).json({ ok: false, reason: 'Blob олдсонгүй' })
      return
    }
    res.json({ ok: true, blob })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.put('/api/app-blobs', async (req, res) => {
  try {
    const { blobKey, key, fileName, mimeType, base64 } = req.body as {
      blobKey?: string
      key?: string
      fileName?: string
      mimeType?: string
      base64?: string
    }
    const k = blobKey ?? key ?? ''
    if (!k.trim() || !base64) {
      res.status(400).json({ ok: false, reason: 'key болон base64 шаардлагатай' })
      return
    }
    const blob = await upsertAppBlob({
      blobKey: k,
      fileName: fileName ?? 'file',
      mimeType,
      base64,
    })
    res.json({ ok: true, blob })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      reason: error instanceof Error ? error.message : 'Server error',
    })
  }
})

app.delete('/api/app-blobs/:key', async (req, res) => {
  try {
    await deleteAppBlob(decodeURIComponent(req.params.key))
    res.json({ ok: true })
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
