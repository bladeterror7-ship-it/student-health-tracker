import { motion } from 'framer-motion'
import { LogOut, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import PsychAdminBell from './PsychAdminBell'
import StudentNotificationBell from './StudentNotificationBell'
import { useAuth } from '../context/useAuth'
import { formatSessionGreeting } from '../lib/sessionGreeting'
import type { UserRole } from '../types'

const roleBadge: Record<UserRole, string> = {
  student: 'Сурагч',
  admin: 'Админ',
  parent: 'Эцэг эх',
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  if (!session) return null

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-svh overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-orange-50 dark:from-slate-950 dark:via-emerald-950/40 dark:to-orange-950/55"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-orange-200/55 via-transparent to-transparent dark:from-orange-600/25" />

      <header className="sticky top-0 z-20 border-b border-white/55 bg-white/55 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
        >
          <motion.div layout className="flex items-center gap-3">
            <motion.div
              layout
              className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-emerald-500 text-white shadow-lg shadow-orange-900/25"
              whileHover={{ scale: 1.03 }}
            >
              <ShieldCheck className="size-6" aria-hidden />
            </motion.div>
            <div className="text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                Physical Education
              </p>
              <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">
                {formatSessionGreeting(session)}
              </p>
              <p className="text-xs text-slate-500 dark:text-emerald-100/65">
                {session.email}
                {session.role === 'parent' && session.linkedStudentName && (
                  <span className="text-emerald-700 dark:text-emerald-200">
                    {' '}
                    · Хүүхэд: {session.linkedStudentName}
                  </span>
                )}
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-900 dark:border-orange-400/45 dark:bg-orange-500/20 dark:text-orange-50 sm:inline-flex">
              {roleBadge[session.role]}
            </span>
            {session.role === 'student' && <StudentNotificationBell />}
            {session.role === 'admin' && <PsychAdminBell />}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-black/35 dark:text-orange-50 dark:hover:bg-black/45"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Гарах</span>
            </button>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </motion.div>
  )
}
