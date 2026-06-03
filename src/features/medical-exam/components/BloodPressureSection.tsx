import { motion } from 'framer-motion'
import { Activity, AlertTriangle } from 'lucide-react'
import {
  diastolicGaugePercent,
  isBloodPressureHigh,
  systolicGaugePercent,
} from '../vitalsHelpers'
import type { ClinicalExamState } from '../types'

function parseBpInput(raw: string, max: number): number {
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, max)
}

export default function BloodPressureSection({
  state,
  onChange,
}: {
  state: ClinicalExamState
  onChange: (patch: Partial<ClinicalExamState>) => void
}) {
  const sys = state.bpSystolic
  const dia = state.bpDiastolic
  const sysFill = systolicGaugePercent(sys)
  const diaFill = diastolicGaugePercent(dia)
  const high = isBloodPressureHigh(sys, dia) && sys > 0 && dia > 0

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl border border-rose-300/50 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200">
          <Activity className="size-4" aria-hidden />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Цусны даралт (Blood Pressure)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-rose-100/55">
            Systolic / Diastolic — механик хэмжүүртэй синхрон
          </p>
        </div>
        {high && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
            <AlertTriangle className="size-3" />
            Өндөр даралт
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 rounded-2xl border border-rose-200/60 bg-white/80 p-3 dark:border-rose-500/25 dark:bg-black/25">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rose-800 dark:text-rose-200">
              Systolic (дээд)
            </span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={60}
                max={250}
                value={sys > 0 ? sys : ''}
                placeholder="120"
                onChange={(e) =>
                  onChange({
                    bpSystolic: parseBpInput(e.target.value, 250),
                  })
                }
                className="w-full max-w-[6rem] rounded-xl border border-rose-200/70 bg-white px-3 py-2 text-lg font-semibold tabular-nums text-slate-900 outline-none ring-rose-400/30 focus:ring-2 dark:border-white/15 dark:bg-black/40 dark:text-white"
              />
              <span className="text-xs font-medium text-slate-500">mmHg</span>
            </div>
          </label>
          <label className="block space-y-1.5 rounded-2xl border border-rose-200/60 bg-white/80 p-3 dark:border-rose-500/25 dark:bg-black/25">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rose-800 dark:text-rose-200">
              Diastolic (доод)
            </span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={40}
                max={150}
                value={dia > 0 ? dia : ''}
                placeholder="80"
                onChange={(e) =>
                  onChange({
                    bpDiastolic: parseBpInput(e.target.value, 150),
                  })
                }
                className="w-full max-w-[6rem] rounded-xl border border-rose-200/70 bg-white px-3 py-2 text-lg font-semibold tabular-nums text-slate-900 outline-none ring-rose-400/30 focus:ring-2 dark:border-white/15 dark:bg-black/40 dark:text-white"
              />
              <span className="text-xs font-medium text-slate-500">mmHg</span>
            </div>
          </label>
          {sys > 0 && dia > 0 && (
            <p className="sm:col-span-2 text-center text-sm font-semibold tabular-nums text-slate-800 dark:text-rose-50">
              Бүртгэл:{' '}
              <span className={high ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-300'}>
                {sys}/{dia} mmHg
              </span>
            </p>
          )}
        </div>

        {/* Механик даралтын аппарат — босоо хэмжүүр */}
        <div
          className="mx-auto flex shrink-0 items-end justify-center gap-4 rounded-3xl border border-slate-200/70 bg-gradient-to-b from-slate-100/90 to-white/60 px-6 py-5 shadow-inner dark:border-white/10 dark:from-slate-900/60 dark:to-black/30"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold uppercase text-slate-500">SYS</span>
            <div className="relative h-44 w-11 overflow-hidden rounded-full border-2 border-slate-300/80 bg-gradient-to-b from-sky-50/90 to-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.08)] dark:border-slate-600 dark:from-slate-800 dark:to-slate-950">
              {[200, 160, 120, 80].map((tick) => (
                <span
                  key={tick}
                  className="pointer-events-none absolute right-0.5 z-10 text-[8px] font-medium text-slate-400"
                  style={{ bottom: `${systolicGaugePercent(tick)}%`, transform: 'translateY(50%)' }}
                >
                  {tick}
                </span>
              ))}
              <motion.div
                className="absolute inset-x-1 bottom-1 rounded-full bg-gradient-to-t from-rose-700 via-red-500 to-amber-300 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
                initial={false}
                animate={{ height: `${sysFill}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-2 bottom-2 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold uppercase text-slate-500">DIA</span>
            <div className="relative h-32 w-8 overflow-hidden rounded-full border-2 border-slate-300/70 bg-gradient-to-b from-sky-50/80 to-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)] dark:border-slate-600 dark:from-slate-800 dark:to-slate-950">
              <motion.div
                className="absolute inset-x-0.5 bottom-0.5 rounded-full bg-gradient-to-t from-indigo-700 via-violet-500 to-violet-300/90"
                initial={false}
                animate={{ height: `${diaFill}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              />
            </div>
          </div>

          <div className="hidden h-40 w-px bg-slate-300/60 sm:block dark:bg-white/15" />

          <div className="flex h-44 flex-col justify-end pb-2">
            <div className="rounded-2xl border border-slate-300/60 bg-slate-800/90 px-3 py-2 shadow-lg dark:bg-slate-900">
              <p className="text-[8px] font-medium uppercase tracking-wider text-slate-400">
                Monitor
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-emerald-400">
                {sys > 0 ? sys : '—'}
                <span className="text-slate-500">/</span>
                {dia > 0 ? dia : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
