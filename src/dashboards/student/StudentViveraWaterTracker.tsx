import { motion } from 'framer-motion'
import { Droplets, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'

const dailyGoal = 2000
const STORAGE_PREFIX = 'vivera-water-v1:'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function storageKey(email: string) {
  return `${STORAGE_PREFIX}${email.toLowerCase()}`
}

function loadIntake(email: string): number {
  try {
    const raw = localStorage.getItem(storageKey(email))
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { dateKey?: string; ml?: number }
    if (parsed.dateKey !== todayKey()) return 0
    return typeof parsed.ml === 'number' && parsed.ml >= 0 ? parsed.ml : 0
  } catch {
    return 0
  }
}

function persistIntake(email: string, ml: number) {
  try {
    localStorage.setItem(
      storageKey(email),
      JSON.stringify({ dateKey: todayKey(), ml }),
    )
  } catch {
    /* quota */
  }
}

export default function StudentViveraWaterTracker() {
  const { session } = useAuth()
  const [waterIntake, setWaterIntake] = useState(0)

  useEffect(() => {
    if (!session?.email) {
      setWaterIntake(0)
      return
    }
    setWaterIntake(loadIntake(session.email))
  }, [session?.email])

  const updateIntake = useCallback(
    (next: number) => {
      const clamped = Math.max(0, next)
      setWaterIntake(clamped)
      if (session?.email) persistIntake(session.email, clamped)
    },
    [session?.email],
  )

  const fillPercent = Math.min(100, (waterIntake / dailyGoal) * 100)
  const litersDisplay = (waterIntake / 1000).toFixed(waterIntake >= 1000 ? 1 : 2)
  const goalLiters = (dailyGoal / 1000).toFixed(1)

  return (
    <section className="rounded-2xl border border-sky-300/45 bg-gradient-to-br from-sky-500/14 via-white/65 to-emerald-500/12 p-4 shadow-lg backdrop-blur-2xl dark:border-sky-500/30 dark:from-sky-500/16 dark:via-white/[0.04] dark:to-emerald-500/14 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-left">
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            💧 Vivera Усны Төсөл
          </h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-sky-100/70">
            Өнөөдрийн ус уух хэмжээ буюу усны хэрэглээг хянах хэсэг
          </p>
        </div>
        <div className="rounded-xl border border-sky-300/40 bg-white/70 px-3 py-2 text-right shadow-sm backdrop-blur-md dark:border-sky-500/25 dark:bg-black/30">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-800/80 dark:text-sky-200/70">
            Өнөөдөр
          </p>
          <p className="text-lg font-bold tabular-nums text-sky-950 dark:text-sky-50">
            {waterIntake}
            <span className="text-sm font-semibold text-sky-700/80 dark:text-sky-200/80">
              {' '}
              / {dailyGoal} мл
            </span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-sky-100/55">
            {litersDisplay}л / {goalLiters}л · {Math.round(fillPercent)}%
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(7rem,8.5rem)_1fr] md:items-center">
        <motion.div
          className="mx-auto flex w-full max-w-[8.5rem] flex-col items-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="relative h-52 w-24 overflow-hidden rounded-t-[2rem] rounded-b-3xl border-2 border-sky-300/55 bg-white/40 shadow-inner backdrop-blur-md dark:border-sky-400/35 dark:bg-sky-950/25 sm:h-56 sm:w-28"
            role="progressbar"
            aria-valuenow={Math.round(fillPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Өдрийн усны хэрэглээ"
          >
            <div
              className="absolute inset-x-3 top-3 z-[2] h-5 rounded-full border border-sky-300/50 bg-white/50 dark:border-sky-500/30 dark:bg-sky-900/40"
              aria-hidden
            />
            <div
              className="absolute inset-x-2 bottom-2 top-9 overflow-hidden rounded-b-[1.25rem] rounded-t-md"
              aria-hidden
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-[1.2rem] bg-[#3b82f6]/90 shadow-[inset_0_2px_12px_rgba(255,255,255,0.35)] backdrop-blur-sm transition-all duration-500 ease-in-out"
                style={{ height: `${fillPercent}%` }}
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-3 z-[2] text-center">
              <span className="text-[10px] font-bold tabular-nums text-sky-900 drop-shadow-sm dark:text-white">
                {Math.round(fillPercent)}%
              </span>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-sky-800 dark:text-sky-200/80">
            <Droplets className="size-3.5" aria-hidden />
            Зорилт 2л
          </p>
        </motion.div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-violet-200/45 bg-white/75 p-3.5 text-sm leading-relaxed shadow-sm backdrop-blur-md dark:border-violet-500/20 dark:bg-black/25">
            <p className="font-semibold text-violet-900 dark:text-violet-100">
              Vivera төсөл
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-violet-100/70">
              Vivera төсөл нь сурагчдыг сургууль дээрээ цэвэр, эрүүл усаар
              хангаж эко хэрэглээг хэвшүүлэх зорилготой. Сургуулийн ухаалаг
              усан цэнэглэгчийг ашиглан саваа дүүргээрэй.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateIntake(waterIntake + 250)}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-500/20 to-emerald-500/15 px-3 py-2.5 text-sm font-semibold text-sky-950 shadow-sm transition hover:brightness-105 dark:border-sky-500/35 dark:from-sky-500/25 dark:to-emerald-500/20 dark:text-sky-50"
            >
              +250мл
              <span className="text-[11px] font-medium opacity-75">
                (Аяга ус)
              </span>
            </button>
            <button
              type="button"
              onClick={() => updateIntake(waterIntake + 500)}
              className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-300/50 bg-gradient-to-r from-violet-500/22 to-sky-500/18 px-3 py-2.5 text-sm font-semibold text-violet-950 shadow-sm transition hover:brightness-105 dark:border-violet-500/35 dark:from-violet-500/28 dark:to-sky-500/22 dark:text-violet-50"
            >
              +500мл
              <span className="text-[11px] font-medium opacity-75">
                (Vivera Сав)
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => updateIntake(0)}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Шинэчлэх
          </button>
        </div>
      </div>
    </section>
  )
}
