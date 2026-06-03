import { motion } from 'framer-motion'
import { Brain, ChevronDown, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedicalData } from '../../../hooks/useMedicalData'
import { formatExamDateMn } from '../clinicalExamRecords'
import ClinicalExamDetailCard from './ClinicalExamDetailCard'

export default function StudentMedicalClinicalSummary({
  studentId,
}: {
  studentId: string | null
}) {
  const { listClinicalExams } = useMedicalData()
  const history = studentId ? listClinicalExams(studentId) : []
  const [openId, setOpenId] = useState<string | null>(null)

  if (!studentId) return null

  if (history.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-emerald-300/50 bg-emerald-50/40 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/20">
        <p className="text-sm text-slate-600 dark:text-emerald-100/70">
          Эмчийн дэлгэрэнгүй үзлэг (шүд, нүд, амьсгал) хийгдсний дараа энд
          түүхээр харагдана.
        </p>
      </section>
    )
  }

  const latest = history[0]

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-300/45 bg-gradient-to-br from-emerald-50/90 to-white/80 p-4 shadow-sm dark:border-emerald-500/25 dark:from-emerald-950/35 dark:to-slate-950/40 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-5 text-emerald-700 dark:text-emerald-300" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Эмчийн үзлэгийн түүх
          </h3>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
          {history.length} үзлэг
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 dark:bg-emerald-500/15">
        <p className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-200">
          Сүүлийн үзлэг
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-emerald-100/70">
          {formatExamDateMn(latest.examDate)}
        </p>
        <div className="mt-3">
          <ClinicalExamDetailCard record={latest} showDate={false} />
        </div>
      </div>

      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-emerald-100/55">
            Өмнөх үзлэгүүд
          </p>
          <ul className="space-y-2">
            {history.slice(1).map((row) => {
              const expanded = openId === row.id
              return (
                <li
                  key={row.id}
                  className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 dark:border-white/10 dark:bg-black/25"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenId(expanded ? null : row.id)
                    }
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-800 dark:text-white"
                  >
                    {formatExamDateMn(row.examDate)}
                    <ChevronDown
                      className={`size-4 shrink-0 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <div className="border-t border-slate-200/60 px-3 py-3 dark:border-white/10">
                      <ClinicalExamDetailCard record={row} showDate={false} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-500 dark:text-emerald-100/55">
        Сэтгэл зүйн тест →{' '}
        <Link
          to="/dashboard?tab=psych"
          className="inline-flex items-center gap-0.5 font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
        >
          <Brain className="size-3" />
          Сэтгэл зүйч таб
        </Link>
      </p>
    </motion.section>
  )
}
