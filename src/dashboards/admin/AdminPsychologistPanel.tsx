import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  CalendarHeart,
  ChevronDown,
  Heart,
  MessageCircleHeart,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import { usePsychBookings } from '../../hooks/usePsychBookings'
import { usePsychGratitudeLogs } from '../../hooks/usePsychGratitudeLogs'
import { usePsychMoodLogs } from '../../hooks/usePsychMoodLogs'
import { pushNotification } from '../../lib/notificationsStorage'
import { computeAtRiskStudents } from '../../lib/psychAtRiskStudents'
import {
  addPsychStressTip,
  PSYCH_STRESS_TIPS_EVENT,
  readPsychStressTips,
  removePsychStressTip,
  type PsychStressTip,
} from '../../lib/psychStressTipsStorage'
import type { PsychGratitudeLog, PsychMoodLog, PsychSessionBooking } from '../../types'

const ANON_STUDENT_LABEL = '🔒 Сургуулийн сурагч (Нэр нууцалсан)'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function bookingStudentLabel(b: PsychSessionBooking) {
  return b.isAnonymous ? ANON_STUDENT_LABEL : b.studentName
}

function dateKey(iso: string) {
  return iso.slice(0, 10)
}

type FeedItem =
  | { kind: 'mood'; at: number; log: PsychMoodLog }
  | { kind: 'gratitude'; at: number; log: PsychGratitudeLog }

