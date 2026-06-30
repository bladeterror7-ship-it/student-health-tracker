import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'

type DayKey = string

type BookedSlot = {
  dayKey: DayKey
  slotId: string
  label: string
}

function appointmentStorageKey(email: string) {
  return `medical-appointment-booking-v1:${email.toLowerCase()}`
}

function loadBooked(email: string | undefined): BookedSlot | null {
  if (!email) return null
  try {
    const raw = localStorage.getItem(appointmentStorageKey(email))
    if (!raw) return null
    const parsed = JSON.parse(raw) as BookedSlot
    if (parsed?.dayKey && parsed.slotId && parsed.label) return parsed
    return null
  } catch {
    return null
  }
}

function persistBooked(email: string | undefined, booked: BookedSlot | null) {
  if (!email) return
  try {
    if (booked) {
      localStorage.setItem(appointmentStorageKey(email), JSON.stringify(booked))
    } else {
      localStorage.removeItem(appointmentStorageKey(email))
    }
  } catch {
    /* quota */
  }
}

const MOCK_DAYS: { key: DayKey; short: string; full: string }[] = [
  { key: '2026-05-19', short: 'Да', full: '5 сар 19' },
  { key: '2026-05-20', short: 'Мя', full: '5 сар 20' },
  { key: '2026-05-21', short: 'Лх', full: '5 сар 21' },
  { key: '2026-05-22', short: 'Пү', full: '5 сар 22' },
  { key: '2026-05-23', short: 'Ба', full: '5 сар 23' },
]

const MOCK_SLOTS: Record<
  DayKey,
  { id: string; label: string; available: boolean }[]
> = {
  '2026-05-19': [
    { id: 'a1', label: '09:00', available: true },
    { id: 'a2', label: '10:30', available: true },
    { id: 'a3', label: '12:00', available: false },
    { id: 'a4', label: '14:15', available: true },
  ],
  '2026-05-20': [
    { id: 'b1', label: '09:30', available: true },
    { id: 'b2', label: '11:00', available: true },
    { id: 'b3', label: '15:00', available: true },
  ],
  '2026-05-21': [
    { id: 'c1', label: '10:00', available: false },
    { id: 'c2', label: '13:30', available: true },
    { id: 'c3', label: '16:00', available: true },
  ],
  '2026-05-22': [
    { id: 'd1', label: '08:45', available: true },
    { id: 'd2', label: '11:45', available: true },
    { id: 'd3', label: '14:00', available: true },
  ],
  '2026-05-23': [
    { id: 'e1', label: '10:15', available: true },
    { id: 'e2', label: '12:30', available: false },
  ],
}

export default function StudentMedicalAppointment() {
  const { session } = useAuth()
  const email = session?.email
  const [activeDay, setActiveDay] = useState<DayKey>(MOCK_DAYS[0].key)
  const [booked, setBooked] = useState<BookedSlot | null>(() =>
    loadBooked(email),
  )

  useEffect(() => {
    setBooked(loadBooked(email))
  }, [email])

  useEffect(() => {
    persistBooked(email, booked)
  }, [email, booked])

  const slots = useMemo(() => MOCK_SLOTS[activeDay] ?? [], [activeDay])
  const activeMeta = MOCK_DAYS.find((d) => d.key === activeDay)

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-600 shadow-sm dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-300">
            <CalendarClock className="size-[1.35rem]" aria-hidden />
          </span>
          <div className="min-w-0 text-left">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Эмчийн цаг захиалга
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-emerald-100/55">
              Сул цагаа сонгоод захиалаарай — сургуулийн эмч рүү.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {booked ? (
            <motion.span
              key="booked-pill"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/45 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-900 shadow-sm dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100"
            >
              <Check className="size-3.5 shrink-0" aria-hidden />
              Захиалсан цаг
            </motion.span>
          ) : (
            <motion.span
              key="avail-pill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-full border border-white/40 bg-white/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 backdrop-blur-sm dark:border-white/10 dark:bg-black/25 dark:text-emerald-100/55"
            >
              Сул байгаа
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible">
        {MOCK_DAYS.map((d) => {
          const selected = activeDay === d.key
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveDay(d.key)}
              className={`relative min-w-[3.25rem] shrink-0 rounded-xl border px-2.5 py-2 text-center text-xs font-semibold transition sm:min-w-0 ${
                selected
                  ? 'border-orange-400/50 bg-gradient-to-br from-orange-400/25 to-emerald-400/20 text-slate-900 shadow-sm dark:border-orange-400/40 dark:text-white'
                  : 'border-slate-200/80 bg-white/60 text-slate-600 hover:border-orange-300/40 dark:border-white/10 dark:bg-black/20 dark:text-emerald-100/65 dark:hover:border-white/20'
              }`}
            >
              <span className="block leading-none">{d.short}</span>
              <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                {d.full}
              </span>
            </button>
          )
        })}
      </div>

      {booked && booked.dayKey === activeDay && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-left text-xs text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-50/90"
        >
          Таны захиалга:{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {activeMeta?.full} · {booked.label}
          </span>
        </motion.p>
      )}

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-emerald-100/45">
        Сул цаг — {activeMeta?.full}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const isBookedHere =
            booked?.dayKey === activeDay && booked.slotId === slot.id
          const disabled = !slot.available

          return (
            <motion.button
              key={slot.id}
              type="button"
              disabled={disabled}
              whileTap={disabled ? undefined : { scale: 0.97 }}
              onClick={() => {
                if (disabled) return
                setBooked({ dayKey: activeDay, slotId: slot.id, label: slot.label })
              }}
              className={`relative overflow-hidden rounded-xl border px-2 py-2.5 text-center text-sm font-semibold transition ${
                disabled
                  ? 'cursor-not-allowed border-slate-200/60 bg-slate-100/50 text-slate-400 line-through dark:border-white/5 dark:bg-black/20 dark:text-emerald-100/35'
                  : isBookedHere
                    ? 'border-emerald-500/55 bg-emerald-500/15 text-emerald-900 shadow-sm ring-2 ring-emerald-400/35 dark:border-emerald-400/45 dark:bg-emerald-500/20 dark:text-emerald-50'
                    : 'border-slate-200/80 bg-white/70 text-slate-800 hover:border-orange-400/45 hover:bg-orange-500/10 dark:border-white/10 dark:bg-black/25 dark:text-white dark:hover:border-orange-400/35'
              }`}
            >
              {isBookedHere && (
                <motion.span
                  layoutId="slot-booked-ring"
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-400/50"
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                />
              )}
              <span className="relative">{slot.label}</span>
              {isBookedHere && (
                <span className="relative mt-1 block text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                  Захиалсан
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
