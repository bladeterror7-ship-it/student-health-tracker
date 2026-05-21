import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parseJsonBody } from './body.js'
import { applyCors, handleOptions } from './cors.js'
import { pingDatabase } from './db.js'
import {
  addDoctorQuestion,
  listDoctorQuestions,
  replyToDoctorQuestion,
} from './doctorQuestions.js'
import {
  listPortalAccounts,
  loginPortalAccount,
  registerAdminAccount,
  registerParentAccount,
  resetPortalPassword,
  type PortalRole,
} from './portal.js'
import {
  deleteStudent,
  listStudents,
  loginStudent,
  registerStudent,
  resetStudentPassword,
  updateStudent,
} from './students.js'

function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ ok: false, reason: message, error: message })
}

export function getRoutePath(req: VercelRequest): string {
  const q = req.query.path
  if (Array.isArray(q)) return q.filter(Boolean).join('/')
  if (typeof q === 'string' && q) return q

  try {
    const u = new URL(req.url ?? '', 'http://localhost')
    return u.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '')
  } catch {
    return ''
  }
}

async function handleHealth(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') return sendError(res, 405, 'GET only')

  const databaseConfigured = Boolean(process.env.DATABASE_URL)
  let databaseConnected = false
  if (databaseConfigured) {
    databaseConnected = await pingDatabase()
  }

  return res.status(databaseConnected ? 200 : 503).json({
    ok: databaseConnected,
    api: true,
    databaseConfigured,
    databaseConnected,
  })
}

async function handleStudents(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, PATCH, DELETE, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method === 'GET') {
    const students = await listStudents()
    return res.status(200).json({ ok: true, students })
  }

  if (req.method === 'PATCH') {
    const body = parseJsonBody<{ id?: string; patch?: Record<string, unknown> }>(req)
    if (!body.id || !body.patch) {
      return sendError(res, 400, 'id болон patch шаардлагатай')
    }
    await updateStudent(body.id, body.patch)
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const id =
      (req.query.id as string) || parseJsonBody<{ id?: string }>(req).id
    if (!id) return sendError(res, 400, 'id шаардлагатай')
    await deleteStudent(id)
    return res.status(200).json({ ok: true })
  }

  return sendError(res, 405, 'Method not allowed')
}

async function handleLoginStudent(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'POST only')

  const body = parseJsonBody<{ email?: string; password?: string }>(req)
  const result = await loginStudent(body.email ?? '', body.password ?? '')

  if (result.ok === false) {
    return res.status(401).json({ ok: false, reason: result.reason })
  }

  return res.status(200).json({ ok: true, student: result.student })
}

async function handleRegisterStudent(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'POST only')

  const body = parseJsonBody<{
    email?: string
    password?: string
    lastname?: string
    firstname?: string
    classgroup?: string
    lastName?: string
    firstName?: string
    classGroup?: string
  }>(req)

  const result = await registerStudent({
    email: body.email ?? '',
    password: body.password ?? '',
    lastName: body.lastname ?? body.lastName ?? '',
    firstName: body.firstname ?? body.firstName ?? '',
    classGroup: body.classgroup ?? body.classGroup ?? '',
  })

  if (result.ok === false) {
    return res.status(400).json({ ok: false, reason: result.reason })
  }

  return res.status(201).json({ ok: true, student: result.student })
}

async function handleLoginPortal(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'POST only')

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

  if (result.ok === false) {
    return res.status(401).json({ ok: false, reason: result.reason })
  }

  return res.status(200).json({ ok: true, account: result.account })
}

async function handleRegisterParent(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'POST only')

  const body = parseJsonBody<{
    email?: string
    password?: string
    lastname?: string
    firstname?: string
    childstudentref?: string
    lastName?: string
    firstName?: string
    childStudentRef?: string
  }>(req)

  const result = await registerParentAccount({
    email: body.email ?? '',
    password: body.password ?? '',
    lastName: body.lastname ?? body.lastName ?? '',
    firstName: body.firstname ?? body.firstName ?? '',
    childStudentRef: body.childstudentref ?? body.childStudentRef ?? '',
  })

  if (result.ok === false) {
    return res.status(400).json({ ok: false, reason: result.reason })
  }

  return res.status(201).json({ ok: true, account: result.account })
}