export default function AdminPsychologistPanel() {
  const { bookings } = usePsychBookings()
  const moodLogs = usePsychMoodLogs()
  const gratitudeLogs = usePsychGratitudeLogs()
  const { students: registryStudents } = useStudentRegistry()
  const [logQuery, setLogQuery] = useState('')
  const [atRiskOpen, setAtRiskOpen] = useState(false)
  const [dailyTip, setDailyTip] = useState('')
  const [publishingTip, setPublishingTip] = useState(false)
  const [stressTipInput, setStressTipInput] = useState('')
  const [stressTips, setStressTips] = useState<PsychStressTip[]>(() =>
    readPsychStressTips(),
  )
  const bookingsSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sync = () => setStressTips(readPsychStressTips())
    window.addEventListener(PSYCH_STRESS_TIPS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PSYCH_STRESS_TIPS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const today = todayIso()

  const bookingsToday = useMemo(
    () => bookings.filter((b) => b.date === today),
    [bookings, today],
  )

  const avgSchoolMood = useMemo(() => {
    const todayMoods = moodLogs.filter((l) => dateKey(l.createdAt) === today)
    const pool = todayMoods.length > 0 ? todayMoods : moodLogs.slice(0, 40)
    if (pool.length === 0) return null
    const sum = pool.reduce((a, l) => a + l.moodScore, 0)
    return (sum / pool.length).toFixed(1)
  }, [moodLogs, today])

  const atRiskStudents = useMemo(
    () => computeAtRiskStudents(moodLogs, registryStudents),
    [moodLogs, registryStudents],
  )

  const atRiskCount = atRiskStudents.length

  function handlePublishDailyTip() {
    const text = dailyTip.trim()
    if (!text) {
      toast.error('Зөвлөмжийн текстээ оруулна уу')
      return
    }
    setPublishingTip(true)
    try {
      pushNotification({
        type: 'psychology',
        text: `Сэтгэл зүйч өдрийн зөвлөмж нийтэллээ: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
      })
      setDailyTip('')
      toast.success('Өдрийн зөвлөмж нийтэллээ')
    } finally {
      setPublishingTip(false)
    }
  }

  function handleAddStressTip() {
    const text = stressTipInput.trim()
    if (!text) {
      toast.error('Стрессийн зөвлөмж оруулна уу')
      return
    }
    addPsychStressTip(text)
    setStressTipInput('')
    setStressTips(readPsychStressTips())
    toast.success('Стрессийн зөвлөмж нэмэгдлээ')
  }

  function handleSupportSession(student: (typeof atRiskStudents)[number]) {
    toast.success('Дэмжлэгийн уулзалт төлөвлөх', {
      description: `${student.displayName} — цаг захиалгын хүснэгт рүү шилжлээ.`,
      duration: 3200,
    })
    setAtRiskOpen(false)
    bookingsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [bookings],
  )

  const activityFeed = useMemo(() => {
    const items: FeedItem[] = [
      ...moodLogs.map((log) => ({
        kind: 'mood' as const,
        at: new Date(log.createdAt).getTime(),
        log,
      })),
      ...gratitudeLogs.map((log) => ({
        kind: 'gratitude' as const,
        at: new Date(log.createdAt).getTime(),
        log,
      })),
    ]
    items.sort((a, b) => b.at - a.at)
    return items
  }, [moodLogs, gratitudeLogs])

  const filteredFeed = useMemo(() => {
    const q = logQuery.trim().toLowerCase()
    if (!q) return activityFeed
    return activityFeed.filter((item) => {
      if (item.kind === 'mood') {
        const l = item.log
        return (
          l.studentName.toLowerCase().includes(q) ||
          l.moodLabelMn.toLowerCase().includes(q) ||
          l.moodEmoji.includes(q) ||
          l.studentEmail.toLowerCase().includes(q)
        )
      }
      const l = item.log
      return (
        l.studentName.toLowerCase().includes(q) ||
        l.combinedNote.toLowerCase().includes(q) ||
        l.field1.toLowerCase().includes(q) ||
        l.field2.toLowerCase().includes(q) ||
        l.field3.toLowerCase().includes(q) ||
        l.studentEmail.toLowerCase().includes(q)
      )
    })
  }, [activityFeed, logQuery])

  const atRiskAccent =
    atRiskCount > 0
      ? 'border-rose-400/55 bg-gradient-to-br from-rose-500/18 via-amber-50/80 to-orange-500/12 ring-1 ring-rose-400/35 dark:from-rose-500/22 dark:via-rose-950/30 dark:to-amber-500/12 dark:ring-rose-500/30'
      : 'border-amber-300/45 bg-gradient-to-br from-amber-500/14 via-white/55 to-rose-500/10 dark:from-amber-500/16 dark:via-white/[0.04] dark:to-rose-500/12'

  const statCards = [
    {
      id: 'bookings',
      label: 'Өнөөдрийн захиалга',
      value: String(bookingsToday.length),
      hint: 'Нийт захиалга: ' + bookings.length,
      icon: Calendar,
      accent:
        'border-violet-300/45 bg-gradient-to-br from-violet-500/18 via-white/60 to-fuchsia-500/12 dark:from-violet-500/22 dark:via-white/[0.05] dark:to-fuchsia-500/15',
      interactive: false,
    },
    {
      id: 'avg',
      label: 'Сургуулийн дундаж сэтгэл',
      value: avgSchoolMood ?? '—',
      hint: avgSchoolMood
        ? 'Сүүлийн 7 хоногийн эмодиг сонголтоос'
        : 'Сурагч эмодиг сонгоход шинэчлэгдэнэ',
      icon: Heart,
      accent:
        'border-fuchsia-300/40 bg-gradient-to-br from-fuchsia-500/15 via-white/55 to-violet-500/12 dark:from-fuchsia-500/18 dark:via-white/[0.04] dark:to-violet-500/14',
      interactive: false,
    },
    {
      id: 'at-risk',
      label: 'Анхаарах сурагчид',
      value: String(atRiskCount),
      hint:
        atRiskCount > 0
          ? 'Дараалж стресс/гуниг эсвэл тэнцээгүй бууралт'
          : 'Сүүлийн 7 хоногт эрсдэл илрээгүй',
      icon: AlertTriangle,
      accent: atRiskAccent,
      interactive: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="xl:col-span-2 space-y-5"
    >
      <section className="rounded-2xl border border-violet-300/45 bg-white/80 p-4 shadow-lg backdrop-blur-2xl dark:border-violet-500/30 dark:bg-slate-950/55">
        <div className="mb-3 flex items-center gap-2">
          <MessageCircleHeart className="size-4 text-violet-600 dark:text-violet-300" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Өдрийн сэтгэл зүйн зөвлөмж
          </h3>
        </div>
        <p className="mb-3 text-xs text-slate-600 dark:text-violet-100/60">
          «Нийтлэх» дармагц бүх сурагчид мэдэгдэл хүлээн авна.
        </p>
        <textarea
          value={dailyTip}
          onChange={(e) => setDailyTip(e.target.value)}
          rows={3}
          placeholder="Жишээ: Стресс ихтэй үед 4-7-8 амьсгалын дасгал хийж үзээрэй…"
          className="w-full resize-y rounded-xl border border-violet-200/60 bg-white/90 px-3 py-2.5 text-sm text-slate-800 outline-none ring-violet-400/0 transition focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/25 dark:border-violet-500/25 dark:bg-black/35 dark:text-violet-50"
        />
        <button
          type="button"
          disabled={publishingTip}
          onClick={handlePublishDailyTip}
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
        >
          {publishingTip ? 'Нийтлэж байна…' : 'Нийтлэх'}
        </button>
      </section>

      <section className="rounded-2xl border border-fuchsia-300/40 bg-white/80 p-4 shadow-lg backdrop-blur-2xl dark:border-fuchsia-500/30 dark:bg-slate-950/55">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-fuchsia-600 dark:text-fuchsia-300" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Стрессийн менежмент — зөвлөмжүүд
          </h3>
        </div>
        <p className="mb-3 text-xs text-slate-600 dark:text-violet-100/60">
          Сурагчийн «Нөөц боломжууд → Стрессийн менежмент» хэсэгт харагдана.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={stressTipInput}
            onChange={(e) => setStressTipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddStressTip()
            }}
            placeholder="Жишээ: 10 минут алхах"
            className="min-w-0 flex-1 rounded-xl border border-fuchsia-200/60 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none focus:border-fuchsia-400/55 focus:ring-2 focus:ring-fuchsia-400/25 dark:border-fuchsia-500/25 dark:bg-black/35 dark:text-fuchsia-50"
          />
          <button
            type="button"
            onClick={handleAddStressTip}
            className="shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            Нэмэх
          </button>
        </div>
        <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
          {stressTips.length === 0 ? (
            <li className="text-xs text-slate-500 dark:text-violet-100/50">
              Одоогоор зөвлөмж алга.
            </li>
          ) : (
            stressTips.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-fuchsia-200/40 bg-fuchsia-500/8 px-3 py-2 text-sm dark:border-fuchsia-500/20"
              >
                <span className="text-slate-800 dark:text-fuchsia-50">{t.text}</span>
                <button
                  type="button"
                  onClick={() => {
                    removePsychStressTip(t.id)
                    setStressTips(readPsychStressTips())
                  }}
                  className="shrink-0 rounded-lg p-1 text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-300"
                  aria-label="Устгах"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {statCards.map((card) => {
          const Icon = card.icon
          const isAtRisk = card.id === 'at-risk'
          const cardInner = (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 text-left">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isAtRisk && atRiskCount > 0
                      ? 'text-rose-800/90 dark:text-rose-200/80'
                      : 'text-violet-800/75 dark:text-violet-200/60'
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`mt-1 text-3xl font-semibold tabular-nums ${
                    isAtRisk && atRiskCount > 0
                      ? 'text-rose-950 dark:text-rose-50'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {card.value}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-violet-100/55">
                  {card.hint}
                </p>
              </div>
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${
                  isAtRisk && atRiskCount > 0
                    ? 'border-rose-400/40 bg-rose-500/15 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/25 dark:text-rose-100'
                    : 'border-violet-300/35 bg-white/70 text-violet-700 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-200'
                }`}
              >
                {isAtRisk && card.interactive ? (
                  <ChevronDown
                    className={`size-5 transition-transform ${atRiskOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                ) : (
                  <Icon className="size-5" aria-hidden />
                )}
              </span>
            </motion.div>
          )

          if (card.interactive) {
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setAtRiskOpen((o) => !o)}
                aria-expanded={atRiskOpen}
                aria-controls="at-risk-panel"
                className={`w-full rounded-2xl border p-4 text-left shadow-sm backdrop-blur-xl transition hover:brightness-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 ${card.accent}`}
              >
                {cardInner}
              </button>
            )
          }

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border p-4 shadow-sm backdrop-blur-xl ${card.accent}`}
            >
              {cardInner}
            </motion.div>
          )
        })}
      </motion.div>


      <AnimatePresence initial={false}>
        {atRiskOpen && (
          <motion.div
            id="at-risk-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-rose-300/45 bg-white/80 p-4 shadow-lg backdrop-blur-2xl dark:border-rose-500/30 dark:bg-slate-950/55">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
                Эрсдэлтэй сурагчид — сүүлийн 7 хоног
              </p>
              {atRiskCount === 0 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-violet-100/60">
                  Одоогоор шалгалтын шалгуурт нийцсэн сурагч алга.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {atRiskStudents.map((s) => (
                    <li
                      key={s.studentEmail}
                      className="flex flex-col gap-3 rounded-xl border border-rose-200/50 bg-rose-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/20 dark:bg-rose-950/30"
                    >
                      <div className="min-w-0 text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {s.displayName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-rose-100/65">
                          {s.classGroup} анги
                          {!s.isAnonymous && s.studentId && (
                            <span className="text-slate-400">
                              {' '}
                              · ID: {s.studentId}
                            </span>
                          )}
                        </p>
                        <ul className="mt-2 space-y-0.5">
                          {s.reasons.map((r) => (
                            <li
                              key={r}
                              className="text-[11px] leading-snug text-rose-900/85 dark:text-rose-100/75"
                            >
                              · {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSupportSession(s)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-110"
                      >
                        <CalendarHeart className="size-3.5" aria-hidden />
                        Дэмжлэгийн уулзалт
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="grid gap-4 lg:grid-cols-2">
        <section
          ref={bookingsSectionRef}
          className="overflow-hidden rounded-2xl border border-violet-300/40 bg-white/75 shadow-lg backdrop-blur-2xl dark:border-violet-500/25 dark:bg-slate-950/50"
        >
          <div className="flex items-center gap-2 border-b border-violet-200/50 bg-gradient-to-r from-violet-500/12 to-fuchsia-500/8 px-4 py-3.5 dark:border-violet-500/20">
            <Calendar className="size-4 text-violet-600 dark:text-violet-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Цаг захиалгын хүснэгт
            </h3>
          </div>
          <div className="max-h-[min(52vh,28rem)] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-[1] bg-violet-50/95 text-[10px] font-semibold uppercase tracking-wider text-violet-900/70 backdrop-blur-md dark:bg-violet-950/80 dark:text-violet-100/55">
                <tr>
                  <th className="px-4 py-2.5">Огноо</th>
                  <th className="px-4 py-2.5">Цаг</th>
                  <th className="px-4 py-2.5">Сурагч</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100/80 dark:divide-violet-500/15">
                {sortedBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-xs text-slate-500 dark:text-violet-100/45"
                    >
                      Сурагч «Захиалах» дармагц энд харагдана.
                    </td>
                  </tr>
                ) : (
                  sortedBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="transition hover:bg-violet-500/[0.06]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-violet-100/75">
                        {b.date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-violet-800 dark:text-violet-200">
                        {b.timeSlot}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                          {b.isAnonymous ? (
                            <span aria-hidden>🔒</span>
                          ) : (
                            <UserCheck className="size-3.5 shrink-0 text-violet-500" />
                          )}
                          {bookingStudentLabel(b)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-violet-300/40 bg-white/75 shadow-lg backdrop-blur-2xl dark:border-violet-500/25 dark:bg-slate-950/50">
          <div className="border-b border-violet-200/50 bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 px-4 py-3.5 dark:border-violet-500/20">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-fuchsia-600 dark:text-fuchsia-300" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Сэтгэл санаа &amp; Талархлын лог
              </h3>
            </div>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-violet-400" />
              <input
                type="search"
                value={logQuery}
                onChange={(e) => setLogQuery(e.target.value)}
                placeholder="Сурагч, эмоди, талархал хайх…"
                className="w-full rounded-xl border border-violet-200/60 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none ring-violet-400/0 transition focus:border-violet-400/55 focus:ring-2 focus:ring-violet-400/25 dark:border-violet-500/25 dark:bg-black/35 dark:text-violet-50"
              />
            </label>
          </div>

          <ul className="max-h-[min(52vh,28rem)] flex-1 space-y-2 overflow-y-auto p-3">
            {filteredFeed.length === 0 ? (
              <li className="rounded-xl bg-violet-500/8 px-3 py-8 text-center text-xs text-slate-500 dark:text-violet-100/50">
                {logQuery.trim()
                  ? 'Хайлтад тохирох бичлэг олдсонгүй.'
                  : 'Сурагч эмодиг сонгох эсвэл талархал хадгалахад энд гарна.'}
              </li>
            ) : (
              filteredFeed.map((item) =>
                item.kind === 'mood' ? (
                  <li
                    key={item.log.id}
                    className="rounded-xl border border-violet-200/50 bg-violet-500/[0.06] px-3 py-2.5 dark:border-violet-500/20 dark:bg-violet-950/35"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">
                          {item.log.studentName}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-violet-100/50">
                          {new Date(item.log.createdAt).toLocaleString(
                            'mn-MN',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-2xl leading-none"
                        title={item.log.moodLabelMn}
                      >
                        {item.log.moodEmoji}
                      </span>
                    </motion.div>
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-violet-50/85">
                      <span className="font-semibold text-violet-700 dark:text-violet-200">
                        Сэтгэл:
                      </span>{' '}
                      {item.log.moodLabelMn} ({item.log.moodScore}/10)
                    </p>
                  </li>
                ) : (
                  <li
                    key={item.log.id}
                    className="rounded-xl border border-fuchsia-200/45 bg-fuchsia-500/[0.06] px-3 py-2.5 dark:border-fuchsia-500/20 dark:bg-fuchsia-950/25"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-left"
                    >
                      <p className="text-xs font-semibold text-fuchsia-900 dark:text-fuchsia-100">
                        {item.log.studentName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-fuchsia-100/50">
                        {item.log.dayLabel}
                      </p>
                    </motion.div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-fuchsia-50/85">
                      {[
                        item.log.field1,
                        item.log.field2,
                        item.log.field3,
                      ].map((val, i) =>
                        val ? (
                          <li key={i}>
                            <span className="font-semibold text-fuchsia-800 dark:text-fuchsia-200">
                              {i + 1}.
                            </span>{' '}
                            {val}
                          </li>
                        ) : null,
                      )}
                    </ul>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-fuchsia-100/45">
                      {item.log.combinedNote}
                    </p>
                  </li>
                ),
              )
            )}
          </ul>
        </section>
      </motion.div>
    </motion.div>
  )
}
