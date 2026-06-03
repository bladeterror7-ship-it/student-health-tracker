import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  Brain,
  ChevronRight,
  Droplets,
  HeartPulse,
  NotebookPen,
  Stethoscope,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useMedicalData } from '../../hooks/useMedicalData'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import { useNotifications } from '../../context/useNotifications'
import { readPsychMoodLogs } from '../../lib/psychActivityStorage'
import { StudentMedicalClinicalSummary } from '../../features/medical-exam'
import StudentMedicalAppointment from './StudentMedicalAppointment'
import StudentMedicalAskDoctor from './StudentMedicalAskDoctor'
import StudentPeActivitySection from './StudentPeActivitySection.tsx'
import StudentPsychBreathing from './StudentPsychBreathing'
import StudentPsychResources from './StudentPsychResources'
import { StudentPsychInteractiveHub } from '../../features/psych'
import { ViveraDashboard } from '../../features/vivera'
import StudentPsychGratitude, {
  type PsychJournalEntry,
} from './StudentPsychGratitude'
import { appendPsychMoodLog } from '../../lib/psychActivityStorage'
import StudentPsychMoodPicker, {
  loadPsychDailyMoodFromStorage,
  PSYCH_MOOD_ADVICE_BY_ID,
  PSYCH_MOOD_EMOJI_BY_ID,
  PSYCH_MOOD_LABEL_BY_ID,
  PSYCH_MOOD_SCORE_BY_ID,
  type PsychMoodId,
} from './StudentPsychMoodPicker.tsx'
import StudentPsychMoodWeekChart from './StudentPsychMoodWeekChart.tsx'
import StudentPsychSessionBooking from './StudentPsychSessionBooking'

type TabId = 'medical' | 'psych' | 'pe' | 'vivera'

const tabs: {
  id: TabId
  label: string
  subtitle: string
  icon: typeof Stethoscope
}[] = [
  {
    id: 'medical',
    label: 'Эмч',
    subtitle: 'Эрүүл мэнд',
    icon: Stethoscope,
  },
  {
    id: 'psych',
    label: 'Сэтгэл зүйч',
    subtitle: 'Сэтгэл хөдлөл',
    icon: Brain,
  },
  {
    id: 'pe',
    label: 'Биеийн тамир',
    subtitle: 'Идэвх & оноо',
    icon: Activity,
  },
  {
    id: 'vivera',
    label: 'Усны төсөл',
    subtitle: 'Vivera',
    icon: Droplets,
  },
]

const tabPanelClass: Record<TabId, string> = {
  medical:
    'border-emerald-200/70 bg-gradient-to-b from-emerald-50/80 to-white/70 dark:border-emerald-500/25 dark:from-emerald-950/40 dark:to-slate-950/45',
  psych:
    'border-violet-200/70 bg-gradient-to-b from-violet-50/80 to-white/70 dark:border-violet-500/25 dark:from-violet-950/35 dark:to-slate-950/45',
  pe: 'border-orange-200/70 bg-gradient-to-b from-orange-50/80 to-white/70 dark:border-orange-500/25 dark:from-orange-950/35 dark:to-slate-950/45',
  vivera:
    'border-sky-200/70 bg-vivera-surface dark:border-sky-500/25 dark:from-sky-950/30 dark:to-slate-950/45',
}

const PSYCH_DEFAULT_ADVICE_TEXT =
  'Богино амралтаа төлөвлөж, ахицаа бичээрэй — сэтгэл зүйчтэй хуваалцахад тустай.'

const EMPTY_WEEKLY_MOOD_SCORES: number[] = [0, 0, 0, 0, 0, 0, 0]

function weeklyScoresFromMoodLogs(email: string): number[] {
  const logs = readPsychMoodLogs().filter(
    (l) => l.studentEmail.toLowerCase() === email.toLowerCase(),
  )
  const end = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    const dk = d.toISOString().slice(0, 10)
    const dayLogs = logs.filter((l) => l.createdAt.slice(0, 10) === dk)
    if (dayLogs.length === 0) return 0
    return Math.min(...dayLogs.map((l) => l.moodScore))
  })
}

const TAB_IDS: TabId[] = ['medical', 'psych', 'pe', 'vivera']

function tabFromSearchParams(params: URLSearchParams): TabId {
  const raw = params.get('tab')
  return TAB_IDS.includes(raw as TabId) ? (raw as TabId) : 'medical'
}

