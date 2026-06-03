import { motion } from 'framer-motion'
import { AlertTriangle, Eye } from 'lucide-react'
import SnellenChartSvg from './SnellenChartSvg'
import type { ClinicalExamState } from '../types'

function VisionSlider({
  label,
  sublabel,
  value,
  onChange,
  warn,
}: {
  label: string
  sublabel: string
  value: number
  onChange: (v: number) => void
  warn: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        warn
          ? 'border-red-300/70 bg-red-50/80 dark:border-red-500/40 dark:bg-red-950/30'
          : 'border-sky-200/60 bg-white/75 dark:border-sky-500/25 dark:bg-black/25'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sky-800 dark:text-sky-200">
            {label}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-emerald-100/55">{sublabel}</p>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-bold tabular-nums ${
            warn ? 'text-red-600 dark:text-red-300' : 'text-slate-900 dark:text-white'
          }`}
        >
          {value.toFixed(1)}
        </motion.span>
      </div>
      <input
        type="range"
        min={0.1}
        max={2.0}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-sky-200/80 accent-sky-600 dark:bg-sky-900/50"
      />
      <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-400">
        <span>0.1</span>
        <span>1.0</span>
        <span>2.0</span>
      </div>
      {warn && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-300">
          <AlertTriangle className="size-3.5 shrink-0" />
          Хараа сул — эмчийн анхаарал
        </p>
      )}
    </div>
  )
}

export default function EyeExamSection({
  state,
  onChange,
}: {
  state: ClinicalExamState
  onChange: (patch: Partial<ClinicalExamState>) => void
}) {
  const warnOD = state.visionOD < 0.5
  const warnOS = state.visionOS < 0.5

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-200">
          <Eye className="size-4" />
        </span>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Нүдний оношилгоо
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <VisionSlider
            label="OD"
            sublabel="Баруун нүд"
            value={state.visionOD}
            onChange={(visionOD) => onChange({ visionOD })}
            warn={warnOD}
          />
          <VisionSlider
            label="OS"
            sublabel="Зүүн нүд"
            value={state.visionOS}
            onChange={(visionOS) => onChange({ visionOS })}
            warn={warnOS}
          />
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-sky-200/50 bg-gradient-to-b from-sky-50/80 to-white/60 p-3 dark:border-sky-500/20 dark:from-sky-950/30 dark:to-black/20">
          <SnellenChartSvg className="h-36 w-28 sm:h-40 sm:w-32" />
          <p className="mt-2 text-center text-[10px] font-medium text-slate-500 dark:text-emerald-100/55">
            Харааны хүснэгт
          </p>
        </div>
      </div>
    </div>
  )
}
