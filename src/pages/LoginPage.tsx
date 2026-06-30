import { AnimatePresence, motion } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/useAuth'
import { dashboardPathForRole } from '../lib/authRedirect'
import {
  registerStudentWithNeon,
  signInStudentWithNeon,
} from '../lib/neonStudents'
import {
  registerAdminWithNeon,
  registerParentWithNeon,
  signInPortalWithNeon,
} from '../lib/neonPortal'
import WellbeLogo from '../components/WellbeLogo'
import HoverExpandLoginForm from '../components/HoverExpandLoginForm'
import { STUDENT_CLASS_OPTIONS, type UserRole } from '../types'

type AuthTab = 'login' | 'register'

const REGISTER_ROLES: { id: UserRole; label: string }[] = [
  { id: 'student', label: 'Сурагч' },
  { id: 'parent', label: 'Эцэг эх' },
  { id: 'admin', label: 'Админ' },
]

export default function LoginPage() {
  const { session, login } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<AuthTab>('login')
  const [showSuccess, setShowSuccess] = useState(false)
  const [registerRole, setRegisterRole] = useState<UserRole>('student')
  const [loginRole, setLoginRole] = useState<UserRole>('student')

  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [classGroup, setClassGroup] = useState<string>(STUDENT_CLASS_OPTIONS[0])
  const [childStudentRef, setChildStudentRef] = useState('')
  const [adminInviteCode, setAdminInviteCode] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function navigateAfterLogin(role: UserRole) {
    navigate(dashboardPathForRole(role), { replace: true })
  }

  useEffect(() => {
    if (!showSuccess) return
    const t = window.setTimeout(() => {
      setShowSuccess(false)
      setTab('login')
      setLoginId(registerEmail.trim())
      setRegisterPassword('')
      setLastName('')
      setFirstName('')
      setChildStudentRef('')
      setAdminInviteCode('')
    }, 2000)
    return () => window.clearTimeout(t)
  }, [showSuccess, registerEmail])

  if (session) {
    return <Navigate to={dashboardPathForRole(session.role)} replace />
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()

    const id = loginId.trim()
    const password = loginPassword

    if (!id || !password) {
      toast.error('И-мэйл болон нууц үгээ оруулна уу')
      return
    }

    // —— Сурагч: Neon Postgres ——
    if (loginRole === 'student') {
      if (!id.includes('@')) {
        toast.error('Сурагчийн нэвтрэлтэд и-мэйл хаягаа ашиглана уу')
        return
      }

      setSubmitting(true)
      try {
        const auth = await signInStudentWithNeon(id, password)
        if (auth.ok) {
          const { profile } = auth
          login({
            role: 'student',
            email: profile.email,
            password,
            displayName: profile.fullName,
            lastName: profile.lastName ?? profile.fullName.split(/\s+/)[0] ?? '',
            firstName:
              profile.firstName ??
              profile.fullName.split(/\s+/).slice(1).join(' ') ??
              '',
            classGroup: profile.classGroup,
          })
          navigateAfterLogin('student')
          return
        }
        toast.error(
          auth.reason === 'Бүртгэл олдсонгүй'
            ? 'Бүртгэл олдсонгүй. «Бүртгүүлэх» → Сурагч сонгоод эхлээд бүртгүүлнэ үү (ком болон утас хоёуланд ижил и-мэйл).'
            : auth.reason,
        )
      } finally {
        setSubmitting(false)
      }
      return
    }

    // —— Админ / Эцэг эх: Neon Postgres ——
    if (loginRole !== 'admin' && loginRole !== 'parent') {
      toast.error('Эрх сонголтоо шалгана уу')
      return
    }

    setSubmitting(true)
    try {
      const portal = await signInPortalWithNeon(id, password, loginRole)
      if (portal.ok) {
        const { account, lastName: ln, firstName: fn } = portal
        login({
          role: account.role,
          email: account.email,
          password,
          displayName: account.displayName,
          lastName: ln,
          firstName: fn,
          linkedStudentId: account.linkedStudentId,
          linkedStudentName: account.linkedStudentName,
        })
        navigateAfterLogin(account.role)
        return
      }
      const roleLabel = loginRole === 'admin' ? 'Админ' : 'Эцэг эх'
      toast.error(
        portal.reason === 'Бүртгэл олдсонгүй'
          ? `${roleLabel} бүртгэл олдсонгүй. «Бүртгүүлэх» → ${roleLabel} сонгоод бүртгүүлнэ үү.`
          : portal.reason,
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()

    if (registerRole === 'student') {
      setSubmitting(true)
      try {
        const res = await registerStudentWithNeon({
          email: registerEmail,
          password: registerPassword,
          lastName,
          firstName,
          classGroup,
        })
        if (res.ok === false) {
          toast.error(res.reason)
          return
        }
        toast.success('Бүртгэл амжилттай боллоо!')
        setShowSuccess(true)
      } finally {
        setSubmitting(false)
      }
      return
    } else if (registerRole === 'parent') {
      setSubmitting(true)
      try {
        const res = await registerParentWithNeon({
          email: registerEmail,
          password: registerPassword,
          lastName,
          firstName,
          childStudentRef,
        })
        if (res.ok === false) {
          toast.error(res.reason)
          return
        }
        toast.success('Бүртгэл амжилттай боллоо!')
      } finally {
        setSubmitting(false)
      }
    } else {
      setSubmitting(true)
      try {
        const res = await registerAdminWithNeon({
          email: registerEmail,
          password: registerPassword,
          lastName,
          firstName,
          inviteCode: adminInviteCode,
        })
        if (res.ok === false) {
          toast.error(res.reason)
          return
        }
        toast.success('Бүртгэл амжилттай боллоо!')
      } finally {
        setSubmitting(false)
      }
    }

    setShowSuccess(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0f1115] px-4 py-12"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#35eaff]/8 blur-[100px]"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-[#ff0a6c]/10 blur-[110px]"
        animate={{ opacity: [0.3, 0.5, 0.3], y: [0, -18, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="mx-auto mb-4 flex justify-center"
          >
            <WellbeLogo size="hero" className="drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)]" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8"
            >
              <div className="flex min-h-[280px] flex-col items-center justify-center px-4 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 360,
                    damping: 18,
                    delay: 0.05,
                  }}
                  className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-teal-300/40 bg-teal-500/20 text-3xl shadow-lg shadow-teal-900/30"
                >
                  <PartyPopper className="size-8 text-teal-200" aria-hidden />
                </motion.div>
                <p className="text-lg font-semibold text-white">
                  🎉 Таны бүртгэл амжилттай хийгдлээ!
                </p>
                <p className="mt-2 text-sm text-emerald-100/70">
                  Нэвтрэх хэсэг рүү шилжиж байна…
                </p>
              </div>
            </motion.div>
          ) : (
            <HoverExpandLoginForm
              key="auth"
              tab={tab}
              onTabChange={setTab}
              loginRole={loginRole}
              onLoginRoleChange={setLoginRole}
              loginId={loginId}
              onLoginIdChange={setLoginId}
              loginPassword={loginPassword}
              onLoginPasswordChange={setLoginPassword}
              onLoginSubmit={handleLogin}
              submitting={submitting}
              registerContent={
                <form onSubmit={handleRegister}>
                  <p className="wellbe-reg-label">Бүртгүүлэх эрх</p>
                  <div
                    className="wellbe-reg-role-grid"
                    role="group"
                    aria-label="Бүртгүүлэх эрх сонгох"
                  >
                    {REGISTER_ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={registerRole === r.id ? 'active' : ''}
                        onClick={() => setRegisterRole(r.id)}
                      >
                        <i
                          className={
                            r.id === 'student'
                              ? 'fa-solid fa-user-graduate'
                              : r.id === 'parent'
                                ? 'fa-solid fa-users'
                                : 'fa-solid fa-user-shield'
                          }
                          aria-hidden
                        />
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="wellbe-reg-field">
                    <label htmlFor="reg-last-name">Овог</label>
                    <input
                      id="reg-last-name"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Болд"
                      autoComplete="family-name"
                    />
                  </div>

                  <div className="wellbe-reg-field">
                    <label htmlFor="reg-first-name">Нэр</label>
                    <input
                      id="reg-first-name"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Дорж"
                      autoComplete="given-name"
                    />
                  </div>

                  {registerRole === 'student' && (
                    <div className="wellbe-reg-field">
                      <label htmlFor="reg-class">Анги</label>
                      <select
                        id="reg-class"
                        required
                        value={classGroup}
                        onChange={(e) => setClassGroup(e.target.value)}
                      >
                        {STUDENT_CLASS_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {registerRole === 'parent' && (
                    <div className="wellbe-reg-field">
                      <label htmlFor="reg-child-ref">
                        Хүүхдийн сурагчийн ID / Нэр
                      </label>
                      <input
                        id="reg-child-ref"
                        type="text"
                        required
                        value={childStudentRef}
                        onChange={(e) => setChildStudentRef(e.target.value)}
                        placeholder="Сурагчийн ID эсвэл бүтэн нэр"
                      />
                    </div>
                  )}

                  {registerRole === 'admin' && (
                    <div className="wellbe-reg-field">
                      <label htmlFor="reg-invite">Админ баталгаажуулах код</label>
                      <input
                        id="reg-invite"
                        type="password"
                        required
                        value={adminInviteCode}
                        onChange={(e) => setAdminInviteCode(e.target.value)}
                        placeholder="Урилгын код"
                        autoComplete="off"
                      />
                    </div>
                  )}

                  <div className="wellbe-reg-field">
                    <label htmlFor="reg-email">И-мэйл хаяг</label>
                    <input
                      id="reg-email"
                      type="text"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="you@school.edu.mn"
                      autoComplete="email"
                    />
                  </div>

                  <div className="wellbe-reg-field">
                    <label htmlFor="reg-password">Нууц үг</label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      minLength={4}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="wellbe-hover-login-btn-sign-in"
                    disabled={submitting}
                  >
                    {submitting ? 'Бүртгэж байна…' : 'Бүртгүүлэх'}
                    <i className="fa-solid fa-arrow-right" aria-hidden />
                  </button>
                </form>
              }
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