export default function StudentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>(() => tabFromSearchParams(searchParams))
  const [psychAmbient, setPsychAmbient] = useState<PsychMoodId | null>(() =>
    loadPsychDailyMoodFromStorage(),
  )
  const [weeklyScores, setWeeklyScores] = useState<number[]>(EMPTY_WEEKLY_MOOD_SCORES)
  const [psychJournal, setPsychJournal] = useState<PsychJournalEntry[]>([])

  const { session } = useAuth()
  const { students } = useStudentRegistry()
  const { unreadCountByType, markReadByType } = useNotifications()
  const psychUnread = unreadCountByType('psychology') > 0
  const {
    records: medicalRecords,
    alerts: medicalAlertsAll,
    getProfileResolved,
  } = useMedicalData()

  const registryMatch = useMemo(() => {
    if (!session) return undefined
    return students.find(
      (s) => s.email.toLowerCase() === session.email.toLowerCase(),
    )
  }, [students, session])

  const studentId = registryMatch?.id ?? null

  useEffect(() => {
    const next = tabFromSearchParams(searchParams)
    setTab((current) => (current === next ? current : next))
  }, [searchParams])

  function selectTab(next: TabId) {
    setTab(next)
    setSearchParams(
      next === 'medical' ? {} : { tab: next },
      { replace: true },
    )
    if (next === 'psych') markReadByType('psychology')
  }

  useEffect(() => {
    if (!session?.email) {
      setWeeklyScores(EMPTY_WEEKLY_MOOD_SCORES)
      return
    }
    const fromLogs = weeklyScoresFromMoodLogs(session.email)
    const stored = loadPsychDailyMoodFromStorage()
    const next = [...fromLogs]
    if (stored != null) next[6] = PSYCH_MOOD_SCORE_BY_ID[stored]
    setWeeklyScores(next)
  }, [session?.email])

  const medicalProfile = studentId ? getProfileResolved(studentId) : null

  const mineMedicalRecords = useMemo(() => {
    if (!studentId) return []
    return [...medicalRecords.filter((r) => r.studentId === studentId)].sort(
      (a, b) => b.date.localeCompare(a.date),
    )
  }, [medicalRecords, studentId])

  const mineMedicalAlerts = useMemo(() => {
    if (!studentId) return []
    return medicalAlertsAll.filter((a) => a.studentId === studentId)
  }, [medicalAlertsAll, studentId])

  const onPsychMoodChange = useCallback(
    (mood: PsychMoodId | null) => {
      setPsychAmbient(mood)
      if (mood == null) return
      const todayScore = PSYCH_MOOD_SCORE_BY_ID[mood]
      setWeeklyScores((prev) => {
        const next = [...prev]
        next[6] = todayScore
        return next
      })
      if (session) {
        appendPsychMoodLog({
          studentName: session.displayName?.trim() || 'Сурагч',
          studentEmail: session.email,
          moodId: mood,
          moodEmoji: PSYCH_MOOD_EMOJI_BY_ID[mood],
          moodLabelMn: PSYCH_MOOD_LABEL_BY_ID[mood],
          moodScore: todayScore,
        })
      }
    },
    [session],
  )

  const onGratitudeJournalEntry = useCallback((entry: PsychJournalEntry) => {
    setPsychJournal((prev) => [entry, ...prev])
  }, [])

  const psychAuraClass =
    psychAmbient === 'happy'
      ? 'from-amber-400/35 via-violet-400/30 to-fuchsia-500/25'
      : psychAmbient === 'content'
        ? 'from-sky-400/35 via-violet-400/28 to-indigo-500/22'
        : psychAmbient === 'tired'
          ? 'from-slate-400/30 via-violet-400/20 to-sky-500/20'
          : psychAmbient === 'stressed'
            ? 'from-rose-400/28 via-violet-500/22 to-orange-400/18'
            : psychAmbient === 'sad'
              ? 'from-indigo-500/35 via-violet-600/25 to-slate-600/22'
              : 'from-violet-400/15 via-transparent to-sky-400/12'

  const moodAvg = useMemo(() => {
    const sum = weeklyScores.reduce((a, b) => a + b, 0)
    return (sum / weeklyScores.length).toFixed(1)
  }, [weeklyScores])

  return (
    <div className="space-y-6">
      <div
        className="flex gap-2 overflow-x-auto rounded-2xl border border-white/40 bg-white/55 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
        role="tablist"
        aria-label="Сурагчийн хэсгүүд"
      >
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          const showPsychDot = t.id === 'psych' && psychUnread && !active
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`student-panel-${t.id}`}
              id={`student-tab-${t.id}`}
              onClick={() => selectTab(t.id)}
              className={`relative flex min-w-[120px] flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition sm:min-w-[130px] sm:gap-3 sm:px-3 ${
                active
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-emerald-100/55 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="student-tab-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/35 via-white/70 to-emerald-400/35 shadow-inner dark:from-orange-500/25 dark:via-white/10 dark:to-emerald-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative flex size-10 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-white/10">
                <Icon className="size-5 text-orange-600 dark:text-orange-300" />
                {showPsychDot && (
                  <span
                    className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"
                    aria-hidden
                  />
                )}
              </span>
              <span className="relative">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block text-[11px] text-slate-500 dark:text-emerald-100/55">
                  {t.subtitle}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div
        id={`student-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`student-tab-${tab}`}
        className={`relative min-h-0 rounded-3xl border p-5 shadow-xl backdrop-blur-2xl sm:p-7 ${tabPanelClass[tab]}`}
      >
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="space-y-5"
        >
          {tab === 'medical' && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <StudentMedicalAppointment />
                <StudentMedicalAskDoctor />
              </div>

              <StudentMedicalClinicalSummary studentId={studentId} />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    Ерөнхий төлөв
                  </p>
                  {!studentId ? (
                    <>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-100">
                        Сурагчийн бүртгэл таарахгүй байна.
                      </p>
                      <p className="text-sm text-slate-600 dark:text-emerald-100/65">
                        Админд бүртгүүлсэн имэйлээрээ нэвтэрсэн эсэхээ
                        шалгана уу — эмчийн түүх нэвтрэх сурагчийн ID-д
                        холбогдоно.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="break-words text-xl font-semibold text-slate-900 dark:text-white">
                        {medicalProfile?.overallStatus ??
                          'Өгөгдөл бүртгэгдээгүй байна'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-emerald-100/65">
                        Сүүлийн үзлэг:{' '}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {medicalProfile?.lastCheckup ?? '—'}
                        </span>
                      </p>
                    </>
                  )}
                </div>
                <div className="grid min-w-[200px] max-w-full gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm dark:bg-emerald-500/15">
                  <div className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-50">
                    <HeartPulse className="size-4 shrink-0" />
                    Үзүүлэлтүүд
                  </div>
                  <ul className="space-y-1 break-words text-emerald-900/90 dark:text-emerald-50/85">
                    <li>Импульс: {medicalProfile?.vitals.pulse ?? '—'}</li>
                    <li>Даралт: {medicalProfile?.vitals.pressure ?? '—'}</li>
                    <li>Хараа: {medicalProfile?.vitals.vision ?? '—'}</li>
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                    <NotebookPen className="size-4 shrink-0 text-orange-500" />
                    Үзлэгийн түүх
                  </div>
                  {!studentId ? (
                    <p className="rounded-xl bg-slate-50/90 px-3 py-6 text-center text-sm text-slate-600 dark:bg-black/25 dark:text-emerald-100/60">
                      Бүртгэл олдоогүй тул түүхийг үзүүлэх боломжгүй.
                    </p>
                  ) : mineMedicalRecords.length === 0 ? (
                    <p className="rounded-xl bg-slate-50/90 px-3 py-6 text-center text-sm text-slate-600 dark:bg-black/25 dark:text-emerald-100/60">
                      Эмчийн системд түүх бүртгэгдээгүй байна.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {mineMedicalRecords.map((row) => (
                        <li
                          key={row.id}
                          className="flex min-w-0 items-start justify-between gap-3 rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-black/25"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-slate-900 dark:text-white">
                              {row.recordType}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-emerald-100/55">
                              {row.date}
                            </p>
                            {row.summary.trim() ? (
                              <p className="mt-2 line-clamp-4 text-xs leading-snug text-slate-600 dark:text-emerald-100/65">
                                {row.summary}
                              </p>
                            ) : null}
                            {row.alert ? (
                              <p className="mt-1 text-[11px] font-semibold text-orange-800 dark:text-orange-200">
                                {row.alert}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-center text-[11px] font-semibold leading-tight text-emerald-800 dark:text-emerald-200">
                            {row.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="min-w-0 rounded-2xl border border-orange-400/35 bg-orange-500/10 p-4 dark:bg-orange-500/15">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-950 dark:text-orange-50">
                    <Bell className="size-4 shrink-0" />
                    Эрүүл мэндийн анхааруулга
                  </div>
                  {!studentId ? (
                    <p className="rounded-xl bg-white/50 px-3 py-6 text-center text-sm text-orange-900/85 dark:bg-black/30 dark:text-orange-50/85">
                      Бүртгэлээр дамжуулах анхааруулгууд энд харагдана.
                    </p>
                  ) : mineMedicalAlerts.length === 0 ? (
                    <p className="rounded-xl bg-white/50 px-3 py-6 text-center text-sm text-orange-900/85 dark:bg-black/30 dark:text-orange-50/85">
                      Одоогоор анхааруулга байхгүй.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {mineMedicalAlerts.map((a) => (
                        <li
                          key={a.id}
                          className={`flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm shadow-sm dark:bg-black/35 ${
                            a.level === 'warning'
                              ? 'text-orange-950 dark:text-orange-50'
                              : 'border border-sky-300/35 text-sky-950 dark:border-sky-400/35 dark:text-sky-50'
                          }`}
                        >
                          <ChevronRight
                            className={`mt-0.5 size-4 shrink-0 ${
                              a.level === 'warning'
                                ? 'text-orange-600 dark:text-orange-300'
                                : 'text-sky-600 dark:text-sky-300'
                            }`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 break-words">{a.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}

          {tab === 'psych' && (
            <div className="relative space-y-5">
              <motion.div
                aria-hidden
                className={`pointer-events-none absolute -inset-3 -z-0 rounded-[1.75rem] bg-gradient-to-br ${psychAuraClass} opacity-90 blur-3xl transition-[opacity,filter] duration-700 dark:opacity-100`}
                animate={{
                  opacity: psychAmbient ? 0.95 : 0.45,
                  scale: psychAmbient ? 1.02 : 1,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              />

              <div className="relative z-[1] space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <StudentPsychSessionBooking />
                  <StudentPsychGratitude
                    onJournalEntry={onGratitudeJournalEntry}
                  />
                </div>

                <StudentPsychMoodPicker onMoodChange={onPsychMoodChange} />

                <StudentPsychInteractiveHub />

                <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">
                    Дундаж настроение (7 хоног)
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                    {moodAvg}{' '}
                    <span className="text-base font-normal text-slate-500 dark:text-emerald-100/60">
                      / 10
                    </span>
                  </p>
                  <StudentPsychMoodWeekChart
                    weeklyScores={weeklyScores}
                    activeMood={psychAmbient}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60">
                    Өнөөдрийн санаа
                  </p>
                  <motion.p
                    key={psychAmbient ?? 'psych-default-advice'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-emerald-50/90"
                  >
                    {psychAmbient
                      ? PSYCH_MOOD_ADVICE_BY_ID[psychAmbient]
                      : PSYCH_DEFAULT_ADVICE_TEXT}
                  </motion.p>
                </div>
              </div>

              <div className="relative z-[1] grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                    <NotebookPen className="size-4 text-violet-500" />
                    Сэтгэлийн тэмдэглэл
                  </div>
                  <ul className="space-y-2">
                    {psychJournal.length === 0 ? (
                      <li className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:bg-black/30 dark:text-violet-100/55">
                        Одоогоор тэмдэглэл байхгүй. Талархлаа дээрээс
                        хадгална уу.
                      </li>
                    ) : (
                      psychJournal.map((j) => (
                        <li
                          key={j.id}
                          className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-black/30"
                        >
                          <p className="text-xs font-semibold text-violet-700 dark:text-violet-200">
                            {j.day}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-emerald-50/85">
                            {j.note}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </section>
                <div className="flex flex-col gap-4">
                  <StudentPsychResources />
                  <StudentPsychBreathing />
                </div>
              </div>
              </div>
            </div>
          )}

          {tab === 'pe' && <StudentPeActivitySection />}

          {tab === 'vivera' && <ViveraDashboard embedded />}
        </motion.div>
      </div>
    </div>
  )
}