async function handleRegisterAdmin(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'POST only')

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

  if (result.ok === false) {
    return res.status(400).json({ ok: false, reason: result.reason })
  }

  return res.status(201).json({ ok: true, account: result.account })
}

async function handlePortalAccounts(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed')

  const roleRaw = req.query.role as string | undefined
  const role: PortalRole | undefined =
    roleRaw === 'admin' || roleRaw === 'parent' ? roleRaw : undefined
  const accounts = await listPortalAccounts(role)
  return res.status(200).json({ ok: true, accounts })
}

async function handleResetStudentPassword(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed')

  const body = parseJsonBody<{ id?: string; newPassword?: string; newpassword?: string }>(
    req,
  )
  const id = body.id
  const newPassword = body.newPassword ?? body.newpassword ?? ''
  if (!id || !newPassword) {
    return sendError(res, 400, 'id болон newPassword шаардлагатай')
  }

  await resetStudentPassword(id, newPassword)
  return res.status(200).json({ ok: true })
}

async function handleResetPortalPassword(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'POST, OPTIONS')
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed')

  const body = parseJsonBody<{ id?: string; newPassword?: string; newpassword?: string }>(
    req,
  )
  const id = body.id
  const newPassword = body.newPassword ?? body.newpassword ?? ''
  if (!id || !newPassword) {
    return sendError(res, 400, 'id болон newPassword шаардлагатай')
  }

  await resetPortalPassword(id, newPassword)
  return res.status(200).json({ ok: true })
}

async function handleDoctorQuestions(req: VercelRequest, res: VercelResponse) {
  applyCors(res, 'GET, POST, PATCH, OPTIONS')
  if (handleOptions(req, res)) return

  if (req.method === 'GET') {
    const questions = await listDoctorQuestions()
    return res.status(200).json({ ok: true, questions })
  }

  if (req.method === 'POST') {
    const body = parseJsonBody<{
      studentemail?: string
      studentdisplayname?: string
      anonymous?: boolean
      classgroup?: string
      body?: string
      studentEmail?: string
      studentDisplayName?: string
      classGroup?: string
    }>(req)

    const question = await addDoctorQuestion({
      studentEmail: body.studentemail ?? body.studentEmail ?? '',
      studentDisplayName:
        body.studentdisplayname ?? body.studentDisplayName ?? 'Сурагч',
      anonymous: Boolean(body.anonymous),
      classGroup: body.classgroup ?? body.classGroup ?? '',
      body: body.body ?? '',
    })
    return res.status(201).json({ ok: true, question })
  }

  if (req.method === 'PATCH') {
    const body = parseJsonBody<{ id?: string; reply?: string }>(req)
    if (!body.id || !body.reply) {
      return sendError(res, 400, 'id болон reply шаардлагатай')
    }
    const updated = await replyToDoctorQuestion(body.id, body.reply)
    if (!updated) {
      return sendError(res, 404, 'Асуулт олдсонгүй')
    }
    return res.status(200).json({ ok: true, question: updated })
  }

  return sendError(res, 405, 'Method not allowed')
}

const ROUTES: Record<
  string,
  (req: VercelRequest, res: VercelResponse) => Promise<unknown>
> = {
  health: handleHealth,
  students: handleStudents,
  'login-student': handleLoginStudent,
  'register-student': handleRegisterStudent,
  'auth/login-student': handleLoginStudent,
  'auth/register-student': handleRegisterStudent,
  'login-portal': handleLoginPortal,
  'register-parent': handleRegisterParent,
  'register-admin': handleRegisterAdmin,
  'portal-accounts': handlePortalAccounts,
  'reset-student-password': handleResetStudentPassword,
  'reset-portal-password': handleResetPortalPassword,
  'doctor-questions': handleDoctorQuestions,
}

export async function dispatchApiRoute(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const path = getRoutePath(req)
  const handler = ROUTES[path]

  if (!handler) {
    sendError(res, 404, `API route not found: ${path || '(empty)'}`)
    return
  }

  try {
    await handler(req, res)
  } catch (error) {
    console.error(`API /${path}:`, error)
    const message = error instanceof Error ? error.message : 'Server error'
    sendError(res, 500, message)
  }
}
