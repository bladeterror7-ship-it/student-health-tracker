import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  Brain,
  NotebookPen,
  Stethoscope,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { StudentMedicalClinicalSummary } from '../../features/medical-exam'
import { usePsychBookings } from '../../hooks/usePsychBookings'
import { usePsychGratitudeLogs } from '../../hooks/usePsychGratitudeLogs'
import { usePsychMoodLogs } from '../../hooks/usePsychMoodLogs'
import { useMedicalData } from '../../hooks/useMedicalData'
import { childMatchesRecord } from '../../lib/parentChildMatch'
import { readPeRecords, PE_RECORDS_EVENT } from '../../lib/peRecordsStorage'
import type { RegisteredStudent } from '../../types'
import type { PERecord } from '../../types'

type HealthTab = 'medical' | 'psych' | 'pe'

const tabs: { id: HealthTab; label: string; icon: typeof Stethoscope }[] = [
  { id: 'medical', label: 'Эмч', icon: Stethoscope },
  { id: 'psych', label: 'Сэтгэл зүйч', icon: Brain },
  { id: 'pe', label: 'Биеийн тамир', icon: Activity },
]

export default function ParentChildHealthPanel({
  child,
  studentId,
}: {
  child: RegisteredStudent
  studentId: string
}) {
  const [tab, setTab] = useState<HealthTab>('medical')
  const [peRows, setPeRows] = useState<PERecord[]>(readPeRecords)
  const { records, alerts, getProfileResolved } = useMedicalData()
  const moodLogs = usePsychMoodLogs()
  const gratitudeLogs = usePsychGratitudeLogs()
  const { bookings } = usePsychBookings()

  useEffect(() => {
    function sync() {
      setPeRows(readPeRecords())
    }
    window.addEventListener(PE_RECORDS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PE_RECORDS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const profile = getProfileResolved(studentId)

  const medicalRecords = useMemo(
    () =>
      [...records.filter((r) => r.studentId === studentId)].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [records, studentId],
  )

  const medicalAlerts = useMemo(
    () => alerts.filter((a) => a.studentId === studentId),
    [alerts, studentId],
  )

  const childMoods = useMemo(
    () =>
      moodLogs
        .filter((l) => childMatchesRecord(child, l))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [moodLogs, child],
  )

  const childGratitude = useMemo(
    () =>
      gratitudeLogs
        .filter((l) => childMatchesRecord(child, l))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [gratitudeLogs, child],
  )

  const childBookings = useMemo(
    () =>
      bookings
        .filter((b) => childMatchesRecord(child, b))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings, child],
  )

  const childPe = useMemo(
    () =>
      peRows
        .filter(
          (r) =>
            childMatchesRecord(child, {
              studentName: r.studentName,
            }),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [peRows, child],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-white/55 bg-white/75 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50"
    >
      <div className="border-b border-slate-200/80 px-4 py-4 dark:border-white/10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
          Хүүхдийн эрүүл мэндийн мэдээлэл
        </p>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-sky-50/70">
          {child.fullName} · {child.classGroup} — зөвхөн унших горим
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? 'border-sky-500/50 bg-sky-500/15 text-sky-900 dark:text-sky-100'
                    : 'border-slate-200/80 bg-white/80 text-slate-600 hover:border-sky-300 dark:border-white/15 dark:bg-black/30 dark:text-sky-50/80'
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {tab === 'medical' && (
          <>
            {profile && (
              <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-950/25">
                <p className="text-sm text-slate-700 dark:text-emerald-50/90">
                  <span className="font-semibold">Ерөнхий төлөв:</span>{' '}
                  {profile.overallStatus}
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="font-semibold">Сүүлийн үзлэг:</span>{' '}
                  {profile.lastCheckup || '—'}
                </p>
              </div>
            )}
            <StudentMedicalClinicalSummary studentId={studentId} />
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                  <NotebookPen className="size-4 text-orange-500" />
                  Эмчийн үзлэгийн түүх
                </div>
                {medicalRecords.length === 0 ? (
                  <p className="rounded-xl bg-slate-50/90 px-3 py-6 text-center text-sm text-slate-600 dark:bg-black/25 dark:text-emerald-100/60">
                    Бүртгэл байхгүй байна.
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {medicalRecords.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-black/25"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {row.recordType}
                        </p>
                        <p className="text-xs text-slate-500">{row.date}</p>
                        {row.summary.trim() ? (
                          <p className="mt-1 line-clamp-3 text-xs text-slate-600 dark:text-emerald-100/65">
                            {row.summary}
                          </p>
                        ) : null}
                        <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                          {row.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="rounded-2xl border border-orange-400/35 bg-orange-500/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-950 dark:text-orange-50">
                  <Bell className="size-4" />
                  Анхааруулга
                </div>
                {medicalAlerts.length === 0 ? (
                  <p className="text-center text-sm text-orange-900/80 dark:text-orange-50/85">
                    Анхааруулга байхгүй.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {medicalAlerts.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-xl bg-white/60 px-3 py-2 text-sm dark:bg-black/30"
                      >
                        {a.text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {tab === 'psych' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <PsychBlock
              title="Сэтгэлийн бүртгэл"
              empty="Бүртгэл байхгүй"
              count={childMoods.length}
            >
              {childMoods.slice(0, 8).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-2 rounded-xl bg-violet-50/90 px-3 py-2 text-sm dark:bg-black/30"
                >
                  <span className="text-lg">{l.moodEmoji}</span>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {l.moodLabelMn}
                      {l.isAnonymous ? ' · нууцлагдсан' : ''}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {l.createdAt.slice(0, 10)}
                    </p>
                  </div>
                </li>
              ))}
            </PsychBlock>
            <PsychBlock
              title="Талархал"
              empty="Бүртгэл байхгүй"
              count={childGratitude.length}
            >
              {childGratitude.slice(0, 5).map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl bg-violet-50/90 px-3 py-2 text-xs dark:bg-black/30"
                >
                  <p className="font-medium text-slate-800 dark:text-white">
                    {g.dayLabel}
                  </p>
                  <p className="mt-1 line-clamp-3 text-slate-600 dark:text-violet-100/70">
                    {g.combinedNote}
                  </p>
                </li>
              ))}
            </PsychBlock>
            <PsychBlock
              title="Сэтгэл зүйчийн цаг"
              empty="Захиалга байхгүй"
              count={childBookings.length}
            >
              {childBookings.slice(0, 6).map((b) => (
                <li
                  key={b.id}
                  className="rounded-xl bg-violet-50/90 px-3 py-2 text-sm dark:bg-black/30"
                >
                  <p className="font-medium text-slate-800 dark:text-white">
                    {b.date} · {b.timeSlot}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {b.isAnonymous ? 'Нууцлагдсан' : b.studentName}
                  </p>
                </li>
              ))}
            </PsychBlock>
          </div>
        )}

        {tab === 'pe' && (
          <section className="rounded-2xl border border-orange-200/60 bg-white/80 p-4 dark:border-orange-500/25 dark:bg-black/20">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
              <Activity className="size-4 text-orange-500" />
              Биеийн тамирын бүртгэл
            </div>
            {childPe.length === 0 ? (
              <p className="rounded-xl bg-slate-50/90 px-3 py-8 text-center text-sm text-slate-600 dark:bg-black/25">
                Биеийн тамирын мэдээлэл бүртгэгдээгүй байна.
              </p>
            ) : (
              <ul className="space-y-2">
                {childPe.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-orange-50/80 px-3 py-2.5 dark:bg-black/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {row.activity || 'Идэвх'}
                      </p>
                      <p className="text-xs text-slate-500">{row.date}</p>
                    </div>
                    <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm font-bold tabular-nums text-orange-900 dark:text-orange-100">
                      {row.score} оноо
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </motion.section>
  )
}

function PsychBlock({
  title,
  empty,
  count,
  children,
}: {
  title: string
  empty: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-violet-200/50 bg-violet-50/30 p-4 dark:border-violet-500/20 dark:bg-violet-950/20">
      <h4 className="mb-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
        {title}
      </h4>
      {count === 0 ? (
        <p className="text-center text-xs text-slate-500 dark:text-violet-100/55">
          {empty}
        </p>
      ) : (
        <ul className="max-h-52 space-y-2 overflow-y-auto">{children}</ul>
      )}
    </section>
  )
}
