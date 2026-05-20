import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  User,
  UsersRound,
} from 'lucide-react'
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
import { STUDENT_CLASS_OPTIONS, type UserRole } from '../types'

type AuthTab = 'login' | 'register'

const TEAL = '#00BFA5'
const TEAL_HOVER = '#00a693'

const REGISTER_ROLES: {
  id: UserRole
  label: string
  icon: typeof GraduationCap
}[] = [
  { id: 'student', label: 'Сурагч', icon: GraduationCap },
  { id: 'parent', label: 'Эцэг эх', icon: UsersRound },
  { id: 'admin', label: 'Админ', icon: ShieldCheck },
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

  const inputRing =
    'focus:border-teal-400/55 focus:ring-2 focus:ring-teal-400/35'

  const inputClass = `w-full rounded-2xl border border-white/15 bg-black/25 py-3 text-sm text-white outline-none transition placeholder:text-white/35 ${inputRing}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950/85 to-teal-950/90 px-4 py-12"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-[100px]"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-emerald-400/18 blur-[110px]"
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
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-100/95 backdrop-blur-md"
          >
            <Sparkles className="size-4 text-teal-300" aria-hidden />
            Physical Education
          </motion.div>
          <h1 className="bg-gradient-to-r from-white via-teal-100 to-emerald-100 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            Сургуулийн портал
          </h1>
          <p className="mt-2 text-sm text-emerald-100/75">
            Нэвтрэх эсвэл шинээр бүртгүүлнэ үү
          </p>
        </div>

        <motion.div
          layout
          className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8"
        >
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="flex min-h-[280px] flex-col items-center justify-center px-4 py-10 text-center"
              >
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
              </motion.div>
            ) : (
              <motion.div
                key="forms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  layout
                  className="relative mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-black/30 p-1 ring-1 ring-white/10"
                  role="tablist"
                  aria-label="Нэвтрэх эсвэл бүртгүүлэх"
                >
                  {(
                    [
                      ['login', 'Нэвтрэх'],
                      ['register', 'Бүртгүүлэх'],
                    ] as const
                  ).map(([id, label]) => {
                    const active = tab === id
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTab(id)}
                        className={`relative rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                          active
                            ? 'text-white'
                            : 'text-white/55 hover:text-white/85'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="auth-tab-pill"
                            className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/90 to-emerald-600/90 shadow-md shadow-black/25"
                            transition={{
                              type: 'spring',
                              stiffness: 380,
                              damping: 32,
                            }}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <span className="relative z-[1]">{label}</span>
                      </button>
                    )
                  })}
                </motion.div>

                <AnimatePresence mode="wait">
                  {tab === 'login' ? (
                    <motion.form
                      key="login-form"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-4 text-left"
                      onSubmit={handleLogin}
                    >
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                          Нэвтрэх эрх
                        </p>
                        <motion.div layout className="grid grid-cols-3 gap-1 rounded-2xl bg-black/30 p-1 ring-1 ring-white/10">
                          {REGISTER_ROLES.map(({ id, label, icon: Icon }) => {
                            const active = loginRole === id
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setLoginRole(id)}
                                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                                  active
                                    ? 'bg-teal-500/25 text-white ring-1 ring-teal-400/40'
                                    : 'text-white/55 hover:text-white/85'
                                }`}
                              >
                                <Icon className="size-4" aria-hidden />
                                {label}
                              </button>
                            )
                          })}
                        </motion.div>
                      </div>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-emerald-50/85">
                          {loginRole === 'student'
                            ? 'И-мэйл хаяг'
                            : 'И-мэйл хаяг эсвэл нэр'}
                        </span>
                        <span className="relative flex items-center">
                          <Mail className="pointer-events-none absolute left-3 size-4 text-white/35" />
                          <input
                            type="text"
                            required
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            className={`${inputClass} pl-10 pr-3`}
                            placeholder="you@school.edu.mn эсвэл таны нэр"
                            autoComplete="username"
                          />
                        </span>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-emerald-50/85">
                          Нууц үг
                        </span>
                        <span className="relative flex items-center">
                          <Lock className="pointer-events-none absolute left-3 size-4 text-white/35" />
                          <input
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className={`${inputClass} pl-10 pr-3`}
                            placeholder="••••••••"
                            autoComplete="current-password"
                          />
                        </span>
                        {loginRole === 'student' && (
                          <p className="text-[11px] leading-relaxed text-emerald-50/70">
                            Нууц үг мартсан бол сургуулийн админд хандана уу — админ
                            таны бүртгэлд шинэ нууц үг тохируулна (мэдээлэл устахгүй).
                          </p>
                        )}
                      </label>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={submitting}
                        style={{ backgroundColor: TEAL }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = TEAL_HOVER
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = TEAL
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/40 transition disabled:opacity-60"
                      >
                        {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
                        <ArrowRight className="size-4" aria-hidden />
                      </motion.button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register-form"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-3.5 text-left"
                      onSubmit={handleRegister}
                    >
                      <motion.div layout className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                          Бүртгүүлэх эрх
                        </p>
                        <div
                          className="grid grid-cols-3 gap-1 rounded-2xl bg-black/30 p-1 ring-1 ring-white/10"
                          role="group"
                          aria-label="Бүртгүүлэх эрх сонгох"
                        >
                          {REGISTER_ROLES.map((r) => {
                            const Icon = r.icon
                            const active = registerRole === r.id
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setRegisterRole(r.id)}
                                className={`relative flex flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold transition sm:text-[11px] ${
                                  active
                                    ? 'text-white'
                                    : 'text-white/55 hover:text-white/85'
                                }`}
                              >
                                {active && (
                                  <motion.span
                                    layoutId="register-role-pill"
                                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/90 to-emerald-600/90 shadow-md"
                                    transition={{
                                      type: 'spring',
                                      stiffness: 380,
                                      damping: 32,
                                    }}
                                    style={{ zIndex: 0 }}
                                  />
                                )}
                                <Icon
                                  className={`relative size-4 ${active ? 'text-white' : 'text-white/50'}`}
                                  aria-hidden
                                />
                                <span className="relative z-[1] leading-tight">
                                  {r.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-emerald-50/85">
                          Овог
                        </span>
                        <span className="relative flex items-center">
                          <User className="pointer-events-none absolute left-3 size-4 text-white/35" />
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={`${inputClass} pl-10 pr-3`}
                            placeholder="Болд"
                            autoComplete="family-name"
                          />
                        </span>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-emerald-50/85">
                          Нэр
                        </span>
                        <span className="relative flex items-center">
                          <User className="pointer-events-none absolute left-3 size-4 text-white/35" />
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={`${inputClass} pl-10 pr-3`}
                            placeholder="Дорж"
                            autoComplete="given-name"
                          />
                        </span>
                      </label>

                      {registerRole === 'student' && (
                        <motion.label
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="block space-y-1.5 overflow-hidden"
                        >
                          <span className="text-xs font-medium text-emerald-50/85">
                            Анги
                          </span>
                          <span className="relative flex items-center">
                            <GraduationCap className="pointer-events-none absolute left-3 size-4 text-white/35" />
                            <select
                              required
                              value={classGroup}
                              onChange={(e) => setClassGroup(e.target.value)}
                              className={`${inputClass} appearance-none pl-10 pr-10`}
                            >
                              {STUDENT_CLASS_OPTIONS.map((c) => (
                                <option
                                  key={c}
                                  value={c}
                                  className="bg-slate-900"
                                >
                                  {c}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                              ▾
                            </span>
                          </span>
                        </motion.label>
                      )}

                      {registerRole === 'parent' && (
                        <motion.label
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="block space-y-1.5 overflow-hidden"
                        >
                          <span className="text-xs font-medium text-emerald-50/85">
                            Хүүхдийн сурагчийн ID / Нэр
                          </span>
                          <span className="relative flex items-center">
                            <UsersRound className="pointer-events-none absolute left-3 size-4 text-white/35" />
                            <input
                              type="text"
                              required
                              value={childStudentRef}
                              onChange={(e) =>
                                setChildStudentRef(e.target.value)
                              }
                              className={`${inputClass} pl-10 pr-3`}
                              placeholder="Сурагчийн ID эсвэл бүтэн нэр"
                            />
                          </span>
                        </motion.label>
                      )}

                      {registerRole === 'admin' && (
                        <motion.label
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="block space-y-1.5 overflow-hidden"
                        >
                          <span className="text-xs font-medium text-emerald-50/85">
                            Админ баталгаажуулах код
                          </span>
                          <span className="relative flex items-center">
                            <KeyRound className="pointer-events-none absolute left-3 size-4 text-white/35" />
                            <input
                              type="password"
                              required
                              value={adminInviteCode}
                              onChange={(e) =>
                                setAdminInviteCode(e.target.value)
                              }
                              className={`${inputClass} pl-10 pr-3`}
                              placeholder="Урилгын код"
                              autoComplete="off"
                            />
                          </span>
                        </motion.label>
                      )}

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-emerald-50/85">
                          И-мэйл хаяг
                        </span>
                        <span className="relative flex items-center">
                          <Mail className="pointer-events-none absolute left-3 size-4 text-white/35" />
                          <input
                            type="text"
                            inputMode="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            required
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            className={`${inputClass} pl-10 pr-3`}
                            placeholder="you@school.edu.mn"
                            autoComplete="email"
                          />
                        </span>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-emerald-50/85">
                          Нууц үг
                        </span>
                        <span className="relative flex items-center">
                          <Lock className="pointer-events-none absolute left-3 size-4 text-white/35" />
                          <input
                            type="password"
                            required
                            minLength={4}
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className={`${inputClass} pl-10 pr-3`}
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                        </span>
                      </label>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        type="submit"
                        disabled={submitting}
                        style={{ backgroundColor: TEAL }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = TEAL_HOVER
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = TEAL
                        }}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/40 transition disabled:opacity-60"
                      >
                        {submitting ? 'Бүртгэж байна…' : 'Бүртгүүлэх'}
                        <ArrowRight className="size-4" aria-hidden />
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
