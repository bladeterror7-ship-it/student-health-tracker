import { AlertTriangle } from 'lucide-react'
import { countTeethByStatus } from '../clinicalExamSummary'
import { formatExamDateMn } from '../clinicalExamRecords'
import type { ClinicalExamRecord } from '../types'

export default function ClinicalExamDetailCard({
  record,
  showDate = true,
}: {
  record: ClinicalExamRecord
  showDate?: boolean
}) {
  const { state } = record
  const { caries, filled } = countTeethByStatus(state)
  const visionLow = state.visionOD < 0.5 || state.visionOS < 0.5
  const respAlert = state.cough || state.breathAbnormal

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {showDate && (
        <p className="sm:col-span-3 text-xs font-medium text-slate-500 dark:text-emerald-100/55">
          {formatExamDateMn(record.examDate)}
        </p>
      )}
      <div className="rounded-xl border border-emerald-200/60 bg-white/80 p-3 dark:border-emerald-500/20 dark:bg-black/25">
        <p className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-200">
          Шүд
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-emerald-50/90">
          Цоорсон: <strong className="text-red-600">{caries}</strong> ·
          Ломбодсон: <strong className="text-blue-600">{filled}</strong>
        </p>
      </div>
      <div
        className={`rounded-xl border p-3 ${
          visionLow
            ? 'border-red-300/60 bg-red-50/80 dark:border-red-500/35 dark:bg-red-950/30'
            : 'border-sky-200/60 bg-white/80 dark:border-sky-500/20 dark:bg-black/25'
        }`}
      >
        <p className="text-[10px] font-bold uppercase text-sky-800 dark:text-sky-200">
          Хараа
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 dark:text-white">
          OD {state.visionOD.toFixed(1)} · OS {state.visionOS.toFixed(1)}
        </p>
        {visionLow && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
            <AlertTriangle className="size-3" />
            Анхаарал шаардлагатай
          </p>
        )}
      </div>
      <div
        className={`rounded-xl border p-3 ${
          respAlert
            ? 'border-red-300/60 bg-red-50/80 dark:border-red-500/35 dark:bg-red-950/30'
            : 'border-teal-200/60 bg-white/80 dark:border-teal-500/20 dark:bg-black/25'
        }`}
      >
        <p className="text-[10px] font-bold uppercase text-teal-800 dark:text-teal-200">
          Амьсгал
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-emerald-50/90">
          Ханиалга: {state.cough ? 'тийм' : 'үгүй'}
          <br />
          Сонсгол: {state.breathAbnormal ? 'хэвийн бус' : 'хэвийн'}
        </p>
      </div>
    </div>
  )
}
