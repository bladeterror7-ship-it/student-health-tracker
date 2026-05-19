import { motion } from 'framer-motion'
import { CalendarHeart, CircleCheck, Shield } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../context/useAuth'
import { appendPsychBooking } from '../../lib/psychBookingsStorage'

const WARM_SLOTS = ['09:30', '11:00', '13:15', '15:30', '17:00'] as const

export default function StudentPsychSessionBooking() {
  const { session } = useAuth()

  const [date, setDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [slot, setSlot] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const [saved, setSaved] = useState(false)

  const summary = useMemo(() => {
    if (!slot) return null
    return `${date} · ${slot}`
  }, [date, slot])

  function handleSave() {
    if (!slot) {
      toast.error('Цагийн завсраа сонгоно уу')
      return
    }
    if (!session) {
      toast.error('Нэвтрэх шаардлагатай')
      return
    }
    try {
      localStorage.setItem(
        'pe-psych-session-draft',
        JSON.stringify({ date, slot, anonymous, ts: Date.now() }),
      )
    } catch {
      /* ignore */
    }

    const displayStudentName = anonymous
      ? 'Ананим Сурагч'
      : (session.displayName?.trim() || 'Сурагч')

    appendPsychBooking({
      date,
      timeSlot: slot,
      isAnonymous: anonymous,
      studentName: displayStudentName,
      studentEmail: anonymous ? undefined : session.email,
    })

    setSaved(true)

    toast.custom(
      () => (
        <motion.div
          layout
          initial={{ opacity: 0, x: 28, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="pointer-events-auto flex max-w-[min(100vw-2rem,22rem)] items-start gap-3 rounded-2xl border border-violet-300/45 bg-white/75 px-4 py-3.5 shadow-xl shadow-violet-900/20 backdrop-blur-xl dark:border-violet-500/35 dark:bg-slate-950/80 dark:shadow-black/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300">
            <CircleCheck className="size-5" strokeWidth={2.5} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5 text-left">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Амжилттай
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-violet-100/75">
              Таны {date}-ны {slot} цагийн захиалга баталгаажлаа.
            </p>
          </div>
        </motion.div>
      ),
      { duration: 3000 },
    )
  }

  return (
    <section className="rounded-2xl border border-amber-400/45 bg-gradient-to-br from-amber-500/[0.14] via-orange-500/[0.1] to-rose-500/[0.12] p-4 shadow-sm backdrop-blur-xl dark:border-amber-400/30 dark:from-amber-500/18 dark:via-orange-500/12 dark:to-rose-500/15 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-800 shadow-sm dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-100">
          <CalendarHeart className="size-[1.35rem]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-amber-50">
            Сэтгэл зүйчтэй зөвлөлдөх цаг захиалга
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-950/75 dark:text-amber-100/65">
            Нууцлалтай орчинд өөрийн цагаа сонгоно уу — сэтгэл зүйч таныг сонссон байдалтай уулзана.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-left">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-amber-900/70 dark:text-amber-100/55">
            Огноо
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setSaved(false)
            }}
            className="w-full rounded-xl border border-amber-300/55 bg-white/85 px-3 py-2.5 text-sm text-slate-900 outline-none ring-rose-400/0 transition focus:border-rose-400/55 focus:ring-2 focus:ring-rose-400/25 dark:border-white/15 dark:bg-black/35 dark:text-amber-50"
          />
        </label>
        <div className="text-left">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-amber-900/70 dark:text-amber-100/55">
            Цагийн завсар
          </span>
          <div className="flex flex-wrap gap-1.5">
            {WARM_SLOTS.map((t) => {
              const on = slot === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSlot(t)
                    setSaved(false)
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    on
                      ? 'border-rose-500/55 bg-rose-500/20 text-rose-950 shadow-sm dark:border-rose-400/45 dark:bg-rose-500/25 dark:text-rose-50'
                      : 'border-white/50 bg-white/55 text-amber-950/85 hover:border-amber-400/55 dark:border-white/10 dark:bg-black/30 dark:text-amber-100/80 dark:hover:border-amber-400/35'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/35 bg-white/45 p-3 dark:border-white/10 dark:bg-black/25">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-left">
          <span className="flex min-w-0 items-start gap-2">
            <Shield className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-300" />
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-amber-50">
                Нэрээ нууцлах (Anonymous Session)
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-slate-600 dark:text-amber-100/55">
                Идэвхжүүлбэл уулзалтын бүртгэлд таны нэр харагдахгүй.
              </span>
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            onClick={() => setAnonymous((a) => !a)}
            className={`relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border-2 transition-colors ${
              anonymous
                ? 'border-rose-500/60 bg-rose-500/25 dark:border-rose-400/50 dark:bg-rose-500/30'
                : 'border-amber-300/60 bg-white/70 dark:border-white/20 dark:bg-black/40'
            }`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className={`absolute top-0.5 size-6 rounded-full shadow-md ${
                anonymous
                  ? 'left-[calc(100%-1.75rem)] bg-gradient-to-br from-rose-500 to-amber-500'
                  : 'left-0.5 bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-600 dark:to-rose-500'
              }`}
            />
            <span className="sr-only">
              Нэрээ нууцлах горим {anonymous ? 'идэвхтэй' : 'идэвхгүй'}
            </span>
          </button>
        </label>
      </div>

      {saved && summary && (
        <p className="mt-3 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-left text-xs text-rose-950 dark:border-rose-400/25 dark:bg-rose-500/15 dark:text-rose-50">
          Сонгосон: <span className="font-semibold">{summary}</span>
          {anonymous && (
            <span className="ml-2 font-semibold text-rose-800 dark:text-rose-100">
              · Нууц уулзалт
            </span>
          )}
        </p>
      )}

      <motion.button
        type="button"
        onClick={handleSave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-4 py-2.5 text-sm font-semibold tracking-tight text-white shadow-lg shadow-amber-900/20"
      >
        Захиалах
      </motion.button>
    </section>
  )
}
