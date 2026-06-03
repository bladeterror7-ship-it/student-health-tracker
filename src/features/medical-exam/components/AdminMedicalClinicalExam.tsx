import { motion } from 'framer-motion'
import { Calendar, ClipboardPlus, Plus, Stethoscope } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useMedicalData } from '../../../hooks/useMedicalData'
import { buildClinicalExamSummary } from '../clinicalExamSummary'
import { formatExamDateMn, todayYmd } from '../clinicalExamRecords'
import { DEFAULT_CLINICAL_EXAM, type ClinicalExamState } from '../types'
import ClinicalExamDetailCard from './ClinicalExamDetailCard'
import BloodPressureSection from './BloodPressureSection'
import DentalMapSection from './DentalMapSection'
import EyeExamSection from './EyeExamSection'
import PulseEcgSection from './PulseEcgSection'
import RespiratoryExamSection from './RespiratoryExamSection'

export default function AdminMedicalClinicalExam({
  studentId,
  defaultExamDate,
  onAppendSummary,
}: {
  studentId: string
  defaultExamDate?: string
  onAppendSummary?: (text: string) => void
}) {
  const {
    listClinicalExams,
    getClinicalExamRecord,
    createClinicalExam,
    updateClinicalExamRecord,
    updateClinicalExamDate,
  } = useMedicalData()

  const history = useMemo(
    () => (studentId ? listClinicalExams(studentId) : []),
    [studentId, listClinicalExams],
  )

  const [activeExamId, setActiveExamId] = useState<string | null>(null)
  const [exam, setExam] = useState<ClinicalExamState>(DEFAULT_CLINICAL_EXAM)
  const [examDateInput, setExamDateInput] = useState(todayYmd())

  useEffect(() => {
    if (!studentId) {
      setActiveExamId(null)
      setExam({ ...DEFAULT_CLINICAL_EXAM, teeth: {} })
      return
    }
    if (history.length === 0) {
      setActiveExamId(null)
      setExam({ ...DEFAULT_CLINICAL_EXAM, teeth: {} })
      setExamDateInput(defaultExamDate?.trim() || todayYmd())
      return
    }
    setActiveExamId((cur) =>
      cur && history.some((r) => r.id === cur) ? cur : history[0].id,
    )
  }, [studentId, history, defaultExamDate])

  useEffect(() => {
    if (!studentId || !activeExamId) return
    const row = getClinicalExamRecord(studentId, activeExamId)
    if (row) {
      setExam(row.state)
      setExamDateInput(row.examDate)
    }
  }, [studentId, activeExamId, getClinicalExamRecord])

  const patch = useCallback(
    (partial: Partial<ClinicalExamState>) => {
      if (!studentId || !activeExamId) return
      setExam((prev) => {
        const next = { ...prev, ...partial }
        updateClinicalExamRecord(studentId, activeExamId, next)
        return next
      })
    },
    [studentId, activeExamId, updateClinicalExamRecord],
  )

  function handleNewExam() {
    if (!studentId) return
    const date = examDateInput.trim() || defaultExamDate?.trim() || todayYmd()
    const id = createClinicalExam(studentId, date)
    setActiveExamId(id)
    setExam({ ...DEFAULT_CLINICAL_EXAM, teeth: {} })
    toast.success('Шинэ үзлэг эхлүүллээ')
  }

  function handleExamDateBlur() {
    if (!studentId || !activeExamId) return
    updateClinicalExamDate(studentId, activeExamId, examDateInput)
  }

  function handleAppend() {
    if (!activeExamId) {
      toast.error('Эхлээд үзлэг сонгох эсвэл шинэ үзлэг үүсгэнэ үү')
      return
    }
    const text = buildClinicalExamSummary(exam, examDateInput)
    onAppendSummary?.(text)
    toast.success('Үзлэгийн тайлбарт нэмэгдлээ — түүхэнд хадгалагдана')
  }

  function selectExam(id: string) {
    if (!studentId) return
    const row = getClinicalExamRecord(studentId, id)
    if (!row) return
    setActiveExamId(id)
    setExam(row.state)
    setExamDateInput(row.examDate)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50/90 via-white/80 to-orange-50/50 p-5 shadow-lg backdrop-blur-2xl dark:border-emerald-500/25 dark:from-emerald-950/40 dark:via-slate-950/50 dark:to-orange-950/20 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/15 text-emerald-800 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-100">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Эмчийн үзлэг — Шүд · Нүд · Амьсгал
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-emerald-100/65">
              {studentId
                ? `${history.length} үзлэгийн түүх — сурагчид бүгд харагдана`
                : 'Эхлээд дээрх бүртгэлээс сурагч сонгоно уу'}
            </p>
          </div>
        </div>
        {studentId && onAppendSummary && activeExamId && (
          <button
            type="button"
            onClick={handleAppend}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/45 bg-white/90 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-500/35 dark:bg-black/35 dark:text-emerald-100"
          >
            <ClipboardPlus className="size-4" />
            Тайлбарт нэгтгэх
          </button>
        )}
      </div>

      {!studentId ? (
        <p className="rounded-2xl border border-dashed border-emerald-300/50 bg-white/50 px-4 py-8 text-center text-sm text-slate-500 dark:border-emerald-500/25 dark:bg-black/20 dark:text-emerald-100/55">
          Сурагч сонгосны дараа шүд, нүд, амьсгалын үзлэгийг энд бөглөнө.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-200/50 bg-white/70 p-4 dark:border-emerald-500/20 dark:bg-black/25">
            <label className="block min-w-[140px] flex-1 space-y-1">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-900/85 dark:text-emerald-50/80">
                <Calendar className="size-3.5" />
                Үзлэгийн огноо
              </span>
              <input
                type="date"
                value={examDateInput}
                onChange={(e) => setExamDateInput(e.target.value)}
                onBlur={handleExamDateBlur}
                disabled={!activeExamId}
                className="w-full rounded-lg border border-emerald-200/70 bg-white/90 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-black/35 dark:text-white disabled:opacity-50"
              />
            </label>
            <button
              type="button"
              onClick={handleNewExam}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            >
              <Plus className="size-4" />
              Шинэ үзлэг
            </button>
          </div>

          {history.length > 0 && (
            <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-emerald-100/55">
                Үзлэгийн түүх
              </p>
              <ul className="flex flex-wrap gap-2">
                {history.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => selectExam(row.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        row.id === activeExamId
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                          : 'border-slate-200/80 bg-white/80 text-slate-700 hover:border-emerald-300 dark:border-white/15 dark:bg-black/30 dark:text-emerald-50/85'
                      }`}
                    >
                      {formatExamDateMn(row.examDate)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!activeExamId ? (
            <p className="rounded-2xl border border-dashed border-emerald-300/50 bg-white/50 px-4 py-8 text-center text-sm text-slate-600 dark:border-emerald-500/25 dark:bg-black/20 dark:text-emerald-100/65">
              «Шинэ үзлэг» дарж эхлүүлнэ үү. Өмнөх үзлэгүүд дээр дарж
              засварлана.
            </p>
          ) : (
            <div className="space-y-6">
              <ClinicalExamDetailCard
                record={{
                  id: activeExamId,
                  examDate: examDateInput,
                  savedAt: '',
                  state: exam,
                }}
                showDate={false}
              />
              <div className="rounded-2xl border border-emerald-200/45 bg-white/60 p-4 dark:border-emerald-500/20 dark:bg-black/20">
                <DentalMapSection state={exam} onChange={patch} />
              </div>
              <div className="rounded-2xl border border-sky-200/45 bg-white/60 p-4 dark:border-sky-500/20 dark:bg-black/20">
                <EyeExamSection state={exam} onChange={patch} />
              </div>
              <div className="rounded-2xl border border-rose-200/45 bg-gradient-to-br from-rose-50/50 via-white/60 to-pink-50/40 p-4 dark:border-rose-500/20 dark:from-rose-950/25 dark:via-black/20 dark:to-pink-950/20">
                <BloodPressureSection state={exam} onChange={patch} />
              </div>
              <div className="rounded-2xl border border-pink-200/45 bg-gradient-to-br from-pink-50/40 via-white/60 to-slate-50/50 p-4 dark:border-pink-500/20 dark:from-pink-950/20 dark:via-black/20 dark:to-slate-950/30">
                <PulseEcgSection state={exam} onChange={patch} />
              </div>
              <div className="rounded-2xl border border-teal-200/45 bg-white/60 p-4 dark:border-teal-500/20 dark:bg-black/20">
                <RespiratoryExamSection state={exam} onChange={patch} />
              </div>
            </div>
          )}
        </div>
      )}
    </motion.section>
  )
}
