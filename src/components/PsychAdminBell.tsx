import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CalendarClock, Circle, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { markAllPsychBookingsRead } from '../lib/psychBookingsStorage'
import { usePsychBookings } from '../hooks/usePsychBookings'

const ANON_STUDENT_LABEL = '🔒 Сургуулийн сурагч (Нэр нууцалсан)'

function bookingStudentLabel(b: { isAnonymous: boolean; studentName: string }) {
  return b.isAnonymous ? ANON_STUDENT_LABEL : b.studentName
}

export default function PsychAdminBell() {
  const { bookings, unreadCount } = usePsychBookings()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function togglePanel() {
    setOpen((wasOpen) => {
      const next = !wasOpen
      if (!wasOpen && unreadCount > 0) {
        queueMicrotask(() => markAllPsychBookingsRead())
      }
      return next
    })
  }

  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        type="button"
        onClick={() => togglePanel()}
        whileTap={{ scale: 0.96 }}
        className="relative inline-flex size-11 items-center justify-center rounded-xl border border-violet-200/80 bg-white/80 text-violet-800 shadow-sm backdrop-blur-md transition hover:bg-violet-50 dark:border-violet-500/35 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/55"
        aria-label="Сэтгэл зүйн захиалгууд"
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-950"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-violet-200/60 bg-white/90 shadow-2xl shadow-violet-900/15 backdrop-blur-2xl dark:border-violet-500/25 dark:bg-slate-950/90"
          >
            <div className="border-b border-violet-200/50 bg-gradient-to-r from-violet-500/12 to-fuchsia-500/10 px-3 py-2.5 dark:border-violet-500/20">
              <p className="text-xs font-semibold text-violet-950 dark:text-violet-100">
                Сэтгэл зүйн цагийн захиалга
              </p>
              <p className="text-[10px] text-violet-800/70 dark:text-violet-200/55">
                Сурагчийн «Захиалах» дарсан бүртгэл
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {sorted.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-slate-500 dark:text-violet-200/45">
                  Одоогоор захиалга алга.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {sorted.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-xl border border-violet-100/80 bg-white/60 px-2.5 py-2 dark:border-violet-500/15 dark:bg-violet-950/40"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-900 dark:text-white">
                        <CalendarClock className="size-3.5 shrink-0 text-violet-600 dark:text-violet-300" />
                        {b.date} · {b.timeSlot}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 dark:text-violet-100/65">
                        <UserRound className="size-3 shrink-0 opacity-70" />
                        {bookingStudentLabel(b)}
                        {b.isAnonymous && (
                          <span className="rounded bg-violet-500/15 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
                            нууц
                          </span>
                        )}
                      </div>
                      {!(b.readByPsych ?? false) && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-300">
                          <Circle className="size-2 fill-current text-rose-500" />
                          Шинэ
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
