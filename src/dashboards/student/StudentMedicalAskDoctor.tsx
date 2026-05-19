import { AnimatePresence, motion } from 'framer-motion'
import {
  CornerDownRight,
  Lock,
  MessageCircleHeart,
  SendHorizontal,
  UserRound,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../context/useAuth'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import { useDoctorQuestions } from '../../hooks/useDoctorQuestions'
import { addDoctorQuestion } from '../../lib/doctorQuestionsStorage'
import { STUDENT_CLASS_OPTIONS } from '../../types'

function formatRelativeMn(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const sec = Math.max(0, Math.floor((now - then) / 1000))
  if (sec < 45) return 'Яг одоо'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} минутын өмнө`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} цагын өмнө`
  const day = Math.floor(hr / 24)
  if (day < 14) return `${day} өдрийн өмнө`
  return new Date(iso).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function StudentMedicalAskDoctor() {
  const { session } = useAuth()
  const { students } = useStudentRegistry()
  const allQuestions = useDoctorQuestions()

  const registryMatch = useMemo(() => {
    if (!session) return undefined
    return students.find(
      (s) => s.email.toLowerCase() === session.email.toLowerCase(),
    )
  }, [students, session])

  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [classOverride, setClassOverride] = useState<string | null>(null)
  const [sentPulse, setSentPulse] = useState(false)

  const classGroup =
    classOverride ??
    registryMatch?.classGroup ??
    STUDENT_CLASS_OPTIONS[0]

  const mine = useMemo(() => {
    if (!session) return []
    const email = session.email.toLowerCase()
    return [...allQuestions]
      .filter((q) => q.studentEmail.toLowerCase() === email)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [allQuestions, session])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    const text = message.trim()
    if (!text) return

    addDoctorQuestion({
      studentEmail: session.email,
      studentDisplayName: registryMatch?.fullName ?? session.displayName,
      anonymous,
      classGroup,
      body: text,
    })

    setMessage('')
    setAnonymous(false)
    setSentPulse(true)
    window.setTimeout(() => setSentPulse(false), 2200)
    toast.success('Асуулт илгээгдлээ', {
      description: 'Эмч хариулах үед доор харагдана.',
    })
  }

  if (!session) return null

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 shadow-sm dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-300">
            <MessageCircleHeart className="size-[1.35rem]" aria-hidden />
          </span>
          <div className="min-w-0 text-left">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Эмчээс асуух
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-emerald-100/55">
              <Lock className="size-3 text-orange-500/90" aria-hidden />
              Нууцлалтай — сургуулийн сувилагч / эмч рүү шууд.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-emerald-200/45 bg-[#E8F5E9]/40 px-3 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/25">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-left text-[11px] leading-snug text-emerald-950 dark:text-emerald-50/90">
            <span className="font-semibold">Нэрээ нуулах</span> — эмчид зөвхөн
            анги харагдана.
          </span>
        </label>

        <label className="block text-left">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/50">
            Анги
          </span>
          <select
            value={classGroup}
            onChange={(e) => setClassOverride(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white/85 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400/55 focus:ring-2 focus:ring-emerald-400/25 dark:border-white/10 dark:bg-black/30 dark:text-emerald-50"
          >
            {STUDENT_CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-left">
          <span className="sr-only">Асуулт</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={800}
            placeholder="Товч тодорхой бичиж, шинж тэмдэг эсвэл эмийн талаар асуух зүйлээ бичнэ үү…"
            className="min-h-[7.5rem] w-full resize-y rounded-xl border border-slate-200/90 bg-white/85 px-3.5 py-3 text-sm leading-relaxed text-slate-800 outline-none ring-orange-400/0 transition placeholder:text-slate-400 focus:border-orange-400/55 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/30 dark:text-emerald-50/95 dark:placeholder:text-emerald-100/35"
          />
          <span className="mt-1 block text-right text-[10px] text-slate-400 dark:text-emerald-100/45">
            {message.length}/800
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <AnimatePresence mode="wait">
            {sentPulse ? (
              <motion.p
                key="ok"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                ✓ Зурвас амжилттай илгээгдлээ.
              </motion.p>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-slate-500 dark:text-emerald-100/50"
              >
                Хариу ажлын 1–2 өдөрт ирнэ гэж үзнэ үү.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={!message.trim()}
            whileHover={
              message.trim()
                ? {
                    scale: 1.02,
                    boxShadow: '0 12px 28px -8px rgba(234,88,12,0.35)',
                  }
                : undefined
            }
            whileTap={message.trim() ? { scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-[8.5rem]"
          >
            <motion.span
              className="inline-flex items-center gap-2"
              animate={sentPulse ? { x: [0, 3, 0] } : {}}
              transition={{ duration: 0.35 }}
            >
              Илгээх
              <SendHorizontal className="size-4" aria-hidden />
            </motion.span>
          </motion.button>
        </div>
      </form>

      {mine.length > 0 && (
        <div className="mt-6 border-t border-slate-200/70 pt-5 dark:border-white/10">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="size-4 text-emerald-700 dark:text-emerald-300" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Миний асуултууд
            </h4>
          </div>
          <ul className="space-y-3">
            {mine.map((q) => (
              <li
                key={q.id}
                className="rounded-2xl border border-emerald-200/45 bg-[#E8F5E9]/35 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-950/25"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      q.status === 'new'
                        ? 'border border-amber-400/55 bg-amber-100 text-amber-950 dark:bg-amber-500/25 dark:text-amber-50'
                        : 'border border-emerald-400/45 bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-50'
                    }`}
                  >
                    {q.status === 'new' ? 'Шинэ' : 'Хариулсан'}
                  </span>
                  <span className="text-[11px] text-emerald-800/65 dark:text-emerald-100/50">
                    {formatRelativeMn(q.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-emerald-50/95">
                  {q.body}
                </p>
                {q.status === 'answered' && q.reply && (
                  <div className="mt-3 flex gap-2 rounded-xl border border-emerald-300/35 bg-white/80 p-3 dark:border-emerald-500/25 dark:bg-black/35">
                    <CornerDownRight
                      className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        Эмчийн хариу
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-emerald-50/95">
                        {q.reply}
                      </p>
                      {q.repliedAt && (
                        <p className="mt-2 text-[10px] text-slate-500 dark:text-emerald-100/45">
                          {formatRelativeMn(q.repliedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
