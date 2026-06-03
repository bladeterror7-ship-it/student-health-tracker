import { motion } from 'framer-motion'
import { Activity, Wind } from 'lucide-react'
import type { ClinicalExamState } from '../types'

function AnatomySvg({ alert }: { alert: boolean }) {
  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-40 w-full max-w-[220px]" aria-hidden>
      <defs>
        <linearGradient id="lungGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(167 243 208)" />
          <stop offset="100%" stopColor="rgb(52 211 153)" />
        </linearGradient>
      </defs>
      {/* Trachea */}
      <rect x="94" y="18" width="12" height="36" rx="4" className="fill-slate-300/80 dark:fill-slate-600" />
      {/* Heart */}
      <motion.path
        d="M100 58 C88 48 72 52 72 66 C72 82 100 98 100 98 C100 98 128 82 128 66 C128 52 112 48 100 58 Z"
        className="fill-rose-400/75 stroke-rose-500/60 dark:fill-rose-500/50"
        strokeWidth="1.5"
        animate={alert ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: alert ? Infinity : 0 }}
        style={{ transformOrigin: '100px 75px' }}
      />
      {/* Left lung */}
      <motion.path
        d="M98 42 C70 42 48 58 42 82 C38 100 48 118 72 128 L98 120 Z"
        fill="url(#lungGrad)"
        className="stroke-emerald-600/50"
        strokeWidth="1.5"
        animate={
          alert
            ? { opacity: [0.85, 1, 0.85], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }
            : { opacity: 1 }
        }
        transition={{ duration: 1.4, repeat: alert ? Infinity : 0 }}
      />
      {/* Right lung */}
      <motion.path
        d="M102 42 C130 42 152 58 158 82 C162 100 152 118 128 128 L102 120 Z"
        fill="url(#lungGrad)"
        className="stroke-emerald-600/50"
        strokeWidth="1.5"
        animate={
          alert
            ? { opacity: [0.85, 1, 0.85], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }
            : { opacity: 1 }
        }
        transition={{ duration: 1.4, repeat: alert ? Infinity : 0, delay: 0.2 }}
      />
      {alert && (
        <>
          <motion.circle
            cx="65"
            cy="90"
            r="18"
            className="fill-red-500/25 stroke-red-500/50"
            strokeWidth="1"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="135"
            cy="90"
            r="18"
            className="fill-red-500/25 stroke-red-500/50"
            strokeWidth="1"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
    </svg>
  )
}

function ToggleChip({
  active,
  label,
  onClick,
  tone,
}: {
  active: boolean
  label: string
  onClick: () => void
  tone: 'neutral' | 'alert'
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? tone === 'alert'
            ? 'border-red-400/60 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-400/25 dark:border-red-500/45 dark:bg-red-950/40 dark:text-red-200'
            : 'border-emerald-400/50 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/35 dark:text-emerald-100'
          : 'border-slate-200/80 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-black/25 dark:text-emerald-100/65'
      }`}
    >
      {label}
    </motion.button>
  )
}

export default function RespiratoryExamSection({
  state,
  onChange,
}: {
  state: ClinicalExamState
  onChange: (patch: Partial<ClinicalExamState>) => void
}) {
  const alert = state.cough || state.breathAbnormal

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-200">
          <Wind className="size-4" />
        </span>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Амьсгалын тогтолцоо
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 transition ${
            alert
              ? 'border-red-300/50 bg-red-50/30 dark:border-red-500/30 dark:bg-red-950/20'
              : 'border-teal-200/50 bg-white/70 dark:border-teal-500/20 dark:bg-black/25'
          }`}
        >
          <AnatomySvg alert={alert} />
          {alert && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] font-semibold text-red-600 dark:text-red-300"
            >
              <Activity className="size-3.5" />
              Амьсгалын анхаарал шаардлагатай бүс
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-500 dark:text-emerald-100/55">
            Ханиалгах
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ToggleChip
              active={!state.cough}
              label="Үгүй"
              tone="neutral"
              onClick={() => onChange({ cough: false })}
            />
            <ToggleChip
              active={state.cough}
              label="Тийм"
              tone="alert"
              onClick={() => onChange({ cough: true })}
            />
          </div>

          <p className="pt-2 text-[11px] font-medium text-slate-500 dark:text-emerald-100/55">
            Амьсгалын сонсгол
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ToggleChip
              active={!state.breathAbnormal}
              label="Хэвийн"
              tone="neutral"
              onClick={() => onChange({ breathAbnormal: false })}
            />
            <ToggleChip
              active={state.breathAbnormal}
              label="Хэвийн бус"
              tone="alert"
              onClick={() => onChange({ breathAbnormal: true })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
