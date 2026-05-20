import { motion } from 'framer-motion'
import { Award, Flame, TrendingUp } from 'lucide-react'
import type { WeeklyStatsSummary } from '../utils/weeklyStats'
import { formatLiters } from '../utils/weeklyStats'

type Props = {
  summary: WeeklyStatsSummary
}

function CircularProgress({ percent }: { percent: number }) {
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c

  return (
    <div className="relative size-28 shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#viveraRingGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="viveraRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007AFF" />
            <stop offset="100%" stopColor="#34C759" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-vivera-primary">
          {percent}%
        </span>
        <span className="text-[10px] font-medium text-slate-500">7 хоног</span>
      </div>
    </div>
  )
}

export default function WeeklySummaryCard({ summary }: Props) {
  const {
    totalIntakeMl,
    totalGoalMl,
    weeklyPercent,
    bestDay,
    goalStreak,
  } = summary

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          7 хоногийн нийлбэр
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {formatLiters(totalIntakeMl, 1)}
          <span className="text-base font-semibold text-slate-400">
            {' '}
            / {formatLiters(totalGoalMl, 1)}
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Даваа–Ням · өдөр бүр зорилтоо хөөн урагшил
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-vivera-secondary/30 bg-vivera-secondary/10 px-3 py-1 text-xs font-semibold text-vivera-secondary">
            <Award className="size-3.5" aria-hidden />
            Шилдэг өдөр: {bestDay.dayLabel} ({formatLiters(bestDay.intakeMl)})
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-vivera-accent/35 bg-vivera-accent/10 px-3 py-1 text-xs font-semibold text-amber-800">
            <Flame className="size-3.5 text-vivera-accent" aria-hidden />
            Зорилт: {goalStreak} өдөр
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 self-center sm:self-auto">
        <CircularProgress percent={weeklyPercent} />
        <div className="hidden text-left sm:block">
          <p className="flex items-center gap-1 text-xs font-semibold text-vivera-primary">
            <TrendingUp className="size-3.5" aria-hidden />
            Долоо хоногийн ахиц
          </p>
          <p className="mt-1 max-w-[120px] text-[11px] leading-snug text-slate-500">
            Зорилтоо биелүүлсэн өдөр бүр ургамал томорно
          </p>
        </div>
      </div>
    </div>
  )
}
