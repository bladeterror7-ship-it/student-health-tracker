import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../context/useAuth'
import { appendPsychGratitudeLog } from '../../lib/psychActivityStorage'

export type PsychJournalEntry = {
  id: string
  day: string
  note: string
}

const WEEKDAY_MN = [
  'Ням',
  'Даваа',
  'Мягмар',
  'Лхагва',
  'Пүрэв',
  'Баасан',
  'Бямба',
] as const

/** Тэмдэглэлийн жагсаалтад харуулах өнөөдрийн огноо. */
export function formatPsychJournalDay(d = new Date()): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${WEEKDAY_MN[d.getDay()]}, ${y}.${mo}.${da}`
}

/** Гурван талбарыг нэг мөр болгон нэгтгэнэ. */
export function combineGratitudeFields(
  first: string,
  second: string,
  third: string,
): string {
  return [first, second, third]
    .map((v) => v.trim())
    .map((v, i) => (v ? `${i + 1}. ${v}` : ''))
    .filter(Boolean)
    .join(', ')
}

export default function StudentPsychGratitude({
  onJournalEntry,
}: {
  onJournalEntry: (entry: PsychJournalEntry) => void
}) {
  const { session } = useAuth()
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [third, setThird] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const f1 = first.trim()
    const f2 = second.trim()
    const f3 = third.trim()
    const note = combineGratitudeFields(first, second, third)
    if (!note) {
      toast.error('Хамгийн багадаа нэг зүйл бичнэ үү')
      return
    }
    if (!session) {
      toast.error('Нэвтрэх шаардлагатай')
      return
    }

    const dayLabel = formatPsychJournalDay()
    const row = appendPsychGratitudeLog({
      studentName: session.displayName?.trim() || 'Сурагч',
      studentEmail: session.email,
      field1: f1,
      field2: f2,
      field3: f3,
      combinedNote: note,
      dayLabel,
    })

    onJournalEntry({
      id: row.id,
      day: dayLabel,
      note,
    })

    setFirst('')
    setSecond('')
    setThird('')

    toast.success('Талархлын тэмдэглэл амжилттай хадгалагдлаа!')
  }

  const fields = [
    [first, setFirst, 'Жишээ: нойр'] as const,
    [second, setSecond, 'найз'] as const,
    [third, setThird, 'ном'] as const,
  ]

  return (
    <section className="rounded-2xl border border-violet-300/40 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/12 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/18 dark:text-violet-200">
          <Heart className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 text-left">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            Өнөөдрийн Талархал
          </h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-violet-100/55">
            Өнөөдөр талархлыг мэдэрсэн гурван зүйлээ товч үгээр бичнэ үү.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm transition-[box-shadow,border-color] duration-300 focus-within:border-violet-400/55 focus-within:shadow-lg focus-within:shadow-violet-500/15 focus-within:ring-1 focus-within:ring-violet-400/25 dark:border-white/10 dark:bg-black/30 dark:focus-within:border-violet-400/40 dark:focus-within:shadow-violet-900/25">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {fields.map(([val, setVal, placeholder], i) => (
              <label key={i} className="block min-w-0 text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-violet-100/45">
                  {i + 1}
                </span>
                <input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  maxLength={48}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-transparent bg-slate-50/90 px-3 py-2 text-sm text-slate-800 outline-none transition-shadow duration-300 placeholder:text-slate-400 focus:border-violet-300/50 focus:bg-white focus:shadow-md focus:shadow-violet-500/15 dark:bg-black/35 dark:text-violet-50 dark:placeholder:text-violet-100/35 dark:focus:border-violet-400/35 dark:focus:bg-black/45 dark:focus:shadow-violet-900/20"
                />
              </label>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-lg font-semibold tracking-tight text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          Хадгалах
        </motion.button>
      </form>
    </section>
  )
}
