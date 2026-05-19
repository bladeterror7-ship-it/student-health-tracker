import { AnimatePresence, motion } from 'framer-motion'
import { Inbox, MessageCircleHeart, Send, Stethoscope } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useDoctorQuestions } from '../../hooks/useDoctorQuestions'
import { replyToDoctorQuestion } from '../../lib/doctorQuestionsStorage'
import type { DoctorQuestion } from '../../types'

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

function messageSnippet(text: string, max = 72): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

function senderLabel(q: DoctorQuestion) {
  if (q.anonymous) {
    return {
      title: 'Сурагч (Нэр нууцалсан)',
      classLine: `Анги: ${q.classGroup}`,
    }
  }
  return {
    title: q.studentDisplayName,
    classLine: `Анги: ${q.classGroup}`,
  }
}

export default function AdminDoctorInbox() {
  const questions = useDoctorQuestions()
  const sorted = useMemo(
    () =>
      [...questions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [questions],
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>(
    {},
  )
  const [sendFlash, setSendFlash] = useState(false)

  const selected = useMemo(() => {
    if (sorted.length === 0) return null
    if (selectedId) {
      const found = sorted.find((q) => q.id === selectedId)
      if (found) return found
    }
    return sorted[0] ?? null
  }, [sorted, selectedId])

  const replyDraft =
    selected && selected.id in draftOverrides
      ? draftOverrides[selected.id]
      : (selected?.reply ?? '')

  function handleReplyChange(val: string) {
    if (!selected) return
    setDraftOverrides((prev) => ({ ...prev, [selected.id]: val }))
  }

  const onSendReply = useCallback(() => {
    if (!selected) return
    const text = replyDraft.trim()
    if (!text) {
      toast.error('Хариултаа бичнэ үү')
      return
    }
    const updated = replyToDoctorQuestion(selected.id, text)
    if (!updated) {
      toast.error('Хадгалахад алдаа гарлаа')
      return
    }
    setDraftOverrides((prev) => {
      const next = { ...prev }
      delete next[selected.id]
      return next
    })
    setSendFlash(true)
    window.setTimeout(() => setSendFlash(false), 900)
    toast.success('Хариу амжилттай илгээгдлээ', {
      description: 'Сурагчийн самбарт харагдана.',
    })
  }, [replyDraft, selected])

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-[#E8F5E9]/55 shadow-xl shadow-emerald-900/10 backdrop-blur-2xl dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:shadow-black/40">
      <div className="border-b border-emerald-200/50 bg-white/40 px-5 py-4 dark:border-emerald-500/20 dark:bg-black/20">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-300/60 bg-white/90 text-emerald-800 shadow-sm dark:border-emerald-400/35 dark:bg-emerald-900/60 dark:text-emerald-100">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Эмчийн самбар
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Ирсэн асуултууд
            </h3>
            <p className="text-xs text-emerald-900/75 dark:text-emerald-100/65">
              Нууцлалтай зурвас — зөвхөн эмч / сувилагчид харагдана (демо).
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-[min(70vh,640px)] lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="max-h-[min(70vh,640px)] overflow-y-auto border-b border-emerald-200/40 lg:border-b-0 lg:border-e dark:border-emerald-500/20">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-emerald-900/70 dark:text-emerald-100/60">
              <Inbox className="size-10 opacity-50" aria-hidden />
              <p>Одоогоор асуулт ирээгүй байна.</p>
            </div>
          ) : (
            <ul className="divide-y divide-emerald-200/35 dark:divide-emerald-500/15">
              {sorted.map((q) => {
                const active = selected?.id === q.id
                const { title, classLine } = senderLabel(q)
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(q.id)}
                      className={`flex w-full flex-col gap-2 px-4 py-3.5 text-left transition ${
                        active
                          ? 'bg-white/85 shadow-inner dark:bg-emerald-900/45'
                          : 'bg-transparent hover:bg-white/45 dark:hover:bg-emerald-950/35'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            q.status === 'new'
                              ? 'border border-amber-400/55 bg-amber-100 text-amber-950 dark:bg-amber-500/25 dark:text-amber-50'
                              : 'border border-emerald-400/45 bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-50'
                          }`}
                        >
                          {q.status === 'new' ? 'Шинэ' : 'Хариулсан'}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-800/75 dark:text-emerald-100/55">
                          {formatRelativeMn(q.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {title}
                      </p>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-100/50">
                        {classLine}
                      </p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-emerald-50/70">
                        {messageSnippet(q.body)}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex min-h-0 flex-col bg-white/35 p-4 dark:bg-black/15 sm:p-6">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="flex min-h-0 flex-1 flex-col gap-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-emerald-200/50 bg-[#E8F5E9]/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/40">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          selected.status === 'new'
                            ? 'border border-amber-400/55 bg-amber-100 text-amber-950 dark:bg-amber-500/25 dark:text-amber-50'
                            : 'border border-emerald-400/45 bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-50'
                        }`}
                      >
                        {selected.status === 'new' ? 'Шинэ' : 'Хариулсан'}
                      </span>
                      <span className="text-[11px] text-emerald-800/70 dark:text-emerald-100/50">
                        {formatRelativeMn(selected.createdAt)}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {senderLabel(selected).title}
                    </p>
                    <p className="text-xs text-emerald-800/75 dark:text-emerald-100/55">
                      {senderLabel(selected).classLine}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-xl border border-emerald-300/40 bg-white/80 px-2 py-1 text-[10px] font-medium text-emerald-900 dark:border-emerald-500/30 dark:bg-black/35 dark:text-emerald-100">
                    <MessageCircleHeart className="size-3.5" aria-hidden />
                    Нууцлалтай
                  </span>
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Сурагчийн асуулт
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-emerald-50/95">
                    {selected.body}
                  </p>
                </div>

                <div className="mt-auto flex min-h-0 flex-1 flex-col gap-3">
                  <label className="block min-h-0 flex-1 text-left">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200/75">
                      Хариулах хэсэг
                    </span>
                    <textarea
                      value={replyDraft}
                      onChange={(e) => handleReplyChange(e.target.value)}
                      rows={5}
                      maxLength={2000}
                      placeholder="Эмчийн зөвлөгөө, хариултыг энд бичнэ үү..."
                      className="min-h-[8.5rem] w-full resize-y rounded-2xl border border-emerald-200/70 bg-white/95 px-3.5 py-3 text-sm leading-relaxed text-slate-800 outline-none ring-emerald-400/0 transition placeholder:text-slate-400 focus:border-emerald-500/55 focus:ring-2 focus:ring-emerald-400/25 dark:border-white/10 dark:bg-black/40 dark:text-emerald-50 dark:placeholder:text-emerald-100/35"
                    />
                    <span className="mt-1 block text-right text-[10px] text-slate-400 dark:text-emerald-100/40">
                      {replyDraft.length}/2000
                    </span>
                  </label>

                  {selected.status === 'answered' && selected.repliedAt && (
                    <p className="text-[11px] text-emerald-800/70 dark:text-emerald-100/50">
                      Сүүлд хариулсан: {formatRelativeMn(selected.repliedAt)}
                    </p>
                  )}

                  <motion.button
                    type="button"
                    onClick={onSendReply}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    animate={
                      sendFlash
                        ? {
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              '0 8px 24px -6px rgba(16,185,129,0.35)',
                              '0 14px 36px -4px rgba(16,185,129,0.55)',
                              '0 8px 24px -6px rgba(16,185,129,0.35)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 sm:w-auto sm:min-w-[200px]"
                  >
                    <motion.span
                      className="inline-flex items-center gap-2"
                      animate={
                        sendFlash ? { x: [0, 4, 0], opacity: [1, 0.85, 1] } : {}
                      }
                      transition={{ duration: 0.45 }}
                    >
                      Хариу илгээх
                      <Send className="size-4" aria-hidden />
                    </motion.span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-sm text-emerald-900/65 dark:text-emerald-100/55"
              >
                <MessageCircleHeart className="size-12 opacity-40" />
                <p>Зурвас сонгоно уу — бүтэн текст энд гарна.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
